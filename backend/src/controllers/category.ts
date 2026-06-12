import { Context } from 'koa';
import { categoryService } from '../services/category';
import { success, BusinessError } from '../utils';

export class CategoryController {
  /** GET /api/categories（用户端，仅启用） */
  async list(ctx: Context) {
    const categories = await categoryService.listEnabled();
    success(ctx, categories);
  }

  /** GET /admin/categories（后台，全部） */
  async listAll(ctx: Context) {
    const categories = await categoryService.listAll();
    success(ctx, categories);
  }

  /** POST /admin/categories */
  async create(ctx: Context) {
    const { name, sortOrder } = ctx.request.body as { name: string; sortOrder?: number };
    if (!name) throw new BusinessError(400, '分类名称必填');
    const category = await categoryService.create({ name, sortOrder });
    success(ctx, category);
  }

  /** PUT /admin/categories/:id */
  async update(ctx: Context) {
    const id = Number(ctx.params.id);
    const body = ctx.request.body as { name?: string; sortOrder?: number; isEnabled?: number };
    const category = await categoryService.update(id, body);
    success(ctx, category);
  }

  /** DELETE /admin/categories/:id */
  async delete(ctx: Context) {
    const id = Number(ctx.params.id);
    await categoryService.delete(id);
    success(ctx, null);
  }
}

export const categoryController = new CategoryController();
