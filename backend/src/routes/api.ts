import Router from '@koa/router';
import { userAuth } from '../middleware/auth';
import { userController } from '../controllers/user';
import { categoryController } from '../controllers/category';
import { productController } from '../controllers/product';
import { storeController } from '../controllers/store';
import { uploadController } from '../controllers/upload';
import { orderController } from '../controllers/order';
import { homeController } from '../controllers/home';
import { caseController } from '../controllers/case';
import { afterSaleController } from '../controllers/afterSale';
import { success } from '../utils/response';
import { BusinessError } from '../utils/errors';

const router = new Router({ prefix: '/api' });

// ==== 公开路由 ====

router.get('/health', (ctx) => {
  success(ctx, { status: 'ok', timestamp: Date.now() });
});

router.post('/user/login', (ctx) => userController.login(ctx));

router.get('/home', (ctx) => homeController.index(ctx));

router.get('/store/config', (ctx) => storeController.getConfig(ctx));

router.get('/categories', (ctx) => categoryController.list(ctx));

router.get('/products', (ctx) => productController.list(ctx));

router.get('/products/:id', (ctx) => productController.detail(ctx));

router.get('/cases', (ctx) => caseController.list(ctx));

router.get('/cases/:id', (ctx) => caseController.detail(ctx));

router.post('/delivery/calculate', (ctx) => orderController.calcDelivery(ctx));

// ==== 需登录路由 ====

router.post('/user/bind-phone', userAuth, (ctx) => userController.bindPhone(ctx));

router.get('/user/profile', userAuth, (ctx) => userController.profile(ctx));

router.put('/user/profile', userAuth, (ctx) => userController.updateProfile(ctx));

router.get('/user/favorites', userAuth, (ctx) => caseController.favorites(ctx));

router.post('/cases/:id/favorite', userAuth, (ctx) => caseController.favorite(ctx));

router.delete('/cases/:id/favorite', userAuth, (ctx) => caseController.unfavorite(ctx));

router.post('/orders', userAuth, (ctx) => orderController.create(ctx));

router.get('/orders', userAuth, (ctx) => orderController.list(ctx));

router.get('/orders/:id', userAuth, (ctx) => orderController.detail(ctx));

router.post('/orders/:id/cancel', userAuth, (ctx) => orderController.cancel(ctx));

router.post('/orders/:id/pay', userAuth, (ctx) => orderController.pay(ctx));

router.post('/orders/:id/refund', userAuth, () => {
  throw new BusinessError(400, 'V1 暂不支持退款');
});

router.post('/orders/:id/after-sales', userAuth, (ctx) => afterSaleController.create(ctx));

router.post('/upload', userAuth, (ctx) => uploadController.uploadUser(ctx));

export default router;
