import { Context } from 'koa';
import { userService } from '../services/user';
import { code2Session } from '../utils/wechat';
import { exchangePhoneNumber } from '../utils/wechat-phone';
import { decryptWxUserInfo } from '../utils/wechat-decrypt';
import { generateUserToken } from '../utils/jwt';
import { success, BusinessError } from '../utils';

export class UserController {
  /** POST /api/user/login */
  async login(ctx: Context) {
    const { code, encryptedData, iv } = ctx.request.body as {
      code: string; encryptedData?: string; iv?: string;
    };
    if (!code) throw new BusinessError(400, '缺少登录凭证');

    const { openid, session_key } = await code2Session(code);

    // 解密微信用户信息（昵称、头像）
    let nickName: string | undefined;
    let avatarUrl: string | undefined;
    if (encryptedData && iv && session_key) {
      try {
        const userInfo = decryptWxUserInfo(encryptedData, iv, session_key);
        nickName = userInfo.nickName || undefined;
        avatarUrl = userInfo.avatarUrl || undefined;
      } catch {
        // 解密失败不影响登录，用户可后续手动设置
        console.warn('[login] 微信用户信息解密失败，继续登录');
      }
    }

    const user = await userService.findOrCreateByOpenId(openid, { nickName, avatarUrl });
    const token = generateUserToken(user.id);

    success(ctx, {
      token,
      userId: user.id,
      nickName: user.nickname || '',
      avatarUrl: user.avatarUrl || '',
      hasPhone: !!user.phone,
    });
  }

  /** POST /api/user/bind-phone
   *  使用微信 getPhoneNumber 返回的 code 换取真实手机号 */
  async bindPhone(ctx: Context) {
    const userId = ctx.state.userId;
    const { code } = ctx.request.body as { code: string };
    if (!code) throw new BusinessError(400, '缺少手机验证码');

    // 调用微信 API 换取手机号
    const phone = await exchangePhoneNumber(code);

    await userService.bindPhone(userId, phone);
    success(ctx, { phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') });
  }

  /** GET /api/user/profile */
  async profile(ctx: Context) {
    const profile = await userService.getProfile(ctx.state.userId);
    if (!profile) throw new BusinessError(404, '用户不存在');
    success(ctx, profile);
  }

  /** PUT /api/user/profile */
  async updateProfile(ctx: Context) {
    const { nickname, avatarUrl } = ctx.request.body as {
      nickname?: string; avatarUrl?: string;
    };
    if (!nickname && !avatarUrl) throw new BusinessError(400, '至少需要提供昵称或头像');
    if (nickname && nickname.length > 64) throw new BusinessError(400, '昵称不能超过64个字符');
    if (avatarUrl && avatarUrl.length > 512) throw new BusinessError(400, '头像地址过长');
    await userService.updateProfile(ctx.state.userId, { nickname, avatarUrl });
    success(ctx, null);
  }
}

export const userController = new UserController();
