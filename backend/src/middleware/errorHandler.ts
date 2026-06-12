import { Context, Next } from 'koa';
import { BusinessError } from '../utils/errors';

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof BusinessError) {
      ctx.status = err.code >= 400 && err.code < 600 ? err.code : 500;
      ctx.body = {
        code: err.code,
        message: err.message,
        data: null,
      };
    } else {
      console.error('未处理异常:', err);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '服务器内部错误',
        data: null,
      };
    }
  }
}
