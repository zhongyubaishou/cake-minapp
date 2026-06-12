import { Context } from 'koa';
import bcrypt from 'bcryptjs';
import { success, BusinessError } from '../utils';
import { generateAdminToken } from '../utils/jwt';
import prisma from '../utils/prisma';
import { ADMIN_MENUS, menusForPermissions } from '../utils/permissions';

export class AdminController {
  /** POST /admin/login */
  async login(ctx: Context) {
    const { username, password } = ctx.request.body as { username: string; password: string };
    if (!username || !password) throw new BusinessError(400, '请输入用户名和密码');

    const admin = await prisma.adminUser.findUnique({ where: { username }, include: { role: true } });
    if (!admin || admin.status === 0) {
      throw new BusinessError(401, '用户名或密码错误');
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new BusinessError(401, '用户名或密码错误');
    }

    prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    const permissions = admin.role && Array.isArray(admin.role.permissions)
      ? (admin.role.permissions as any[]).map(String)
      : [];

    const token = generateAdminToken(admin.id);
    success(ctx, {
      token,
      adminUser: { id: admin.id, name: admin.name },
      permissions,
      menus: menusForPermissions(permissions),
    });
  }
}

export const adminController = new AdminController();
