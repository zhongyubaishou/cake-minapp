/**
 * QA-005: 配送范围测试 - 5km 内外边界
 * QA-006: 预约时间测试 - 少于6小时和超过6小时
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Koa from 'koa';
import {
  createTestApp, req, ensureTestUser,
  ensureStoreConfig, ensureTestCategory, cleanupTestOrders,
} from './helpers';
import { haversineDistance, calcDeliveryFee } from '../utils/delivery';

let app: Koa;
let userToken: string;
let userId: number;
let categoryId: number;

beforeAll(async () => {
  app = createTestApp();
  await ensureStoreConfig();
  const cat = await ensureTestCategory('配送测试分类');
  categoryId = cat.categoryId;
  const user = await ensureTestUser('test-delivery-user');
  userId = user.userId;
  userToken = user.token;
});

afterAll(async () => {
  await cleanupTestOrders(userId);
});

function futureHours(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

describe('QA-005~006: 配送范围与预约时间测试', () => {
  describe('Haversine 距离计算', () => {
    it('同一坐标距离应为 0', () => {
      const d = haversineDistance(23.5238, 114.8575, 23.5238, 114.8575);
      expect(d).toBe(0);
    });

    it('约 1km 距离应在合理范围内', () => {
      const d = haversineDistance(23.5238, 114.8575, 23.5328, 114.8575);
      expect(d).toBeGreaterThan(0.9);
      expect(d).toBeLessThan(1.1);
    });
  });

  describe('配送费计算', () => {
    it('calcDeliveryFee: 0km 费用为 0', () => {
      expect(calcDeliveryFee(0, 2)).toBe(0);
    });

    it('calcDeliveryFee: 2.3km 四舍五入为 2km，费用 4 元', () => {
      expect(calcDeliveryFee(2.3, 2)).toBe(4);
    });

    it('calcDeliveryFee: 2.6km 四舍五入为 3km，费用 6 元', () => {
      expect(calcDeliveryFee(2.6, 2)).toBe(6);
    });

    it('calcDeliveryFee: 4.9km 四舍五入为 5km，费用 10 元', () => {
      expect(calcDeliveryFee(4.9, 2)).toBe(10);
    });
  });

  describe('POST /api/delivery/calculate', () => {
    it('应正确计算范围内配送费', async () => {
      const res = await req(app, 'post', '/api/delivery/calculate', {
        body: { address: '测试地址', longitude: 114.8755, latitude: 23.5418 },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.isInRange).toBe(true);
      expect(res.body.data.distanceKm).toBeGreaterThan(0);
      expect(res.body.data.deliveryFee).toBeGreaterThan(0);
    });

    it('超过 5km 应返回 isInRange: false', async () => {
      const res = await req(app, 'post', '/api/delivery/calculate', {
        body: { address: '超远地址', longitude: 115.0, latitude: 24.0 },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.isInRange).toBe(false);
      expect(res.body.data.message).toContain('超出配送范围');
    });

    it('缺少参数应返回 400', async () => {
      const res = await req(app, 'post', '/api/delivery/calculate', { body: {} });
      expect(res.body.code).not.toBe(0);
    });
  });

  describe('QA-005: 配送下单边界测试', () => {
    it('超范围配送下单应被拒绝', async () => {
      const res = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'CUSTOM', categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'DELIVERY',
          appointmentTime: futureHours(24),
          address: '超远地址', addressLng: 115.0, addressLat: 24.0,
          receiverName: '测试', receiverPhone: '13800000000',
        },
      });
      expect(res.body.code).not.toBe(0);
    });

    it('范围内配送下单应成功', async () => {
      const res = await req(app, 'post', '/api/orders', {
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
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('WAIT_ACCEPT');
    });
  });

  describe('QA-006: 预约时间测试', () => {
    it('少于 6 小时预约应被拒绝', async () => {
      const res = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'CUSTOM', categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(3),
        },
      });
      expect(res.body.code).not.toBe(0);
    });

    it('超过 6 小时预约应成功', async () => {
      const res = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'CUSTOM', categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: futureHours(7),
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    it('7 天后预约应成功', async () => {
      const farFuture = new Date(Date.now() + 7 * 86400_000).toISOString();
      const res = await req(app, 'post', '/api/orders', {
        token: userToken,
        body: {
          source: 'CUSTOM', categoryId,
          buyPound: 2, flavor: '原味', theme: '成人',
          plateCount: 1, candleCount: 1,
          pickupType: 'SELF_PICKUP',
          appointmentTime: farFuture,
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });
});
