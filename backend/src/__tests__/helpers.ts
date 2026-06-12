import Koa from 'koa';
import koaBody from 'koa-body';
import path from 'path';
import request from 'supertest';
import { errorHandler } from '../middleware/errorHandler';
import apiRouter from '../routes/api';
import adminRouter from '../routes/admin';
import prisma from '../utils/prisma';
import { generateUserToken, generateAdminToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';

/**
 * 创建测试用 Koa 应用实例，已注册所有中间件和路由
 */
export function createTestApp(): Koa {
  const app = new Koa();

  app.use(async (ctx, next) => {
    ctx.set('Content-Type', 'application/json; charset=utf-8');
    await next();
  });

  app.use(errorHandler);

  app.use(koaBody({
    multipart: true,
    encoding: 'utf-8',
    jsonLimit: '10mb',
    textLimit: '10mb',
    formidable: {
      maxFileSize: 5 * 1024 * 1024,
      uploadDir: path.join(__dirname, '..', '..', 'uploads', 'tmp'),
      keepExtensions: true,
    },
  }));

  app.use(apiRouter.routes()).use(apiRouter.allowedMethods());
  app.use(adminRouter.routes()).use(adminRouter.allowedMethods());

  return app;
}

type TestResponse = {
  status: number;
  body: any;
};

/**
 * 发送 HTTP 请求到 Koa app，使用 supertest
 */
export function req(
  app: Koa,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  opts?: {
    body?: any;
    token?: string;
    query?: Record<string, string>;
  },
): Promise<TestResponse> {
  let r: any;

  switch (method) {
    case 'get':
      r = request(app.callback()).get(path);
      break;
    case 'post':
      r = request(app.callback()).post(path);
      break;
    case 'put':
      r = request(app.callback()).put(path);
      break;
    case 'delete':
      r = request(app.callback()).delete(path);
      break;
    default:
      r = request(app.callback()).get(path);
  }

  if (opts?.token) {
    r.set('Authorization', `Bearer ${opts.token}`);
  }

  if (opts?.query) {
    r.query(opts.query);
  }

  if (opts?.body) {
    r.send(opts.body);
  }

  return r.then((res: any) => ({ status: res.status, body: res.body }));
}

/**
 * 创建/获取测试用户，返回 userId 和 token
 */
export async function ensureTestUser(openId = 'test-openid-001'): Promise<{ userId: number; token: string }> {
  let user = await prisma.user.findUnique({ where: { openId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        openId,
        nickname: '测试用户',
        phone: '13800138000',
        lastLoginAt: new Date(),
      },
    });
  } else if (!user.phone) {
    // Ensure phone is set for existing test users
    user = await prisma.user.update({
      where: { id: user.id },
      data: { phone: '13800138000' },
    });
  }
  const token = generateUserToken(user.id);
  return { userId: user.id, token };
}

/**
 * 创建/获取测试管理员，返回 adminId 和 token
 */
export async function ensureTestAdmin(username = 'admin'): Promise<{ adminId: number; token: string }> {
  let admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    let role = await prisma.adminRole.findUnique({ where: { code: 'super_admin' } });
    if (!role) {
      role = await prisma.adminRole.create({
        data: {
          code: 'super_admin',
          name: '超级管理员',
          permissions: [
            'dashboard:view', 'order:view', 'order:confirm', 'order:adjust',
            'order:cancel', 'order:produce', 'order:deliver', 'product:view',
            'product:manage', 'category:view', 'category:manage', 'case:view',
            'case:manage', 'afterSale:view', 'afterSale:complete', 'report:view',
            'reminder:view', 'reminder:manage', 'store:view', 'store:manage',
            'upload:admin',
          ],
        },
      });
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    admin = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        name: '测试管理员',
        roleId: role.id,
        status: 1,
      },
    });
  }
  const token = generateAdminToken(admin.id);
  return { adminId: admin.id, token };
}

/**
 * 确保门店配置存在
 */
export async function ensureStoreConfig(): Promise<void> {
  const existing = await prisma.storeConfig.findFirst();
  if (!existing) {
    await prisma.storeConfig.create({
      data: {
        name: '测试蛋糕店',
        address: '广东省河源市紫金县义容镇青溪信用社旁',
        lng: 114.8575,
        lat: 23.5238,
        businessHoursStart: '06:00:00',
        businessHoursEnd: '18:00:00',
        deliveryRangeKm: 5.0,
        deliveryFeePerKm: 2.0,
        minAdvanceHours: 6,
        dailyOrderLimit: 50,
      },
    });
  } else {
    // Ensure known test coordinates for distance testing
    await prisma.storeConfig.update({
      where: { id: existing.id },
      data: {
        lng: 114.8575,
        lat: 23.5238,
        deliveryRangeKm: 5.0,
        deliveryFeePerKm: 2.0,
        minAdvanceHours: 6,
        businessHoursStart: '06:00:00',
        businessHoursEnd: '18:00:00',
      },
    });
  }
}

/**
 * 确保测试分类存在
 */
export async function ensureTestCategory(name = '生日蛋糕', sortOrder = 1): Promise<{ categoryId: number }> {
  let cat = await prisma.category.findFirst({ where: { name } });
  if (!cat) {
    cat = await prisma.category.create({ data: { name, sortOrder, isEnabled: 1 } });
  }
  return { categoryId: cat.id };
}

/**
 * 确保测试商品存在
 */
export async function ensureTestProduct(categoryId: number, name = '测试蛋糕'): Promise<{ productId: number }> {
  let product = await prisma.product.findFirst({ where: { name, categoryId } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        categoryId,
        name,
        imageUrl: 'https://example.com/cake.jpg',
        description: '测试蛋糕描述',
        basePrice: 168,
        availablePounds: [1, 2, 3],
        defaultPound: 2.0,
        availableFlavors: ['原味', '巧克力', '草莓'],
        defaultFlavor: '原味',
        availableThemes: ['成人', '儿童'],
        defaultTheme: '成人',
        isOnSale: 1,
      },
    });
  }
  return { productId: product.id };
}

/**
 * 确保测试案例存在
 */
export async function ensureTestCase(name = '测试案例'): Promise<{ caseId: number }> {
  let cs = await prisma.cakeCase.findFirst({ where: { name } });
  if (!cs) {
    cs = await prisma.cakeCase.create({
      data: {
        imageUrl: 'https://example.com/case.jpg',
        name,
        theme: '成人',
        referencePound: 2.0,
        referencePrice: 168,
        isShown: 1,
        sortOrder: 1,
      },
    });
  }
  return { caseId: cs.id };
}

/**
 * 清理测试数据（订单相关）
 */
export async function cleanupTestOrders(userId: number) {
  const orders = await prisma.order.findMany({ where: { userId } });
  for (const order of orders) {
    await prisma.operationLog.deleteMany({ where: { targetType: 'ORDER', targetId: order.id } });
    const afterSales = await prisma.afterSale.findMany({ where: { orderId: order.id }, select: { id: true } });
    for (const as of afterSales) {
      await prisma.operationLog.deleteMany({ where: { targetType: 'AFTER_SALE', targetId: as.id } });
    }
    await prisma.afterSale.deleteMany({ where: { orderId: order.id } });
    await prisma.paymentRecord.deleteMany({ where: { orderId: order.id } });
    await prisma.deliveryInfo.deleteMany({ where: { orderId: order.id } });
    await prisma.orderCustomization.deleteMany({ where: { orderId: order.id } });
    await prisma.order.deleteMany({ where: { id: order.id } });
  }
}
