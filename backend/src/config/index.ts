import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  cos: {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    bucket: process.env.COS_BUCKET || '',
    region: process.env.COS_REGION || 'ap-guangzhou',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },
  wechatPay: {
    mchId: process.env.WECHAT_PAY_MCH_ID || '',
    apiKey: process.env.WECHAT_PAY_API_KEY || '',
    certPath: process.env.WECHAT_PAY_CERT_PATH || '',
    keyPath: process.env.WECHAT_PAY_KEY_PATH || '',
  },
};
