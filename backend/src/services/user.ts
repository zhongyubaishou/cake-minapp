import prisma from '../utils/prisma';

export class UserService {
  /** 根据 OpenID 查找或创建用户，同时更新昵称和头像 */
  async findOrCreateByOpenId(openId: string, profile?: { nickName?: string; avatarUrl?: string }) {
    const nickName = profile?.nickName || undefined;
    const avatarUrl = profile?.avatarUrl || undefined;

    let user = await prisma.user.findUnique({ where: { openId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          openId,
          nickname: nickName ?? null,
          avatarUrl: avatarUrl ?? null,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // 更新昵称和头像（如用户授权了新的微信信息）
      const updateData: Record<string, unknown> = { lastLoginAt: new Date() };
      if (nickName) updateData.nickname = nickName;
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }
    return user;
  }

  /** 绑定手机号 */
  async bindPhone(userId: number, phone: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { phone },
    });
  }

  /** 更新用户资料（昵称/头像） */
  async updateProfile(userId: number, data: { nickname?: string; avatarUrl?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  /** 获取用户信息 */
  async getProfile(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        phone: true,
        createdAt: true,
      },
    });
  }
}

export const userService = new UserService();
