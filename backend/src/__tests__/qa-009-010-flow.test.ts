/**
 * QA-009: 自提流程测试
 * QA-010: 配送流程测试
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Koa from 'koa';
import {
  createTestApp, req, ensureTestUser, ensureTestAdmin,
  ensureStoreConfig, ensureTestCategory, cleanupTestOrders,
} from './helpers';

let app: Koa;
let userToken: string;
let userId: number;
let adminToken: string;
let categoryId: number;
let selfPickupOrderId: number;
let deliveryOrderId: number;

function futureHours(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

beforeAll(async () => {
  app = createTestApp();
  await ensureStoreConfig();
  const cat = await ensureTestCategory('流程测试分类');
  categoryId = cat.categoryId;
  const user = await ensureTestUser('test-flow-user');
  userId = user.userId;
  userToken = user.token;
  const admin = await ensureTestAdmin('admin');
  adminToken = admin.token;

  const pickupRes = await req(app, 'post', '/api/orders', {
    token: userToken,
    body: {
      source: 'CUSTOM', categoryId,
      buyPound: 2, flavor: '原味', theme: '成人',
      plateCount: 1, candleCount: 1,
      pickupType: 'SELF_PICKUP',
      appointmentTime: futureHours(24),
    },
  });
  selfPickupOrderId = pickupRes.body.data.orderId;

  const deliveryRes = await req(app, 'post', '/api/orders', {
    token: userToken,
    body: {
      source: 'CUSTOM', categoryId,
      buyPound: 2, flavor: '原味', theme: '成人',
      plateCount: 1, candleCount: 1,
      pickupType: 'DELIVERY',
      appointmentTime: futureHours(24),
      address: '附近地址', addressLng: 114.8755, addressLat: 23.5418,
      receiverName: '测试', receiverPhone: '13800000000',
    },
  });
  deliveryOrderId = deliveryRes.body.data.orderId;

  for (const oid of [selfPickupOrderId, deliveryOrderId]) {
    await req(app, 'post', `/admin/orders/${oid}/confirm`, {
      token: adminToken,
      body: { productAmount: 168, deliveryFee: 0 },
    });
  }
});

afterAll(async () => {
  await cleanupTestOrders(userId);
});

describe('QA-009: 自提流程测试', () => {
  it('确认接单后自提订单状态应为 WAIT_PICKUP', async () => {
    const res = await req(app, 'get', `/admin/orders/${selfPickupOrderId}`, { token: adminToken });
    expect(res.body.data.status).toBe('WAIT_PICKUP');
    expect(res.body.data.payStatus).toBe('PAID');
  });

  it('确认取货: WAIT_PICKUP -> COMPLETED', async () => {
    const res = await req(app, 'post', `/admin/orders/${selfPickupOrderId}/pickup-complete`, {
      token: adminToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    const detail = await req(app, 'get', `/admin/orders/${selfPickupOrderId}`, { token: adminToken });
    expect(detail.body.data.status).toBe('COMPLETED');
    expect(detail.body.data.completedAt).toBeDefined();
  });

  it('完成后再确认取货应返回 409', async () => {
    const res = await req(app, 'post', `/admin/orders/${selfPickupOrderId}/pickup-complete`, {
      token: adminToken,
    });
    expect(res.body.code).not.toBe(0);
  });
});

describe('QA-010: 配送流程测试', () => {
  it('确认接单后配送订单状态应为 WAIT_DELIVERY', async () => {
    const res = await req(app, 'get', `/admin/orders/${deliveryOrderId}`, { token: adminToken });
    expect(res.body.data.status).toBe('WAIT_DELIVERY');
    expect(res.body.data.payStatus).toBe('PAID');
  });

  it('开始配送: WAIT_DELIVERY -> DELIVERING', async () => {
    const res = await req(app, 'post', `/admin/orders/${deliveryOrderId}/start-delivery`, {
      token: adminToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    const detail = await req(app, 'get', `/admin/orders/${deliveryOrderId}`, { token: adminToken });
    expect(detail.body.data.status).toBe('DELIVERING');
    expect(detail.body.data.deliveryInfo.deliveryStatus).toBe('DELIVERING');
  });

  it('确认送达: DELIVERING -> COMPLETED', async () => {
    const res = await req(app, 'post', `/admin/orders/${deliveryOrderId}/delivery-complete`, {
      token: adminToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    const detail = await req(app, 'get', `/admin/orders/${deliveryOrderId}`, { token: adminToken });
    expect(detail.body.data.status).toBe('COMPLETED');
    expect(detail.body.data.deliveryInfo.deliveryStatus).toBe('DELIVERED');
  });

  it('完成后再次开始配送应返回 409', async () => {
    const res = await req(app, 'post', `/admin/orders/${deliveryOrderId}/start-delivery`, {
      token: adminToken,
    });
    expect(res.body.code).not.toBe(0);
  });

  it('操作日志应完整记录当前状态流转', async () => {
    const res = await req(app, 'get', `/admin/orders/${deliveryOrderId}/logs`, { token: adminToken });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(0);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    const actions = res.body.data.map((log: any) => log.action);
    expect(actions).toContain('create_order');
    expect(actions).toContain('confirm');
    expect(actions).toContain('start_delivery');
    expect(actions).toContain('delivery_complete');
  });
});
