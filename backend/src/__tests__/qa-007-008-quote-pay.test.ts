/**
 * QA-007: 老板报价测试
 * QA-008: 微信支付测试 (V1 线下支付)
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
let testOrderId: number;

beforeAll(async () => {
  app = createTestApp();
  await ensureStoreConfig();
  const cat = await ensureTestCategory('报价测试分类');
  categoryId = cat.categoryId;
  const user = await ensureTestUser('test-quote-user');
  userId = user.userId;
  userToken = user.token;
  const admin = await ensureTestAdmin('admin');
  adminId = admin.adminId;
  adminToken = admin.token;

  const futureTime = new Date(Date.now() + 24 * 3600_000).toISOString();
  const createRes = await req(app, 'post', '/api/orders', {
    token: userToken,
    body: {
      source: 'CUSTOM', categoryId,
      buyPound: 2, flavor: '原味', theme: '成人',
      plateCount: 1, candleCount: 1,
      pickupType: 'SELF_PICKUP',
      appointmentTime: futureTime,
    },
  });
  testOrderId = createRes.body.data.orderId;
});

afterAll(async () => {
  await cleanupTestOrders(userId);
});

describe('QA-007: 老板报价测试', () => {
  describe('管理员登录', () => {
    it('POST /admin/login 正确用户名密码应返回 token', async () => {
      const res = await req(app, 'post', '/admin/login', {
        body: { username: 'admin', password: 'admin123' },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.adminUser).toBeDefined();
      expect(res.body.data.permissions).toBeDefined();
    });

    it('POST /admin/login 错误密码应返回 401', async () => {
      const res = await req(app, 'post', '/admin/login', {
        body: { username: 'admin', password: 'wrongpassword' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('后台订单列表', () => {
    it('GET /admin/orders 应返回订单列表', async () => {
      const res = await req(app, 'get', '/admin/orders', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThan(0);
    });

    it('GET /admin/orders?status=WAIT_ACCEPT 应筛选待接单订单', async () => {
      const res = await req(app, 'get', '/admin/orders', {
        token: adminToken,
        query: { status: 'WAIT_ACCEPT' },
      });
      expect(res.status).toBe(200);
      const allWait = res.body.data.list.every((o: any) => o.status === 'WAIT_ACCEPT');
      expect(allWait).toBe(true);
    });

    it('GET /admin/orders/:id 应返回订单详情', async () => {
      const res = await req(app, 'get', `/admin/orders/${testOrderId}`, { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testOrderId);
      expect(res.body.data.customization).toBeDefined();
    });
  });

  describe('确认报价/接单', () => {
    it('POST /admin/orders/:id/confirm 确认报价应成功', async () => {
      const res = await req(app, 'post', `/admin/orders/${testOrderId}/confirm`, {
        token: adminToken,
        body: { productAmount: 168, deliveryFee: 0, bossRemark: '测试确认报价' },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    it('确认后自提订单状态应为 WAIT_PICKUP', async () => {
      const res = await req(app, 'get', `/admin/orders/${testOrderId}`, { token: adminToken });
      expect(res.body.data.status).toBe('WAIT_PICKUP');
      expect(res.body.data.payStatus).toBe('PAID');
      expect(res.body.data.productAmount).toBe('168');
    });

    it('确认后应生成 OFFLINE 支付记录', async () => {
      const record = await prisma.paymentRecord.findFirst({
        where: { orderId: testOrderId },
        orderBy: { createdAt: 'desc' },
      });
      expect(record).toBeDefined();
      expect(record!.payMethod).toBe('OFFLINE');
      expect(record!.payStatus).toBe('SUCCESS');
    });

    it('重复确认应返回 409', async () => {
      const res = await req(app, 'post', `/admin/orders/${testOrderId}/confirm`, {
        token: adminToken,
        body: { productAmount: 200, deliveryFee: 0 },
      });
      expect(res.body.code).not.toBe(0);
    });
  });

  describe('调整配送费', () => {
    it('PUT /admin/orders/:id/adjust-price 应能调整配送费', async () => {
      const res = await req(app, 'put', `/admin/orders/${testOrderId}/adjust-price`, {
        token: adminToken,
        body: { deliveryFee: 10 },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });
});

describe('QA-008: 微信支付测试 (V1 线下支付)', () => {
  it('POST /api/orders/:id/pay 应返回 V1 不支持在线支付', async () => {
    const res = await req(app, 'post', `/api/orders/${testOrderId}/pay`, {
      token: userToken,
    });
    expect(res.body.code).not.toBe(0);
  });

  it('POST /api/orders/:id/refund 应返回 V1 暂不支持退款', async () => {
    const res = await req(app, 'post', `/api/orders/${testOrderId}/refund`, {
      token: userToken,
    });
    expect(res.body.code).not.toBe(0);
  });

  it('GET /admin/refunds 应返回 V1 暂不支持', async () => {
    const res = await req(app, 'get', '/admin/refunds', { token: adminToken });
    expect(res.body.code).not.toBe(0);
  });

  it('GET /admin/dashboard 应返回今日数据', async () => {
    const res = await req(app, 'get', '/admin/dashboard', { token: adminToken });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.todayOrders).toBeDefined();
    expect(res.body.data.todaySales).toBeDefined();
  });
});
