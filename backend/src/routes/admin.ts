import Router from '@koa/router';
import { adminAuth, requireAdminPermission } from '../middleware/auth';
import { categoryController } from '../controllers/category';
import { productController } from '../controllers/product';
import { storeController } from '../controllers/store';
import { uploadController } from '../controllers/upload';
import { adminController } from '../controllers/admin';
import { orderController } from '../controllers/order';
import { caseController } from '../controllers/case';
import { afterSaleController } from '../controllers/afterSale';
import { reportController } from '../controllers/report';
import { reminderController } from '../controllers/reminder';
import { success } from '../utils/response';
import { BusinessError } from '../utils/errors';
import { dashboardService } from '../services/dashboard';

const router = new Router({ prefix: '/admin' });

// ==== 公开路由 ====

router.get('/health', (ctx) => {
  success(ctx, { status: 'ok', timestamp: Date.now() });
});

router.post('/login', (ctx) => adminController.login(ctx));

// ==== 需登录路由 ====

router.get('/dashboard', adminAuth, requireAdminPermission('dashboard:view'), async (ctx) => {
  const stats = await dashboardService.getStats();
  success(ctx, stats);
});

router.post('/upload', adminAuth, requireAdminPermission('upload:admin'), (ctx) => uploadController.uploadAdmin(ctx));

router.get('/categories', adminAuth, requireAdminPermission('category:view'), (ctx) => categoryController.listAll(ctx));

router.post('/categories', adminAuth, requireAdminPermission('category:manage'), (ctx) => categoryController.create(ctx));

router.put('/categories/:id', adminAuth, requireAdminPermission('category:manage'), (ctx) => categoryController.update(ctx));

router.delete('/categories/:id', adminAuth, requireAdminPermission('category:manage'), (ctx) => categoryController.delete(ctx));

router.get('/products', adminAuth, requireAdminPermission('product:view'), (ctx) => productController.listAll(ctx));

router.post('/products', adminAuth, requireAdminPermission('product:manage'), (ctx) => productController.create(ctx));

router.get('/products/:id', adminAuth, requireAdminPermission('product:view'), (ctx) => productController.detail(ctx));

router.put('/products/:id', adminAuth, requireAdminPermission('product:manage'), (ctx) => productController.update(ctx));

router.delete('/products/:id', adminAuth, requireAdminPermission('product:manage'), (ctx) => productController.delete(ctx));

router.post('/products/:id/on', adminAuth, requireAdminPermission('product:manage'), (ctx) => productController.on(ctx));

router.post('/products/:id/off', adminAuth, requireAdminPermission('product:manage'), (ctx) => productController.off(ctx));

router.get('/cases', adminAuth, requireAdminPermission('case:view'), (ctx) => caseController.listAll(ctx));

router.post('/cases', adminAuth, requireAdminPermission('case:manage'), (ctx) => caseController.create(ctx));

router.get('/cases/:id', adminAuth, requireAdminPermission('case:view'), (ctx) => caseController.detail(ctx));

router.put('/cases/:id', adminAuth, requireAdminPermission('case:manage'), (ctx) => caseController.update(ctx));

router.delete('/cases/:id', adminAuth, requireAdminPermission('case:manage'), (ctx) => caseController.delete(ctx));

router.post('/cases/:id/show', adminAuth, requireAdminPermission('case:manage'), (ctx) => caseController.show(ctx));

router.post('/cases/:id/hide', adminAuth, requireAdminPermission('case:manage'), (ctx) => caseController.hide(ctx));

router.get('/orders', adminAuth, requireAdminPermission('order:view'), (ctx) => orderController.listAll(ctx));

router.get('/orders/:id', adminAuth, requireAdminPermission('order:view'), (ctx) => orderController.detail(ctx));

router.post('/orders/:id/confirm', adminAuth, requireAdminPermission('order:confirm'), (ctx) => orderController.confirm(ctx));

router.put('/orders/:id/adjust-price', adminAuth, requireAdminPermission('order:adjust'), (ctx) => orderController.adjustPrice(ctx));

router.post('/orders/:id/cancel', adminAuth, requireAdminPermission('order:cancel'), (ctx) => orderController.cancelByAdmin(ctx));

// 商家要求：跳过制作状态，接单后直接进入待自提/待配送
// router.post('/orders/:id/start-production', adminAuth, requireAdminPermission('order:produce'), (ctx) => orderController.startProduction(ctx));

// router.post('/orders/:id/finish-production', adminAuth, requireAdminPermission('order:produce'), (ctx) => orderController.finishProduction(ctx));

router.post('/orders/:id/pickup-complete', adminAuth, requireAdminPermission('order:produce'), (ctx) => orderController.pickupComplete(ctx));

router.post('/orders/:id/start-delivery', adminAuth, requireAdminPermission('order:deliver'), (ctx) => orderController.startDelivery(ctx));

router.post('/orders/:id/delivery-complete', adminAuth, requireAdminPermission('order:deliver'), (ctx) => orderController.deliveryComplete(ctx));

router.get('/orders/:id/logs', adminAuth, requireAdminPermission('order:view'), (ctx) => orderController.getLogs(ctx));

router.get('/after-sales', adminAuth, requireAdminPermission('afterSale:view'), (ctx) => afterSaleController.listAll(ctx));

router.get('/after-sales/:id', adminAuth, requireAdminPermission('afterSale:view'), (ctx) => afterSaleController.detail(ctx));

router.post('/after-sales/:id/complete', adminAuth, requireAdminPermission('afterSale:complete'), (ctx) => afterSaleController.complete(ctx));

router.get('/reports/summary', adminAuth, requireAdminPermission('report:view'), (ctx) => reportController.summary(ctx));

router.get('/settings/reminders', adminAuth, requireAdminPermission('reminder:view'), (ctx) => reminderController.getSettings(ctx));

router.put('/settings/reminders', adminAuth, requireAdminPermission('reminder:manage'), (ctx) => reminderController.updateSettings(ctx));

router.get('/refunds', adminAuth, () => {
  throw new BusinessError(400, 'V1 暂不支持退款');
});

router.post('/refunds/:id/approve', adminAuth, () => {
  throw new BusinessError(400, 'V1 暂不支持退款');
});

router.post('/refunds/:id/reject', adminAuth, () => {
  throw new BusinessError(400, 'V1 暂不支持退款');
});

router.get('/settings/store', adminAuth, requireAdminPermission('store:view'), (ctx) => storeController.getConfig(ctx));

router.put('/settings/store', adminAuth, requireAdminPermission('store:manage'), (ctx) => storeController.updateConfig(ctx));

export default router;
