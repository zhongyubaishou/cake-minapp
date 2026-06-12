import { config } from '../config';
import { BusinessError } from './errors';

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

let cache: AccessTokenCache | null = null;

/** 获取微信 access_token（自动缓存和刷新） */
export async function getAccessToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + 300_000) {
    return cache.token;
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.appSecret}`;
  try {
    const res = await fetch(url);
    const data = await res.json() as any;

    if (data.errcode) {
      console.error('[getAccessToken] 微信返回错误:', data.errcode, data.errmsg);
      throw new BusinessError(502, '微信服务异常，请稍后重试');
    }

    cache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return cache.token;
  } catch (e: any) {
    if (e instanceof BusinessError) throw e;
    console.error('[getAccessToken] 网络请求失败:', e.message);
    throw new BusinessError(502, '微信服务暂时不可用，请稍后重试');
  }
}

/** 获取用户手机号（通过 getPhoneNumber 返回的 code） */
export async function exchangePhoneNumber(code: string): Promise<string> {
  if (!config.wechat.appId || !config.wechat.appSecret) {
    throw new BusinessError(500, '微信 AppID/AppSecret 未配置，无法换取手机号');
  }

  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${token}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json() as any;

    if (data.errcode !== 0) {
      console.error('[exchangePhoneNumber] 微信返回错误:', data.errcode, data.errmsg);
      throw new BusinessError(502, '微信手机号获取失败，请稍后重试');
    }

    const phoneInfo = data.phone_info;
    if (!phoneInfo || !phoneInfo.purePhoneNumber) {
      console.error('[exchangePhoneNumber] 微信返回数据缺少手机号');
      throw new BusinessError(502, '微信手机号获取失败：未返回手机号');
    }

    return phoneInfo.purePhoneNumber;
  } catch (e: any) {
    if (e instanceof BusinessError) throw e;
    console.error('[exchangePhoneNumber] 网络请求失败:', e.message);
    throw new BusinessError(502, '微信服务暂时不可用，请稍后重试');
  }
}
