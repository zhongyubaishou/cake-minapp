/**
 * QA-013: 后台商品管理测试
 * QA-014: 后台案例管理测试
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Koa from 'koa';
import {
  createTestApp, req, ensureTestAdmin, ensureTestCategory,
} from './helpers';
import prisma from '../utils/prisma';

let app: Koa;
let adminToken: string;
let categoryId: number;

beforeAll(async () => {
  app = createTestApp();
  const cat = await ensureTestCategory('管理测试分类');
  categoryId = cat.categoryId;
  const admin = await ensureTestAdmin('admin');
  adminToken = admin.token;
});

afterAll(async () => {
  const testProds = await prisma.product.findMany({
    where: { name: { contains: '管理测试' } },
  });
  for (const p of testProds) {
    await prisma.product.delete({ where: { id: p.id } }).catch(() => {});
  }
  const testCases = await prisma.cakeCase.findMany({
    where: { name: { contains: '管理测试' } },
  });
  for (const c of testCases) {
    await prisma.userFavorite.deleteMany({ where: { caseId: c.id } }).catch(() => {});
    await prisma.cakeCase.delete({ where: { id: c.id } }).catch(() => {});
  }
  const testCats = await prisma.category.findMany({
    where: { name: { contains: '管理测试' }, NOT: { id: categoryId } },
  });
  for (const c of testCats) {
    await prisma.category.delete({ where: { id: c.id } }).catch(() => {});
  }
});

describe('QA-013: 后台商品管理测试', () => {
  let testProductId: number;

  describe('分类管理', () => {
    it('GET /admin/categories 应返回全部分类', async () => {
      const res = await req(app, 'get', '/admin/categories', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });

    it('未登录不能访问分类管理', async () => {
      const res = await req(app, 'get', '/admin/categories');
      expect(res.status).toBe(401);
    });
  });

  describe('商品创建', () => {
    it('POST /admin/products 应能创建商品', async () => {
      const res = await req(app, 'post', '/admin/products', {
        token: adminToken,
        body: {
          categoryId, name: '管理测试商品_新增',
          imageUrl: 'https://example.com/test.jpg',
          description: '测试描述', basePrice: 199,
          availablePounds: [1, 2, 3], defaultPound: 2.0,
          availableFlavors: ['原味', '巧克力'], defaultFlavor: '原味',
          availableThemes: ['成人', '儿童'], defaultTheme: '成人',
          sortOrder: 1,
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBe('管理测试商品_新增');
      testProductId = res.body.data.id;
    });

    it('未登录不能创建商品', async () => {
      const res = await req(app, 'post', '/admin/products', {
        body: { categoryId, name: '非法创建', basePrice: 100, availablePounds: [1], availableFlavors: ['原味'], availableThemes: ['成人'] },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('商品详情', () => {
    it('GET /admin/products/:id 应返回商品详情', async () => {
      const res = await req(app, 'get', `/admin/products/${testProductId}`, { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('管理测试商品_新增');
    });
  });

  describe('商品编辑', () => {
    it('PUT /admin/products/:id 应能更新商品信息', async () => {
      const res = await req(app, 'put', `/admin/products/${testProductId}`, {
        token: adminToken,
        body: { name: '管理测试商品_已编辑', basePrice: 299 },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('管理测试商品_已编辑');
    });
  });

  describe('商品上下架', () => {
    it('POST /admin/products/:id/off 应能下架商品', async () => {
      const res = await req(app, 'post', `/admin/products/${testProductId}/off`, {
        token: adminToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.isOnSale).toBe(0);
    });

    it('POST /admin/products/:id/on 应能上架商品', async () => {
      const res = await req(app, 'post', `/admin/products/${testProductId}/on`, {
        token: adminToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.isOnSale).toBe(1);
    });
  });

  describe('分类删除约束', () => {
    it('空分类可以删除', async () => {
      const createRes = await req(app, 'post', '/admin/categories', {
        token: adminToken,
        body: { name: '管理测试分类_待删除', sortOrder: 99 },
      });
      const newCatId = createRes.body.data.id;
      const res = await req(app, 'delete', `/admin/categories/${newCatId}`, {
        token: adminToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('商品删除', () => {
    it('DELETE /admin/products/:id 应能删除商品', async () => {
      const res = await req(app, 'delete', `/admin/products/${testProductId}`, {
        token: adminToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      const detailRes = await req(app, 'get', `/admin/products/${testProductId}`, { token: adminToken });
      expect(detailRes.body.code).not.toBe(0);
    });
  });
});

describe('QA-014: 后台案例管理测试', () => {
  let testCaseId: number;

  describe('案例创建', () => {
    it('POST /admin/cases 应能创建案例', async () => {
      const res = await req(app, 'post', '/admin/cases', {
        token: adminToken,
        body: {
          imageUrl: 'https://example.com/case-test.jpg',
          name: '管理测试案例_新增',
          theme: '成人', referencePound: 2.0, referencePrice: 168, sortOrder: 1,
        },
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.name).toBe('管理测试案例_新增');
      expect(res.body.data.isShown).toBe(1);
      testCaseId = res.body.data.id;
    });

    it('无图案例设置展示应被拒绝', async () => {
      const res = await req(app, 'post', '/admin/cases', {
        token: adminToken,
        body: { name: '管理测试案例_无图', isShown: 1 },
      });
      expect(res.body.code).not.toBe(0);
    });
  });

  describe('案例列表', () => {
    it('GET /admin/cases 应返回全部案例', async () => {
      const res = await req(app, 'get', '/admin/cases', { token: adminToken });
      expect(res.status).toBe(200);
      expect(res.body.data.list.length).toBeGreaterThan(0);
    });

    it('GET /api/cases 用户端仅展示已展示案例', async () => {
      const res = await req(app, 'get', '/api/cases');
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('案例编辑', () => {
    it('PUT /admin/cases/:id 应能更新案例', async () => {
      const res = await req(app, 'put', `/admin/cases/${testCaseId}`, {
        token: adminToken,
        body: { name: '管理测试案例_已编辑', referencePrice: 199 },
      });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('管理测试案例_已编辑');
    });
  });

  describe('案例展示/隐藏', () => {
    it('POST /admin/cases/:id/hide 应能隐藏案例', async () => {
      const res = await req(app, 'post', `/admin/cases/${testCaseId}/hide`, {
        token: adminToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.isShown).toBe(0);
    });

    it('隐藏后用户端不应看到该案例', async () => {
      const res = await req(app, 'get', `/api/cases/${testCaseId}`);
      expect(res.body.code).not.toBe(0);
    });

    it('POST /admin/cases/:id/show 应能重新展示案例', async () => {
      const res = await req(app, 'post', `/admin/cases/${testCaseId}/show`, {
        token: adminToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.isShown).toBe(1);
    });

    it('展示后用户端应能看到该案例', async () => {
      const res = await req(app, 'get', `/api/cases/${testCaseId}`);
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('案例删除', () => {
    it('DELETE /admin/cases/:id 应能删除案例', async () => {
      const res = await req(app, 'delete', `/admin/cases/${testCaseId}`, {
        token: adminToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.code).toBe(0);
      const detailRes = await req(app, 'get', `/admin/cases/${testCaseId}`, { token: adminToken });
      expect(detailRes.body.code).not.toBe(0);
    });
  });
});
