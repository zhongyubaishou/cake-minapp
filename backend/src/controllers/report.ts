import { Context } from 'koa';
import { success } from '../utils';
import { reportService } from '../services/report';

export class ReportController {
  async summary(ctx: Context) {
    const { startDate, endDate } = ctx.query as Record<string, string>;
    const result = await reportService.summary({ startDate, endDate });
    success(ctx, result);
  }
}

export const reportController = new ReportController();
