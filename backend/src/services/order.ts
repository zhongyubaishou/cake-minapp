import prisma from '../utils/prisma';
import { BusinessError } from '../utils/errors';
import { assertStateTransition } from '../utils/stateMachine';
import { haversineDistance, calcDeliveryFee } from '../utils/delivery';
import { normalizePagination } from '../utils/pagination';
import { OrderStatus, Prisma } from '@prisma/client';

interface CreateOrderInput {
  userId: number;
  source: 'PRODUCT' | 'CUSTOM' | 'CASE';
  productId?: number;
  caseId?: number;
  categoryId: number;
  buyPound: number;
  flavor: string;
  theme: string;
  blessingText?: string;
  plateCount: number;
  candleCount: number;
  referenceImages?: string[];
  pickupType: 'SELF_PICKUP' | 'DELIVERY';
  appointmentTime: string;
  address?: string;
  addressLng?: number;
  addressLat?: number;
  distanceKm?: number;
  contactName?: string;
  contactPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  userRemark?: string;
}

export class OrderService {
  /** 创建订单 */
  async create(input: CreateOrderInput) {
    // 商家要求：不强制手机号授权
    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user || user.status === 0) throw new BusinessError(401, '账号不可用，请重新登录');

    // 获取门店配置
    const storeConfig = await prisma.storeConfig.findFirst();
    if (!storeConfig) throw new BusinessError(500, '门店配置未初始化');

    // 校验每日订单限量
    if (storeConfig.dailyOrderLimit != null && storeConfig.dailyOrderLimit > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayCount = await prisma.order.count({
        where: {
          orderedAt: { gte: todayStart },
          status: { notIn: ['CANCELED', 'REFUNDED'] },
        },
      });
      if (todayCount >= storeConfig.dailyOrderLimit) {
        throw new BusinessError(400, `今日订单量已达上限（${storeConfig.dailyOrderLimit}单），请明天再下单`);
      }
    }

    // 校验预约时间：必须大于等于当前时间加上提前预约小时数
    const apptTime = new Date(input.appointmentTime);
    const minTime = new Date(Date.now() + storeConfig.minAdvanceHours * 3600_000);
    if (apptTime < minTime) {
      throw new BusinessError(400, `预约时间需提前至少 ${storeConfig.minAdvanceHours} 小时`);
    }

    // 获取分类和商品信息（快照）
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new BusinessError(400, '分类不存在');

    let productName = '定制蛋糕';
    let productImageUrl: string | null = null;
    let productBasePrice: number = 0;
    let productPricePerPound: number = 0;
    if (input.productId) {
      const product = await prisma.product.findUnique({ where: { id: input.productId } });
      if (product) {
        productName = product.name;
        productImageUrl = product.imageUrl;
        productBasePrice = Number(product.basePrice ?? 0);
        productPricePerPound = Number(product.pricePerPound ?? 0);
      }
    }

    // 计算是否在非营业时间（支持跨天营业，如18:00～次日02:00）
    const apptHour = apptTime.getHours() + apptTime.getMinutes() / 60;
    const [startH, startM] = (storeConfig.businessHoursStart as string).split(':').map(Number);
    const [endH, endM] = (storeConfig.businessHoursEnd as string).split(':').map(Number);
    const start = startH + (startM || 0) / 60;
    const end = endH + (endM || 0) / 60;
    const isOutsideHours = start <= end
      ? (apptHour < start || apptHour > end ? 1 : 0)
      : (apptHour < start && apptHour > end ? 1 : 0);

    // 配送校验：以后端根据坐标重算距离和费用，避免信任前端传值
    let distanceKm = 0;
    let systemFee = 0;
    let finalFee = 0;
    if (input.pickupType === 'DELIVERY') {
      if (!input.address || input.addressLng == null || input.addressLat == null) {
        throw new BusinessError(400, '请选择配送地址');
      }
      distanceKm = haversineDistance(
        storeConfig.lat.toNumber(),
        storeConfig.lng.toNumber(),
        Number(input.addressLat),
        Number(input.addressLng),
      );
      if (distanceKm > storeConfig.deliveryRangeKm.toNumber()) {
        throw new BusinessError(400, `超出配送范围（${storeConfig.deliveryRangeKm}公里），请选择自提`);
      }
      systemFee = calcDeliveryFee(distanceKm, storeConfig.deliveryFeePerKm.toNumber());
      finalFee = systemFee;
    }

    const orderNo = this.generateOrderNo();

    // 创建订单（事务）
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNo,
          userId: input.userId,
          userNickname: input.contactName || user.nickname,
          userPhone: (input.contactPhone || user.phone) ?? null,
          source: input.source,
          productId: input.productId ?? null,
          caseId: input.caseId ?? null,
          categoryId: input.categoryId,
          categoryName: category.name,
          productName,
          productImageUrl,
          status: 'WAIT_ACCEPT',
          pickupType: input.pickupType,
          appointmentTime: apptTime,
          isOutsideHours,
          deliveryFee: finalFee,
          userRemark: input.userRemark ?? null,
          orderedAt: new Date(),
        },
      });

      // 创建定制信息
      await tx.orderCustomization.create({
        data: {
          orderId: o.id,
          buyPound: input.buyPound,
          actualMakePound: input.buyPound * 1.5,
          flavor: input.flavor,
          theme: input.theme,
          blessingText: input.blessingText ?? null,
          plateCount: input.plateCount,
          candleCount: input.candleCount,
          referenceImages: input.referenceImages as any ?? null,
          specialRemark: input.userRemark ?? null,
        },
      });

      // 创建配送信息（如需要）
      if (input.pickupType === 'DELIVERY') {
        await tx.deliveryInfo.create({
          data: {
            orderId: o.id,
            receiverName: input.receiverName ?? user.nickname,
            receiverPhone: (input.receiverPhone || input.contactPhone || user.phone) ?? null,
            address: input.address!,
            addressLng: input.addressLng!,
            addressLat: input.addressLat!,
            distanceKm,
            systemFee,
            finalFee,
          },
        });
      }

      // 创建操作日志
      await tx.operationLog.create({
        data: {
          targetType: 'ORDER',
          targetId: o.id,
          operatorType: 'USER',
          operatorId: input.userId,
          action: 'create_order',
          toStatus: 'WAIT_ACCEPT',
        },
      });

      return o;
    });

    return order;
  }

  /** 用户端订单列表 */
  async listByUser(userId: number, params: { status?: string; page?: number; pageSize?: number }) {
    const { status } = params;
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 10, maxPageSize: 50 });
    const where: any = { userId };
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { orderedAt: 'desc' },
        include: { customization: true, deliveryInfo: true },
      }),
      prisma.order.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /** 获取用户订单详情 */
  async detailByUser(orderId: number, userId: number) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      include: this.detailInclude(),
    });
  }

  /** 获取订单详情 */
  async detail(orderId: number) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: this.detailInclude(),
    });
  }

  /** 用户取消订单 */
  async cancelByUser(orderId: number, userId: number) {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.userId !== userId) throw new BusinessError(404, '订单不存在');
      assertStateTransition(order.status as OrderStatus, 'CANCELED');

      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: 'CANCELED', cancelReason: '用户取消' },
      });
      if (result.count === 0) throw new BusinessError(409, '订单状态已变更，请刷新后重试');

      const o = await tx.order.findUnique({ where: { id: orderId } });
      await tx.operationLog.create({
        data: {
          targetType: 'ORDER', targetId: orderId,
          operatorType: 'USER', operatorId: userId,
          action: 'cancel', fromStatus: order.status, toStatus: 'CANCELED',
        },
      });
      return o!;
    });
    return updated;
  }

  /** 后台订单列表 */
  async listAll(params: {
    status?: string; statuses?: string; appointmentDate?: string; pickupType?: string;
    keyword?: string; page?: number; pageSize?: number;
  }) {
    const { status, statuses, appointmentDate, pickupType, keyword } = params;
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 20, maxPageSize: 100 });
    const where: any = {};
    if (status) where.status = status;
    else if (statuses) where.status = { in: statuses.split(',') };
    if (pickupType) where.pickupType = pickupType;
    if (appointmentDate) {
      const d = new Date(appointmentDate);
      where.appointmentTime = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { userPhone: { contains: keyword } },
        { userNickname: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { orderedAt: 'desc' },
        include: { customization: true, deliveryInfo: true, category: true, product: true },
      }),
      prisma.order.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /** 老板确认接单 - 商家要求：接单后直接进入待自提/待配送（跳过制作状态） */
  async confirm(orderId: number, adminId: number, data: {
    productAmount?: number; deliveryFee: number; bossRemark?: string;
  }) {
    const storeConfig = await prisma.storeConfig.findFirst();
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { customization: true },
      });
      if (!order) throw new BusinessError(404, '订单不存在');
      const targetStatus = order.pickupType === 'DELIVERY' ? 'WAIT_DELIVERY' : 'WAIT_PICKUP';
      assertStateTransition(order.status as OrderStatus, targetStatus);

      const storePricePerPound = storeConfig?.pricePerPound?.toNumber() ?? 0;
      const product = order.productId ? await tx.product.findUnique({ where: { id: order.productId } }) : null;
      const basePrice = product?.basePrice?.toNumber() ?? 0;
      const productPricePerPound = product?.pricePerPound?.toNumber();
      const pricePerPound = (productPricePerPound != null && productPricePerPound > 0)
        ? productPricePerPound
        : storePricePerPound;
      const buyPound = order.customization?.buyPound?.toNumber() ?? 0;
      const defaultPound = product?.defaultPound?.toNumber() ?? 2;
      const extraPounds = Math.max(0, buyPound - defaultPound);
      const productAmount = data.productAmount != null
        ? Number(data.productAmount)
        : basePrice + pricePerPound * extraPounds;
      const totalAmount = productAmount + Number(data.deliveryFee);
      if (Number(data.deliveryFee) < 0) throw new BusinessError(400, '配送费不能为负数');
      if (productAmount <= 0) throw new BusinessError(400, '商品金额必须大于0');

      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: {
          status: targetStatus,
          payStatus: 'PAID',
          productAmount,
          deliveryFee: data.deliveryFee,
          totalAmount,
          bossRemark: data.bossRemark ?? null,
          acceptedAt: now,
          paidAt: now,
        },
      });
      if (result.count === 0) throw new BusinessError(409, '订单状态已变更，请刷新后重试');
      const o = await tx.order.findUnique({ where: { id: orderId } });
      if (o!.pickupType === 'DELIVERY') {
        await tx.deliveryInfo.update({
          where: { orderId },
          data: { finalFee: data.deliveryFee },
        });
      }
      await tx.paymentRecord.create({
        data: {
          orderId,
          outTradeNo: `OFFLINE_${o!.orderNo}`,
          amount: totalAmount,
          payStatus: 'SUCCESS',
          payMethod: 'OFFLINE',
          paidAt: now,
        },
      });
      await tx.operationLog.create({
        data: {
          targetType: 'ORDER', targetId: orderId,
          operatorType: 'ADMIN', operatorId: adminId,
          action: 'confirm', fromStatus: order.status, toStatus: targetStatus,
        },
      });
      return o!;
    });
    return updated;
  }

  /** 老板取消订单 */
  async cancelByAdmin(orderId: number, adminId: number, reason: string) {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new BusinessError(404, '订单不存在');
      assertStateTransition(order.status as OrderStatus, 'CANCELED');

      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: 'CANCELED', cancelReason: reason },
      });
      if (result.count === 0) throw new BusinessError(409, '订单状态已变更，请刷新后重试');

      const o = await tx.order.findUnique({ where: { id: orderId } });
      await tx.operationLog.create({
        data: {
          targetType: 'ORDER', targetId: orderId,
          operatorType: 'ADMIN', operatorId: adminId,
          action: 'cancel', fromStatus: order.status, toStatus: 'CANCELED',
          remark: reason,
        },
      });
      return o!;
    });
    return updated;
  }

  /** 调整配送费（支持待接单、待自提、待配送订单） */
  async adjustPrice(orderId: number, adminId: number, deliveryFee: number) {
    if (deliveryFee < 0) throw new BusinessError(400, '配送费不能为负数');
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || !['WAIT_ACCEPT', 'WAIT_PICKUP', 'WAIT_DELIVERY'].includes(order.status as string)) {
        throw new BusinessError(409, '仅待接单/待自提/待配送订单可调整配送费');
      }
      const totalAmount = (order.productAmount?.toNumber() ?? 0) + deliveryFee;

      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { deliveryFee, totalAmount },
      });
      if (result.count === 0) throw new BusinessError(409, '订单状态已变更，请刷新后重试');

      const o = await tx.order.findUnique({ where: { id: orderId } });
      if (o!.pickupType === 'DELIVERY') {
        await tx.deliveryInfo.update({
          where: { orderId },
          data: { finalFee: deliveryFee },
        });
      }
      await tx.operationLog.create({
        data: {
          targetType: 'ORDER', targetId: orderId,
          operatorType: 'ADMIN', operatorId: adminId,
          action: 'adjust_price',
          remark: `调整配送费为 ${deliveryFee}`,
        },
      });
      return o!;
    });
    return updated;
  }

  private detailInclude() {
    return {
      customization: true,
      deliveryInfo: true,
      paymentRecords: true,
      refundRecords: true,
      category: true,
      product: true,
    } satisfies Prisma.OrderInclude;
  }

  private generateOrderNo() {
    const now = new Date();
    const dateTime = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${dateTime}${random}`;
  }
}

export const orderService = new OrderService();