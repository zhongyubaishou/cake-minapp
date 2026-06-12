import { Context } from 'koa';
import { storeService } from '../services/store';
import { success, BusinessError } from '../utils';

export class StoreController {
  /** GET /api/store/config */
  async getConfig(ctx: Context) {
    const config = await storeService.getConfig();
    success(ctx, config);
  }

  /** PUT /admin/settings/store */
  async updateConfig(ctx: Context) {
    const body = ctx.request.body as Record<string, any>;
    await storeService.updateConfig(body);
    const config = await storeService.getConfig();
    success(ctx, config);
  }
}

export const storeController = new StoreController();
