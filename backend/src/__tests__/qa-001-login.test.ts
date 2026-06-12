/**
 * QA-001: 用户登录测试 - 微信登录、手机号授权
 */
import { describe, it, expect, beforeAll } from 'vitest';
import Koa from 'koa';
import { createTestApp, req, ensureTestUser } from './helpers';

let app: Koa;

beforeAll(() => {
  app = createTestApp();
});

describe('QA-001: 用户登录测试', () => {
  describe('健康检查', () => {
    it('GET /api/health 应该返回 ok', async () => {
      const res = await req(app, 'get', '/api/health');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('ok');
    });

    it('GET /admin/health 应该返回 ok', async () => {
      const res = await req(app, 'get', '/admin/health');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('门店配置查询', () => {
    it('GET /api/store/config 无需登录应返回门店配置', async () => {
      const res = await req(app, 'get', '/api/store/config');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('首页数据', () => {
    it('GET /api/home 无需登录应返回首页聚合数据', async () => {
      const res = await req(app, 'get', '/api/home');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('微信登录', () => {
    it('POST /api/user/login 无 code 应该返回 400', async () => {
      const res = await req(app, 'post', '/api/user/login', { body: {} });
      expect(res.body.code).not.toBe(0);
    });

    it('POST /api/user/login 无效 code 应该由微信返回错误', async () => {
      const res = await req(app, 'post', '/api/user/login', { body: { code: 'invalid_code' } });
      expect(res.body.code).not.toBe(0);
    });
  });

  describe('手机号授权/绑定', () => {
    it('POST /api/user/bind-phone 未登录应该返回 401', async () => {
      const res = await req(app, 'post', '/api/user/bind-phone', {
        body: { code: 'phone_code' },
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/user/bind-phone 无 phoneCode 应该返回错误', async () => {
      const user = await ensureTestUser();
      const res = await req(app, 'post', '/api/user/bind-phone', {
        body: {},
        token: user.token,
      });
      expect(res.body.code).not.toBe(0);
    });
  });

  describe('用户信息查询', () => {
    it('GET /api/user/profile 未登录应返回 401', async () => {
      const res = await req(app, 'get', '/api/user/profile');
      expect(res.status).toBe(401);
    });

    it('GET /api/user/profile 已登录应返回用户信息', async () => {
      const user = await ensureTestUser();
      const res = await req(app, 'get', '/api/user/profile', { token: user.token });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.id).toBe(user.userId);
      expect(res.body.data.phone).toBe('13800138000');
    });
  });
});
