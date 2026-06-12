import { Context } from 'koa';

/** 通用成功响应 */
export function success<T>(ctx: Context, data: T, message = 'ok') {
  ctx.status = 200;
  ctx.body = { code: 0, message, data };
}

/** 通用分页响应 */
export function paginated<T>(ctx: Context, list: T[], total: number, page: number, pageSize: number) {
  ctx.status = 200;
  ctx.body = {
    code: 0,
    message: 'ok',
    data: { list, total, page, pageSize },
  };
}
