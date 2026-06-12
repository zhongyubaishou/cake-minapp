import Koa from 'koa';
import koaBody from 'koa-body';
import koaStatic from 'koa-static';
import mount from 'koa-mount';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes/api';
import adminRouter from './routes/admin';
import { config } from './config';

const app = new Koa();

// 全局错误处理（必须最先注册）
app.use(errorHandler);

// 强制所有 JSON 响应使用 UTF-8 编码
app.use(async (ctx, next) => {
  await next();
  if (typeof ctx.body === 'object' && ctx.body !== null && !Buffer.isBuffer(ctx.body) && !(ctx.body as any)._readableState) {
    ctx.set('Content-Type', 'application/json; charset=utf-8');
  }
});

// 上传文件静态托管
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
app.use(mount('/uploads', koaStatic(uploadsDir)));

// 请求体解析（所有路由使用 koa-body 以支持 multipart）
app.use(koaBody({
  multipart: true,
  encoding: 'utf-8',
  jsonLimit: '10mb',
  textLimit: '10mb',
  formidable: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    uploadDir: path.join(__dirname, '../uploads/tmp'),
    keepExtensions: true,
  },
}));

// 注册路由
app.use(apiRouter.routes()).use(apiRouter.allowedMethods());
app.use(adminRouter.routes()).use(adminRouter.allowedMethods());

// 生产环境JWT密钥安全检查
if (process.env.NODE_ENV !== 'development' && config.jwtSecret === 'dev-secret-change-in-production') {
  console.error('【安全警告】请在环境变量中设置 JWT_SECRET，当前使用默认开发密钥！');
  process.exit(1);
}

// 启动服务
app.listen(config.port, () => {
  console.log(`服务已启动，监听 http://localhost:${config.port}`);
});

export default app;