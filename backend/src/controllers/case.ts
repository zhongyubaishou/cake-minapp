import { Context } from 'koa';
import { success, BusinessError } from '../utils';
import { caseService } from '../services/case';

export class CaseController {
  async list(ctx: Context) {
    const { theme, page, pageSize } = ctx.query as Record<string, string>;
    const result = await caseService.listPublic({
      theme,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
    success(ctx, result);
  }

  async detail(ctx: Context) {
    const result = await caseService.detailPublic(Number(ctx.params.id), ctx.state.userId);
    success(ctx, result);
  }

  async favorite(ctx: Context) {
    const result = await caseService.favorite(ctx.state.userId, Number(ctx.params.id));
    success(ctx, result);
  }

  async unfavorite(ctx: Context) {
    const result = await caseService.unfavorite(ctx.state.userId, Number(ctx.params.id));
    success(ctx, result);
  }

  async favorites(ctx: Context) {
    const { page, pageSize } = ctx.query as Record<string, string>;
    const result = await caseService.listFavorites(ctx.state.userId, {
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
    success(ctx, result);
  }

  async listAll(ctx: Context) {
    const { theme, isShown, keyword, page, pageSize } = ctx.query as Record<string, string>;
    const result = await caseService.listAll({
      theme,
      isShown,
      keyword,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    });
    success(ctx, result);
  }

  async create(ctx: Context) {
    const body = ctx.request.body as any;
    if (!body.name) throw new BusinessError(400, '请填写案例名称');
    const result = await caseService.create(body);
    success(ctx, result);
  }

  async update(ctx: Context) {
    const result = await caseService.update(Number(ctx.params.id), ctx.request.body as any);
    success(ctx, result);
  }

  async delete(ctx: Context) {
    await caseService.delete(Number(ctx.params.id));
    success(ctx, null);
  }

  async show(ctx: Context) {
    const result = await caseService.show(Number(ctx.params.id));
    success(ctx, result);
  }

  async hide(ctx: Context) {
    const result = await caseService.hide(Number(ctx.params.id));
    success(ctx, result);
  }
}

export const caseController = new CaseController();
