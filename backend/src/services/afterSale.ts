import prisma from '../utils/prisma';
import { BusinessError } from '../utils/errors';
import { normalizePagination } from '../utils/pagination';

export class AfterSaleService {
  async create(userId: number, orderId: number, data: { description: string; images?: string[] }) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw new BusinessError(404, '订单不存在');
    if (order.status !== 'COMPLETED' || !order.completedAt) {
      throw new BusinessError(400, '仅已完成订单可提交售后反馈');
    }

    const existing = await prisma.afterSale.findFirst({
      where: { orderId, status: 'PENDING' },
    });
    if (existing) throw new BusinessError(409, '该订单已有在处理中的售后反馈');

    const closeAt = new Date(order.completedAt.getTime() + 3 * 86400000);
    if (Date.now() > closeAt.getTime()) {
      throw new BusinessError(400, '售后入口已关闭（订单完成后 3 天内可申请）');
    }

    const afterSaleNo = this.generateAfterSaleNo();

    return prisma.$transaction(async (tx) => {
      const afterSale = await tx.afterSale.create({
        data: {
          afterSaleNo,
          orderId,
          userId,
          userPhone: order.userPhone,
          description: data.description,
          images: data.images as any ?? null,
        },
      });

      await tx.operationLog.create({
        data: {
          targetType: 'AFTER_SALE',
          targetId: afterSale.id,
          operatorType: 'USER',
          operatorId: userId,
          action: 'create_after_sale',
          toStatus: 'PENDING',
        },
      });

      return afterSale;
    });
  }

  async listAll(params: { status?: string; keyword?: string; page?: number; pageSize?: number }) {
    const { status, keyword } = params;
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 10, maxPageSize: 100 });
    const where: any = {};
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { afterSaleNo: { contains: keyword } },
        { userPhone: { contains: keyword } },
        { order: { orderNo: { contains: keyword } } },
      ];
    }

    const [list, total] = await Promise.all([
      prisma.afterSale.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { submittedAt: 'desc' },
        include: { order: true },
      }),
      prisma.afterSale.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async detail(id: number) {
    const afterSale = await prisma.afterSale.findUnique({
      where: { id },
      include: { order: { include: { customization: true, deliveryInfo: true } } },
    });
    if (!afterSale) throw new BusinessError(404, '售后记录不存在');
    return afterSale;
  }

  async complete(id: number, adminId: number, bossRemark?: string) {
    return prisma.$transaction(async (tx) => {
      const afterSale = await tx.afterSale.findUnique({ where: { id } });
      if (!afterSale) throw new BusinessError(404, '售后记录不存在');
      if (afterSale.status === 'COMPLETED') throw new BusinessError(409, '当前售后反馈已处理');
      const updated = await tx.afterSale.update({
        where: { id },
        data: { status: 'COMPLETED', bossRemark: bossRemark ?? null, processedAt: new Date() },
      });

      await tx.operationLog.create({
        data: {
          targetType: 'AFTER_SALE',
          targetId: id,
          operatorType: 'ADMIN',
          operatorId: adminId,
          action: 'complete_after_sale',
          fromStatus: afterSale.status,
          toStatus: 'COMPLETED',
          remark: bossRemark ?? null,
        },
      });

      return updated;
    });
  }

  private generateAfterSaleNo() {
    const now = new Date();
    const dateTime = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `AS${dateTime}${random}`;
  }
}

export const afterSaleService = new AfterSaleService();
