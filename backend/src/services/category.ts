import prisma from '../utils/prisma';
import { BusinessError } from '../utils/errors';

export class CategoryService {
  /** 用户端列表（仅启用） */
  async listEnabled() {
    return prisma.category.findMany({
      where: { isEnabled: 1 },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** 后台列表（全部） */
  async listAll() {
    return prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** 创建分类 */
  async create(data: { name: string; sortOrder?: number }) {
    return prisma.category.create({ data });
  }

  /** 更新分类 */
  async update(id: number, data: { name?: string; sortOrder?: number; isEnabled?: number }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new BusinessError(404, '分类不存在');
    return prisma.category.update({ where: { id }, data });
  }

  /** 删除分类（校验无商品） */
  async delete(id: number) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new BusinessError(404, '分类不存在');
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new BusinessError(400, '该分类下存在商品，无法删除');
    }
    return prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
