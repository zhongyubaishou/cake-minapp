import { Context } from 'koa';
import { success } from '../utils';
import { reminderService } from '../services/reminder';

export class ReminderController {
  async getSettings(ctx: Context) {
    success(ctx, await reminderService.getSettings());
  }

  async updateSettings(ctx: Context) {
    success(ctx, await reminderService.updateSettings(ctx.request.body as any));
  }
}

export const reminderController = new ReminderController();
