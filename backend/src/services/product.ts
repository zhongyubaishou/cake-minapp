import prisma from '../utils/prisma';
import { normalizePagination } from '../utils/pagination';
import { BusinessError } from '../utils/errors';

export class ProductService {
  /** 用户端列表（仅上架、启用分类） */
  async list(params: { categoryId?: number; page?: number; pageSize?: number }) {
    const { categoryId } = params;
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 10, maxPageSize: 50 });
    const where: Record<string, unknown> = {
      isOnSale: 1,
      category: { isEnabled: 1 },
    };
    if (categoryId) where.categoryId = categoryId;

    const [list, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /** 用户端详情 */
  async detail(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  /** 后台列表（全部） */
  async listAll(params: { categoryId?: number; page?: number; pageSize?: number }) {
    const { categoryId } = params;
    const { page, pageSize, skip } = normalizePagination(params, { defaultPageSize: 20, maxPageSize: 100 });
    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;

    const [list, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /** 创建商品 */
  async create(data: {
    categoryId: number;
    name: string;
    imageUrl?: string;
    description?: string;
    basePrice: number;
    pricePerPound?: number;
    availablePounds: number[];
    defaultPound?: number;
    availableFlavors: string[];
    defaultFlavor?: string;
    availableThemes: string[];
    defaultTheme?: string;
    sortOrder?: number;
  }) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new BusinessError(400, '分类不存在');
    return prisma.product.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        imageUrl: data.imageUrl ?? null,
        description: data.description ?? null,
        basePrice: data.basePrice,
        pricePerPound: data.pricePerPound ?? 0,
        availablePounds: data.availablePounds as any,
        defaultPound: data.defaultPound ?? 2.0,
        availableFlavors: data.availableFlavors as any,
        defaultFlavor: data.defaultFlavor ?? '原味',
        availableThemes: data.availableThemes as any,
        defaultTheme: data.defaultTheme ?? '成人',
        sortOrder: data.sortOrder ?? 0,
      },
      include: { category: true },
    });
  }

  /** 更新商品 */
  async update(id: number, data: Record<string, unknown>) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new BusinessError(404, '商品不存在');
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  /** 删除商品 */
  async delete(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new BusinessError(404, '商品不存在');
    return prisma.product.delete({ where: { id } });
  }

  /** 上架 */
  async setOnSale(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new BusinessError(404, '商品不存在');
    if (!product.category || product.category.isEnabled !== 1) {
      throw new BusinessError(400, '商品所属分类已禁用，无法上架');
    }
    if (!product.imageUrl) {
      throw new BusinessError(400, '请先上传商品图片');
    }
    return prisma.product.update({ where: { id }, data: { isOnSale: 1 } });
  }

  /** 下架 */
  async setOffSale(id: number) {
    return prisma.product.update({ where: { id }, data: { isOnSale: 0 } });
  }
}

export const productService = new ProductService();
