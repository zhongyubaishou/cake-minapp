import { Context } from 'koa';
import { productService } from '../services/product';
import { success, BusinessError } from '../utils';

export class ProductController {
  /** GET /api/products */
  async list(ctx: Context) {
    const { categoryId, page, pageSize } = ctx.query as Record<string, string>;
    const result = await productService.list({
      categoryId: categoryId ? Number(categoryId) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    success(ctx, result);
  }

  /** GET /api/products/:id */
  async detail(ctx: Context) {
    const product = await productService.detail(Number(ctx.params.id));
    if (!product) throw new BusinessError(404, '商品不存在');
    success(ctx, product);
  }

  /** GET /admin/products */
  async listAll(ctx: Context) {
    const { categoryId, page, pageSize } = ctx.query as Record<string, string>;
    const result = await productService.listAll({
      categoryId: categoryId ? Number(categoryId) : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    success(ctx, result);
  }

  /** POST /admin/products */
  async create(ctx: Context) {
    const body = ctx.request.body as any;
    if (!body.categoryId || !body.name || body.basePrice == null) {
      throw new BusinessError(400, '必填字段：分类、商品名称、起售价');
    }
    const product = await productService.create(body);
    success(ctx, product);
  }

  /** PUT /admin/products/:id */
  async update(ctx: Context) {
    const product = await productService.update(Number(ctx.params.id), ctx.request.body as any);
    success(ctx, product);
  }

  /** DELETE /admin/products/:id */
  async delete(ctx: Context) {
    await productService.delete(Number(ctx.params.id));
    success(ctx, null);
  }

  /** POST /admin/products/:id/on */
  async on(ctx: Context) {
    const product = await productService.setOnSale(Number(ctx.params.id));
    success(ctx, product);
  }

  /** POST /admin/products/:id/off */
  async off(ctx: Context) {
    const product = await productService.setOffSale(Number(ctx.params.id));
    success(ctx, product);
  }
}

export const productController = new ProductController();
