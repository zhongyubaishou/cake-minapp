import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Layout from '@/views/Layout.vue';

const Dashboard = () => import('@/views/Dashboard.vue');
const CategoryList = () => import('@/views/CategoryList.vue');
const ProductList = () => import('@/views/ProductList.vue');
const OrderList = () => import('@/views/OrderList.vue');
const DeliveryList = () => import('@/views/DeliveryList.vue');
const CaseList = () => import('@/views/CaseList.vue');
const AfterSaleList = () => import('@/views/AfterSaleList.vue');
const ReportDashboard = () => import('@/views/ReportDashboard.vue');
const ReminderSettings = () => import('@/views/ReminderSettings.vue');
const StoreSettings = () => import('@/views/StoreSettings.vue');

const routes = [
  { path: '/login', name: 'Login', component: Login },
  {
    path: '/',
    component: Layout,
    children: [
      { path: '', name: 'Dashboard', component: Dashboard },
      { path: 'orders', name: 'Orders', component: OrderList },
      { path: 'delivery', name: 'Delivery', component: DeliveryList },
      { path: 'cases', name: 'Cases', component: CaseList },
      { path: 'after-sales', name: 'AfterSales', component: AfterSaleList },
      { path: 'reports', name: 'Reports', component: ReportDashboard },
      { path: 'reminders', name: 'Reminders', component: ReminderSettings },
      { path: 'categories', name: 'Categories', component: CategoryList },
      { path: 'products', name: 'Products', component: ProductList },
      { path: 'settings', name: 'Settings', component: StoreSettings },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 路由守卫：未登录重定向到登录页
router.beforeEach((to) => {
  const token = localStorage.getItem('admin_token');
  if (to.path !== '/login' && !token) {
    return { path: '/login' };
  }
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_permissions');
        localStorage.removeItem('admin_menus');
        return { path: '/login' };
      }
    } catch { /* token格式无效, 忽略 */ }
  }
  return true;
});

export default router;
