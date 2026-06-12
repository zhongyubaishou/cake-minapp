import crypto from 'crypto';
import { config } from '../config';
import { BusinessError } from './errors';

interface WxUserInfo {
  openId: string;
  nickName: string;
  avatarUrl: string;
  gender: number;
  city: string;
  province: string;
  country: string;
  language: string;
}

/**
 * 解密微信 getUserInfo 返回的加密数据
 *
 * 算法：AES-128-CBC
 * 密钥：session_key（Base64 解码）
 * IV：iv（Base64 解码）
 * 填充：PKCS7
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html
 */
export function decryptWxUserInfo(
  encryptedData: string,
  iv: string,
  sessionKey: string,
): WxUserInfo {
  if (!encryptedData || !iv || !sessionKey) {
    throw new BusinessError(400, '缺少解密所需参数');
  }

  try {
    // 1. Base64 解码密钥和 IV
    const key = Buffer.from(sessionKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const encrypted = Buffer.from(encryptedData, 'base64');

    // 2. AES-128-CBC 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, ivBuffer);
    decipher.setAutoPadding(true); // 自动 PKCS7 去填充

    const decoded = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    // 3. 解析 JSON
    const data = JSON.parse(decoded.toString('utf8'));

    // 4. 校验 watermard.appid 与当前 AppID 一致
    const watermark = data.watermark;
    if (!watermark || watermark.appid !== config.wechat.appId) {
      throw new Error('watermark.appid 不匹配');
    }

    return {
      openId: data.openId || '',
      nickName: data.nickName || '',
      avatarUrl: data.avatarUrl || '',
      gender: data.gender || 0,
      city: data.city || '',
      province: data.province || '',
      country: data.country || '',
      language: data.language || '',
    };
  } catch (error: any) {
    console.error('[decryptWxUserInfo] 解密失败:', error.message);
    throw new BusinessError(400, '用户信息解密失败，请重新登录');
  }
}
