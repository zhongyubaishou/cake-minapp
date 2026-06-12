import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../utils/prisma';

/**
 * 小程序端用户鉴权中间件
 * Header: Authorization: Bearer {userToken}
 * 将 userId 写入 ctx.state.userId
 */
export async function userAuth(ctx: Context, next: Next) {
  const token = extractToken(ctx);
  if (!token) {
    console.warn('[userAuth] 缺少 token, URL:', ctx.url);
    ctx.status = 401;
    ctx.body = { code: 401, message: '请先登录', data: null };
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { userId: number; type: 'user' };
    if (payload.type !== 'user') {
      ctx.status = 403;
      ctx.body = { code: 403, message: '无权限访问', data: null };
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.status === 0) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '账号不可用，请重新登录', data: null };
      return;
    }

    ctx.state.userId = payload.userId;
    ctx.state.user = user;
  } catch {
    ctx.status = 401;
    ctx.body = { code: 401, message: '登录已过期，请重新登录', data: null };
    return;
  }
  await next();
}

/**
 * 后台管理端管理员鉴权中间件
 * Header: Authorization: Bearer {adminToken}
 * 将 adminUserId 和 adminPermissions 写入 ctx.state
 */
export async function adminAuth(ctx: Context, next: Next) {
  const token = extractToken(ctx);
  if (!token) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '请先登录', data: null };
    return;
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { adminId: number; type: 'admin' };
    if (payload.type !== 'admin') {
      ctx.status = 403;
      ctx.body = { code: 403, message: '无权限访问', data: null };
      return;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
      include: { role: true },
    });
    if (!admin || admin.status === 0) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '账号不可用，请重新登录', data: null };
      return;
    }

    const permissions = admin.role && Array.isArray(admin.role.permissions)
      ? admin.role.permissions.map(String)
      : [];

    ctx.state.adminUserId = payload.adminId;
    ctx.state.adminUser = admin;
    ctx.state.adminPermissions = permissions;
  } catch {
    ctx.status = 401;
    ctx.body = { code: 401, message: '登录已过期，请重新登录', data: null };
    return;
  }
  await next();
}

export function requireAdminPermission(permission: string) {
  return async (ctx: Context, next: Next) => {
    const permissions = (ctx.state.adminPermissions || []) as string[];
    if (!permissions.includes(permission)) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '当前账号无此操作权限', data: null };
      return;
    }
    await next();
  };
}

/**
 * 可选鉴权：已登录则注入 userId，未登录也放行
 */
export async function optionalAuth(ctx: Context, next: Next) {
  const token = extractToken(ctx);
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: number; type: 'user' };
      if (payload.type === 'user') {
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (user && user.status !== 0) {
          ctx.state.userId = payload.userId;
          ctx.state.user = user;
        }
      }
    } catch {
      // token 无效，当作未登录
    }
  }
  await next();
}

function extractToken(ctx: Context): string | null {
  const header = ctx.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
}
