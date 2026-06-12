/**
 * QA-002: 商品下单测试
 * QA-003: 定制下单测试
 * QA-004: 案例定制测试
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Koa from 'koa';
import {
  createTestApp, req, ensureTestUser,
  ensureStoreConfig, ensureTestCategory, ensureTestProduct, ensureTestCase,
  cleanupTestOrders,
} from './helpers';
import prisma from '../utils/prisma';
import { generateUserToken } from '../utils/jwt';

let app: Koa;
let userToken: string;
let userId: number;
let noPhoneUserId: number;
let noPhoneUserToken: string;
let categoryId: number;
let productId: number;
let caseId: number;

beforeAll(async () => {
  app = createTestApp();
  await ensureStoreConfig();
  const cat = await ensureTestCategory('生日蛋糕', 1);
  categoryId = cat.categoryId;
  const prod = await ensureTestProduct(categoryId, '商品下单测试蛋糕');
  productId = prod.productId;
  const cs = await ensureTestCase('案例定制测试案例');
  caseId = cs.caseId;
  const user = await ensureTestUser('test-order-user');
  userId = user.userId;
  userToken = user.token;

  const noPhoneUser = await prisma.user.upsert({
    where: { openId: 'test-order-no-phone-user' },
    create: {
      openId: 'test-order-no-phone-user',
      nickname: '无手机号测试用户',
      phone: null,
      lastLoginAt: new Date(),
    },
    update: {
      phone: null,
      status: 1,
      lastLoginAt: new Date(),
    },
  });
  noPhoneUserId = noPhoneUser.id;
  noPhoneUserToken = generateUserToken(noPhoneUser.id);
});

afterAll(async () => {
  await cleanupTestOrders(userId);
  if (noPhoneUserId) await cleanupTestOrders(noPhoneUserId);
});

function futureHours(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

describe('QA-002~004: 下单测试', () => {
  describe('商品浏览', () => {
    it('GET /api/categories 应返回已启用分类列表', async () => {
      const res = await req(app, 'get', '/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/products 应返回上架商品列表', async () => {
      const res = await req(app, 'get', '/api/products');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThan(0);
    });

    it('GET /api/products/:id 应返回商品详情', async () => {
      const res = await req(app, 'get', `/api/products/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.id).toBe(productId);
    });
  });

  describe('QA-002: 商品下单', () => {
    it('POST /api/orders 未登录应返回 401', async () => {
      const res = await req(app, 'post', '/api/orders', {
        body: {
          source: 'PRODUCT', productId, categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(24),
        },
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/orders 商品下单（自提）应成功创建订单', async () => {
      const res = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'PRODUCT', productId, categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(24),
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('WAIT_ACCEPT');
      expect(res.body.data.orderNo).toBeDefined();
    });

    it('POST /api/orders 已登录但未绑定手机号也可自提下单', async () => {
      const res = await req(app, 'post', '/api/orders', {
        token: noPhoneUserToken,
        body: {
          source: 'PRODUCT', productId, categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(24),
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('WAIT_ACCEPT');
    });

    it('商品下单后订单列表应有该订单', async () => {
      const res = await req(app, 'get', '/api/orders', { token: userToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.list.length).toBeGreaterThan(0);
    });
  });

  describe('QA-003: 定制下单', () => {
    it('POST /api/orders 定制下单应成功创建订单', async () => {
      const res = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'CUSTOM', categoryId,
          buyPound: 3, flavor: '巧克力', theme: '儿童',
          blessingText: '生日快乐',
          plateCount: 2, candleCount: 5,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(30),
          userRemark: '测试定制备注',
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('WAIT_ACCEPT');
    });

    it('定制下单订单详情应包含定制信息', async () => {
      const listRes = await req(app, 'get', '/api/orders', { token: userToken });
      const orderId = listRes.body.data.list[0].id;
      const res = await req(app, 'get', `/api/orders/${orderId}`, { token: userToken });
      expect(res.status).toBe(200);
      expect(res.body.data.customization).toBeDefined();
      expect(res.body.data.customization.blessingText).toBe('生日快乐');
      expect(res.body.data.customization.flavor).toBe('巧克力');
    });
  });

  describe('QA-004: 案例定制', () => {
    it('案例有图片时可获取案例详情', async () => {
      const res = await req(app, 'get', `/api/cases/${caseId}`, { token: userToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBe('案例定制测试案例');
    });

    it('POST /api/orders 案例定制下单应成功', async () => {
      const res = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'CASE', caseId, categoryId,
          buyPound: 2, flavor: '草莓', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(36),
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('WAIT_ACCEPT');
    });
  });

  describe('取消订单', () => {
    it('POST /api/orders/:id/cancel 未登录应返回 401', async () => {
      const res = await req(app, 'post', '/api/orders/1/cancel');
      expect(res.status).toBe(401);
    });

    it('待接单状态订单可被用户取消', async () => {
      const createRes = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'CUSTOM', categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(48),
        },
      });
      const orderId = createRes.body.data.orderId;
      const cancelRes = await req(app, 'post', `/api/orders/${orderId}/cancel`, { token: userToken });
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.code).toBe(0);
      const detailRes = await req(app, 'get', `/api/orders/${orderId}`, { token: userToken });
      expect(detailRes.body.data.status).toBe('CANCELED');
    });
  });
});
