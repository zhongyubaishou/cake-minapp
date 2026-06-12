import prisma from '../utils/prisma';

function getBeijingDayRange(now = new Date()) {
  const beijingNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const year = beijingNow.getUTCFullYear();
  const month = beijingNow.getUTCMonth();
  const date = beijingNow.getUTCDate();
  const start = new Date(Date.UTC(year, month, date) - 8 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export class DashboardService {
  /** 获取工作台统计数据 */
  async getStats() {
    const { start: today, end: tomorrow } = getBeijingDayRange();

    const [
      todayOrders,
      todayPaidOrders,
      waitAcceptCount,
      paidWaitMakeCount,
      makingCount,
      waitPickupCount,
      waitDeliveryCount,
      deliveringCount,
      refundingCount,
      afterSalePendingCount,
      outsideHoursCount,
      latestOrders,
      salesResult,
      refundResult,
    ] = await Promise.all([
      prisma.order.count({
        where: { orderedAt: { gte: today, lt: tomorrow } },
      }),
      prisma.order.count({
        where: { paidAt: { gte: today, lt: tomorrow }, payStatus: 'PAID' },
      }),
      prisma.order.count({ where: { status: 'WAIT_ACCEPT' } }),
      prisma.order.count({ where: { status: 'PAID_WAIT_MAKE' } }),
      prisma.order.count({ where: { status: 'MAKING' } }),
      prisma.order.count({ where: { status: 'WAIT_PICKUP' } }),
      prisma.order.count({ where: { status: 'WAIT_DELIVERY' } }),
      prisma.order.count({ where: { status: 'DELIVERING' } }),
      prisma.order.count({ where: { status: 'REFUNDING' } }),
      prisma.afterSale.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { isOutsideHours: 1, status: { in: ['WAIT_ACCEPT', 'WAIT_PICKUP', 'WAIT_DELIVERY', 'DELIVERING'] } } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { orderedAt: 'desc' },
        select: { id: true, orderNo: true, productName: true, status: true, totalAmount: true, orderedAt: true, isOutsideHours: true },
      }),
      prisma.order.aggregate({
        where: { paidAt: { gte: today, lt: tomorrow }, payStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.refundRecord.aggregate({
        where: { completedAt: { gte: today, lt: tomorrow }, refundStatus: 'REFUNDED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      todayOrders,
      todayPaidOrders,
      todaySales: salesResult._sum.totalAmount || 0,
      todayRefundAmount: refundResult._sum.amount || 0,
      waitAcceptCount,
      paidWaitMakeCount,
      makingCount,
      waitPickupCount,
      waitDeliveryCount,
      deliveringCount,
      refundingCount,
      afterSalePendingCount,
      outsideHoursCount,
      latestOrders,
    };
  }
}

export const dashboardService = new DashboardService();
