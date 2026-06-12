import { Context } from 'koa';
import { success } from '../utils';
import prisma from '../utils/prisma';

export class HomeController {
  /** GET /api/home — 聚合首页数据 */
  async index(ctx: Context) {
    const [store, categories, hotProducts, caseCount] = await Promise.all([
      prisma.storeConfig.findFirst({
        select: {
          name: true,
          address: true,
          businessHoursStart: true,
          businessHoursEnd: true,
          deliveryRangeKm: true,
          pricePerPound: true,
          qrCodeUrl: true,
        },
      }),
      prisma.category.findMany({
        where: { isEnabled: 1 },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.product.findMany({
        where: { isOnSale: 1, category: { isEnabled: 1 } },
        orderBy: { sortOrder: 'asc' },
        take: 6,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          basePrice: true,
          pricePerPound: true,
        },
      }),
      prisma.cakeCase.count({ where: { isShown: 1 } }),
    ]);

    success(ctx, {
      store: store || {},
      categories,
      hotProducts,
      caseCount,
    });
  }
}

export const homeController = new HomeController();
