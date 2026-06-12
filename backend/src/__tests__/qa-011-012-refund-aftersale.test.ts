/**
 * QA-011: 退款流程测试 (V1 不支持)
 * QA-012: 售后反馈测试
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Koa from 'koa';
import {
  createTestApp, req, ensureTestUser, ensureTestAdmin,
  ensureStoreConfig, ensureTestCategory, cleanupTestOrders,
} from './helpers';
import prisma from '../utils/prisma';

let app: Koa;
let userToken: string;
let userId: number;
let adminToken: string;
let adminId: number;
let categoryId: number;
let completedOrderId: number;
let nonCompletedOrderId: number;

function futureHours(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

beforeAll(async () => {
  app = createTestApp();
  await ensureStoreConfig();
  const cat = await ensureTestCategory('售后测试分类');
  categoryId = cat.categoryId;
  const user = await ensureTestUser('test-aftersale-user');
  userId = user.userId;
  userToken = user.token;
  const admin = await ensureTestAdmin('admin');
  adminId = admin.adminId;
  adminToken = admin.token;

  // Create completed order
  const res1 = await req(app, 'post', '/api/orders', {
    token: userToken,
    body: {
      source: 'CUSTOM', categoryId,
      buyPound: 2, flavor: '原味', theme: '成人',
      plateCount: 1, candleCount: 1,
      pickupType: 'SELF_PICKUP',
      appointmentTime: futureHours(24),
    },
  });
  completedOrderId = res1.body.data.orderId;

  // Flow to COMPLETED
  await req(app, 'post', `/admin/orders/${completedOrderId}/confirm`, {
    token: adminToken, body: { productAmount: 168, deliveryFee: 0 },
  });
  await req(app, 'post', `/admin/orders/${completedOrderId}/start-production`, {
    token: adminToken,
  });
  await req(app, 'post', `/admin/orders/${completedOrderId}/finish-production`, {
    token: adminToken,
  });
  await req(app, 'post', `/admin/orders/${completedOrderId}/pickup-complete`, {
    token: adminToken,
  });

  // Create non-completed order
  const res2 = await req(app, 'post', '/api/orders', {
    token: userToken,
    body: {
      source: 'CUSTOM', categoryId,
      buyPound: 2, flavor: '原味', theme: '成人',
      plateCount: 1, candleCount: 1,
      pickupType: 'SELF_PICKUP',
      appointmentTime: futureHours(48),
    },
  });
  nonCompletedOrderId = res2.body.data.orderId;
});

afterAll(async () => {
  await cleanupTestOrders(userId);
});

describe('QA-011: 退款流程测试 (V1 不支持)', () => {
  it('POST /api/orders/:id/refund V1 暂不支持退款', async () => {
    const res = await req(app, 'post', `/api/orders/${completedOrderId}/refund`, {
      token: userToken,
    });
    expect(res.body.code).not.toBe(0);
  });

  it('GET /admin/refunds V1 暂不支持退款', async () => {
    const res = await req(app, 'get', '/admin/refunds', { token: adminToken });
    expect(res.body.code).not.toBe(0);
  });

  it('POST /admin/refunds/:id/approve V1 暂不支持', async () => {
    const res = await req(app, 'post', '/admin/refunds/1/approve', { token: adminToken });
    expect(res.body.code).not.toBe(0);
  });

  it('POST /admin/refunds/:id/reject V1 暂不支持', async () => {
    const res = await req(app, 'post', '/admin/refunds/1/reject', { token: adminToken });
    expect(res.body.code).not.toBe(0);
  });
});

describe('QA-012: 售后反馈测试', () => {
  describe('售后创建', () => {
    it('POST /api/orders/:id/after-sales 未登录应返回 401', async () => {
      const res = await req(app, 'post', `/api/orders/${completedOrderId}/after-sales`, {
        body: { description: '测试售后' },
      });
      expect(res.status).toBe(401);
    });

    it('非完成状态不能提交售后反馈', async () => {
      const res = await req(app, 'post', `/api/orders/${nonCompletedOrderId}/after-sales`, {
        token: userToken, body: { description: '测试售后' },
      });
      expect(res.body.code).not.toBe(0);
    });

    it('已完成订单可提交售后反馈（3天内）', async () => {
      const res = await req(app, 'post', `/api/orders/${completedOrderId}/after-sales`, {
        token: userToken, body: { description: '蛋糕变形了，需要反馈' },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.afterSaleNo).toBeDefined();
      expect(res.body.data.status).toBe('PENDING');
    });

    it('售后记录应出现在后台列表中', async () => {
      const res = await req(app, 'get', '/admin/after-sales', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThan(0);
      const hasOrder = res.body.data.list.some((a: any) => a.orderId === completedOrderId);
      expect(hasOrder).toBe(true);
    });
  });

  describe('售后详情', () => {
    it('可获取售后详情', async () => {
      const listRes = await req(app, 'get', '/admin/after-sales', { token: adminToken });
      const afterSaleId = listRes.body.data.list.find((a: any) => a.orderId === completedOrderId)?.id;
      if (afterSaleId) {
        const res = await req(app, 'get', `/admin/after-sales/${afterSaleId}`, { token: adminToken });
        expect(res.status).toBe(200);
        expect(res.body.data.description).toBe('蛋糕变形了，需要反馈');
        expect(res.body.data.order).toBeDefined();
      }
    });
  });

  describe('售后处理', () => {
    it('老板可标记售后为已处理', async () => {
      const listRes = await req(app, 'get', '/admin/after-sales', { token: adminToken });
      const afterSaleId = listRes.body.data.list.find((a: any) => a.orderId === completedOrderId)?.id;
      const res = await req(app, 'post', `/admin/after-sales/${afterSaleId}/complete`, {
        token: adminToken,
        body: { bossRemark: '已联系用户处理' },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.bossRemark).toBe('已联系用户处理');
      expect(res.body.data.processedAt).toBeDefined();
    });

    it('重复处理应返回 409', async () => {
      const listRes = await req(app, 'get', '/admin/after-sales', { token: adminToken });
      const afterSaleId = listRes.body.data.list.find((a: any) => a.orderId === completedOrderId)?.id;
      const res = await req(app, 'post', `/admin/after-sales/${afterSaleId}/complete`, {
        token: adminToken, body: {},
      });
      expect(res.body.code).not.toBe(0);
    });
  });

  describe('售后时间限制', () => {
    it('超过 3 天售后窗口应被拒绝', async () => {
      await prisma.order.update({
        where: { id: completedOrderId },
        data: { completedAt: new Date(Date.now() - 4 * 86400_000) },
      });
      const res = await req(app, 'post', `/api/orders/${completedOrderId}/after-sales`, {
        token: userToken, body: { description: '超期售后' },
      });
      expect(res.body.code).not.toBe(0);
    });
  });
});
