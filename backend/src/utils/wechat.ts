import { config } from '../config';
import { BusinessError } from './errors';

interface WechatSession {
  openid: string;
  session_key: string;
}

/**
 * 用 wx.login code 换取 OpenID
 * mock code 始终可用（开发模式），不受 AppID/AppSecret 配置影响
 */
export async function code2Session(code: string): Promise<WechatSession> {
  // mock code — 开发模式专用，无论是否配了真实 AppID 都直接返回
  if (code === 'dev-mock-code') {
    return { openid: 'dev_openid_local', session_key: 'dev_session' };
  }
  if (code.startsWith('mock_')) {
    return { openid: code, session_key: 'dev_session' };
  }

  if (!config.wechat.appId || !config.wechat.appSecret) {
    throw new BusinessError(500, '微信 AppID/AppSecret 未配置，无法换取 OpenID');
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.appSecret}&js_code=${code}&grant_type=authorization_code`;
  try {
    const res = await fetch(url);
    const data = await res.json() as any;

    if (data.errcode) {
      console.error('[code2Session] 微信返回错误:', data.errcode, data.errmsg);
      throw new BusinessError(502, '微信登录失败，请稍后重试');
    }

    if (!data.openid) {
      console.error('[code2Session] 微信返回数据缺少 openid');
      throw new BusinessError(502, '微信登录失败：未返回用户标识');
    }

    return { openid: data.openid, session_key: data.session_key };
  } catch (e: any) {
    if (e instanceof BusinessError) throw e;
    console.error('[code2Session] 网络请求失败:', e.message);
    throw new BusinessError(502, '微信服务暂时不可用，请稍后重试');
  }
}
