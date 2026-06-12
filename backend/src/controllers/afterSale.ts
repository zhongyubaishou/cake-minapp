import { Context } from 'koa';
import { success, BusinessError } from '../utils';
import { afterSaleService } from '../services/afterSale';

export class AfterSaleController {
  async create(ctx: Context) {
    const { description, images } = ctx.request.body as { description: string; images?: string[] };
    if (!description) throw new BusinessError(400, '请填写问题描述');
    const result = await afterSaleService.create(ctx.state.userId, Number(ctx.params.id), { description, images });
    success(ctx, result);
  }

  async listAll(ctx: Context) {
    const { status, keyword, page, pageSize } = ctx.query as Record<string, string>;
    const result = await afterSaleService.listAll({
      status,
      keyword,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
    success(ctx, result);
  }

  async detail(ctx: Context) {
    const result = await afterSaleService.detail(Number(ctx.params.id));
    success(ctx, result);
  }

  async complete(ctx: Context) {
    const { bossRemark } = ctx.request.body as { bossRemark?: string };
    const result = await afterSaleService.complete(Number(ctx.params.id), ctx.state.adminUserId, bossRemark);
    success(ctx, result);
  }
}

export const afterSaleController = new AfterSaleController();
