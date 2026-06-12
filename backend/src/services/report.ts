import prisma from '../utils/prisma';

export class ReportService {
  async summary(params: { startDate?: string; endDate?: string }) {
    const range = this.getDateRange(params.startDate, params.endDate);
    const where = { orderedAt: range };
    const paidWhere = { orderedAt: range, payStatus: 'PAID' as const };

    const [orderCount, paidOrderCount, salesResult, refundResult, statusRows, topRows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: paidWhere }),
      prisma.order.aggregate({ where: paidWhere, _sum: { totalAmount: true } }),
      prisma.refundRecord.aggregate({ where: { completedAt: range, refundStatus: 'REFUNDED' }, _sum: { amount: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { status: true }, where }),
      prisma.order.groupBy({
        by: ['productName'],
        where: paidWhere,
        _count: { productName: true },
        _sum: { totalAmount: true },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      orderCount,
      paidOrderCount,
      totalSales: salesResult._sum.totalAmount || 0,
      totalRefundAmount: refundResult._sum.amount || 0,
      statusStats: statusRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count.status;
        return acc;
      }, {}),
      topProducts: topRows.map((row) => ({
        productName: row.productName,
        count: row._count.productName,
        amount: row._sum.totalAmount || 0,
      })),
    };
  }

  private getDateRange(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date(start);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);

    return { gte: start, lt: end };
  }
}

export const reportService = new ReportService();
