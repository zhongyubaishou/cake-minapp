import { Context } from 'koa';
import { success, BusinessError } from '../utils';
import { orderService } from '../services/order';
import { haversineDistance, calcDeliveryFee } from '../utils/delivery';
import { assertStateTransition } from '../utils/stateMachine';
import { OrderStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export class OrderController {
  /** 计算配送费用 */
  async calcDelivery(ctx: Context) {
    const { address, longitude, latitude } = ctx.request.body as {
      address: string; longitude: number; latitude: number;
    };
    if (!address || longitude == null || latitude == null) {
      throw new BusinessError(400, '请提供地址和坐标');
    }

    const store = await prisma.storeConfig.findFirst();
    if (!store) throw new BusinessError(500, '门店配置未初始化');

    const distanceKm = haversineDistance(
      store.lat.toNumber(), store.lng.toNumber(),
      latitude, longitude,
    );
    const rangeKm = store.deliveryRangeKm.toNumber();
    const isInRange = distanceKm <= rangeKm;
    const deliveryFee = calcDeliveryFee(distanceKm, store.deliveryFeePerKm.toNumber());

    success(ctx, {
      distanceKm,
      deliveryFee,
      isInRange,
      message: isInRange ? '' : `超出配送范围（${rangeKm}公里），请选择自提`,
    });
  }

  /** 创建订单 */
  async create(ctx: Context) {
    const body = ctx.request.body as any;
    const order = await orderService.create({
      userId: ctx.state.userId,
      source: body.source,
      productId: body.productId,
      caseId: body.caseId,
      categoryId: body.categoryId,
      buyPound: body.buyPound,
      flavor: body.flavor,
      theme: body.theme,
      blessingText: body.blessingText,
      plateCount: body.plateCount,
      candleCount: body.candleCount,
      referenceImages: body.referenceImages,
      pickupType: body.pickupType,
      appointmentTime: body.appointmentTime,
      address: body.address,
      addressLng: body.addressLng,
      addressLat: body.addressLat,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      receiverName: body.receiverName,
      receiverPhone: body.receiverPhone,
      userRemark: body.userRemark,
    });
    success(ctx, { orderId: order.id, orderNo: order.orderNo, status: order.status });
  }

  /** 获取用户订单列表 */
  async list(ctx: Context) {
    const { status, page, pageSize } = ctx.query as Record<string, string>;
    const result = await orderService.listByUser(ctx.state.userId, {
      status, page: Number(page) || 1, pageSize: Number(pageSize) || 10,
    });
    success(ctx, result);
  }

  /** 获取订单详情 */
  async detail(ctx: Context) {
    const order = ctx.state.adminUserId
      ? await orderService.detail(Number(ctx.params.id))
      : await orderService.detailByUser(Number(ctx.params.id), ctx.state.userId);
    if (!order) throw new BusinessError(404, '订单不存在');
    success(ctx, order);
  }

  /** 用户取消订单 */
  async cancel(ctx: Context) {
    await orderService.cancelByUser(Number(ctx.params.id), ctx.state.userId);
    success(ctx, null);
  }

  /** 支付接口 - V1 版本不接入在线支付 */
  async pay(ctx: Context) {
    throw new BusinessError(400, 'V1 版本不接入在线支付，订单由老板确认接单时即为已支付');
  }

  /** 获取后台订单列表 */
  async listAll(ctx: Context) {
    const { status, statuses, appointmentDate, pickupType, keyword, page, pageSize } = ctx.query as Record<string, string>;
    const result = await orderService.listAll({
      status, statuses, appointmentDate, pickupType, keyword,
      page: Number(page) || 1, pageSize: Number(pageSize) || 20,
    });
    success(ctx, result);
  }

  /** 确认接单 */
  async confirm(ctx: Context) {
    const { productAmount, deliveryFee, bossRemark } = ctx.request.body as {
      productAmount: number; deliveryFee: number; bossRemark?: string;
    };
    await orderService.confirm(Number(ctx.params.id), ctx.state.adminUserId, {
      productAmount, deliveryFee, bossRemark,
    });
    success(ctx, null);
  }

  /** 调整配送费 */
  async adjustPrice(ctx: Context) {
    const { deliveryFee } = ctx.request.body as { deliveryFee: number };
    await orderService.adjustPrice(Number(ctx.params.id), ctx.state.adminUserId, deliveryFee);
    success(ctx, null);
  }

  /** 老板取消订单 */
  async cancelByAdmin(ctx: Context) {
    const { reason } = ctx.request.body as { reason: string };
    if (!reason || !reason.trim()) throw new BusinessError(400, '取消原因不能为空');
    await orderService.cancelByAdmin(Number(ctx.params.id), ctx.state.adminUserId, reason);
    success(ctx, null);
  }

  /** 开始制作 - 商家要求跳过，接单后直接进入待自提/待配送 */
  // async startProduction(ctx: Context) {
  //   const orderId = Number(ctx.params.id);
  //   const order = await prisma.order.findUnique({ where: { id: orderId } });
  //   if (!order) throw new BusinessError(404, '订单不存在');
  //   assertStateTransition(order.status as OrderStatus, 'MAKING');
  //
  //   await prisma.$transaction(async (tx) => {
  //     await tx.order.update({
  //       where: { id: orderId },
  //       data: { status: 'MAKING', isStartedMaking: 1, startMakingAt: new Date() },
  //     });
  //     await tx.operationLog.create({
  //       data: {
  //         targetType: 'ORDER', targetId: orderId,
  //         operatorType: 'ADMIN', operatorId: ctx.state.adminUserId,
  //         action: 'start_production', fromStatus: order.status, toStatus: 'MAKING',
  //       },
  //     });
  //   });
  //   success(ctx, null);
  // }

  /** 完成制作 - 商家要求跳过，接单后直接进入待自提/待配送 */
  // async finishProduction(ctx: Context) {
  //   const orderId = Number(ctx.params.id);
  //   const order = await prisma.order.findUnique({ where: { id: orderId } });
  //   if (!order) throw new BusinessError(404, '订单不存在');
  //   const nextStatus: OrderStatus = order.pickupType === 'DELIVERY' ? 'WAIT_DELIVERY' : 'WAIT_PICKUP';
  //   assertStateTransition(order.status as OrderStatus, nextStatus);
  //
  //   await prisma.$transaction(async (tx) => {
  //     await tx.order.update({
  //       where: { id: orderId },
  //       data: { status: nextStatus, finishedProductionAt: new Date() },
  //     });
  //     await tx.operationLog.create({
  //       data: {
  //         targetType: 'ORDER', targetId: orderId,
  //         operatorType: 'ADMIN', operatorId: ctx.state.adminUserId,
  //         action: 'finish_production', fromStatus: order.status, toStatus: nextStatus,
  //       },
  //     });
  //   });
  //   success(ctx, null);
  // }

  /** 确认取货完成 */
  async pickupComplete(ctx: Context) {
    const orderId = Number(ctx.params.id);

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new BusinessError(404, '订单不存在');
      if (order.pickupType !== 'SELF_PICKUP') throw new BusinessError(400, '仅自提订单可确认取货');
      assertStateTransition(order.status as OrderStatus, 'COMPLETED');

      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      if (result.count === 0) throw new BusinessError(409, '订单状态已变更，请刷新后重试');

      await tx.operationLog.create({
        data: {
          targetType: 'ORDER', targetId: orderId,
          operatorType: 'ADMIN', operatorId: ctx.state.adminUserId,
          action: 'pickup_complete', fromStatus: order.status, toStatus: 'COMPLETED',
        },
      });
    });
    success(ctx, null);
  }

  /** 开始配送 */
  async startDelivery(ctx: Context) {
    const orderId = Number(ctx.params.id);

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new BusinessError(404, '订单不存在');
      if (order.pickupType !== 'DELIVERY') throw new BusinessError(400, '仅配送订单可开始配送');
      assertStateTransition(order.status as OrderStatus, 'DELIVERING');

      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: 'DELIVERING', startedDeliveryAt: new Date() },
      });
      if (result.count === 0) throw new BusinessError(409, '订单状态已变更，请刷新后重试');

      await tx.deliveryInfo.update({
        where: { orderId },
        data: { deliveryStatus: 'DELIVERING' },
      });
      await tx.operationLog.create({
        data: {
          targetType: 'ORDER', targetId: orderId,
          operatorType: 'ADMIN', operatorId: ctx.state.adminUserId,
          action: 'start_delivery', fromStatus: order.status, toStatus: 'DELIVERING',
        },
      });
    });
    success(ctx, null);
  }

  /** 确认送达 */
  async deliveryComplete(ctx: Context) {
    const orderId = Number(ctx.params.id);

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new BusinessError(404, '订单不存在');
      if (order.pickupType !== 'DELIVERY') throw new BusinessError(400, '仅配送订单可确认送达');
      assertStateTransition(order.status as OrderStatus, 'COMPLETED');

      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      if (result.count === 0) throw new BusinessError(409, '订单状态已变更，请刷新后重试');

      await tx.deliveryInfo.update({
        where: { orderId },
        data: { deliveryStatus: 'DELIVERED' },
      });
      await tx.operationLog.create({
        data: {
          targetType: 'ORDER', targetId: orderId,
          operatorType: 'ADMIN', operatorId: ctx.state.adminUserId,
          action: 'delivery_complete', fromStatus: order.status, toStatus: 'COMPLETED',
        },
      });
    });
    success(ctx, null);
  }

  /** 获取订单操作日志 */
  async getLogs(ctx: Context) {
    const orderId = Number(ctx.params.id);
    const logs = await prisma.operationLog.findMany({
      where: { targetType: 'ORDER', targetId: orderId },
      orderBy: { createdAt: 'desc' },
    });
    success(ctx, logs);
  }
}

export const orderController = new OrderController();