/**
 * QA-015: 数据报表测试
 * QA-016: 消息提醒测试
 */
import { describe, it, expect, beforeAll } from 'vitest';
import Koa from 'koa';
import {
  createTestApp, req, ensureTestAdmin, ensureStoreConfig,
} from './helpers';

let app: Koa;
let adminToken: string;

beforeAll(async () => {
  app = createTestApp();
  await ensureStoreConfig();
  const admin = await ensureTestAdmin('admin');
  adminToken = admin.token;
});

describe('QA-015: 数据报表测试', () => {
  describe('报表查询', () => {
    it('GET /admin/reports/summary 应返回报表数据', async () => {
      const res = await req(app, 'get', '/admin/reports/summary', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.orderCount).toBeDefined();
      expect(res.body.data.paidOrderCount).toBeDefined();
      expect(res.body.data.totalSales).toBeDefined();
      expect(res.body.data.totalRefundAmount).toBeDefined();
      expect(res.body.data.statusStats).toBeDefined();
      expect(res.body.data.topProducts).toBeDefined();
    });

    it('GET /admin/reports/summary 支持日期筛选', async () => {
      const res = await req(app, 'get', '/admin/reports/summary', {
        token: adminToken,
        query: { startDate: '2026-01-01', endDate: '2026-12-31' },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    it('未登录不能查看报表', async () => {
      const res = await req(app, 'get', '/admin/reports/summary');
      expect(res.status).toBe(401);
    });
  });

  describe('门店设置', () => {
    it('GET /admin/settings/store 应返回门店配置', async () => {
      const res = await req(app, 'get', '/admin/settings/store', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBeDefined();
      expect(res.body.data.address).toBeDefined();
      expect(res.body.data.deliveryRangeKm).toBeDefined();
      expect(res.body.data.businessHoursStart).toBeDefined();
    });

    it('PUT /admin/settings/store 应能更新门店配置', async () => {
      const res = await req(app, 'put', '/admin/settings/store', {
        token: adminToken,
        body: {
          name: '测试蛋糕店_更新',
          address: '更新后的地址',
          deliveryRangeKm: 5.0,
          deliveryFeePerKm: 2.0,
          minAdvanceHours: 6,
          businessHoursStart: '06:00:00',
          businessHoursEnd: '18:00:00',
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });
});

describe('QA-016: 消息提醒测试', () => {
  describe('提醒设置', () => {
    it('GET /admin/settings/reminders 应返回提醒设置', async () => {
      const res = await req(app, 'get', '/admin/settings/reminders', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      const data = res.body.data;
      expect(data.orderConfirmNotice).toBeDefined();
      expect(data.newOrderSound).toBeDefined();
      expect(data.appointmentSound).toBeDefined();
    });

    it('PUT /admin/settings/reminders 应能更新提醒设置', async () => {
      const res = await req(app, 'put', '/admin/settings/reminders', {
        token: adminToken,
        body: {
          orderConfirmNotice: 1, paidNotice: 1, productionNotice: 1,
          pickupNotice: 1, deliveryNotice: 1, completeNotice: 1,
          refundNotice: 1, newOrderSound: 1, paidSound: 1,
          refundSound: 1, afterSaleSound: 1, appointmentSound: 1,
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    it('更新后再查询应反映最新值', async () => {
      const res = await req(app, 'get', '/admin/settings/reminders', { token: adminToken });
      expect(res.body.data.paidNotice).toBeTruthy();
      expect(res.body.data.paidSound).toBeTruthy();
    });

    it('未登录不能查看提醒设置', async () => {
      const res = await req(app, 'get', '/admin/settings/reminders');
      expect(res.status).toBe(401);
    });
  });

  describe('非营业时间预约标记', () => {
    it('门店营业时间配置应正确', async () => {
      const res = await req(app, 'get', '/admin/settings/store', { token: adminToken });
      expect(res.body.data.businessHoursStart).toBe('06:00:00');
      expect(res.body.data.businessHoursEnd).toBe('18:00:00');
    });
  });
});
