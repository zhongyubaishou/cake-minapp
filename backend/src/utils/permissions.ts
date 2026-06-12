export const ADMIN_PERMISSIONS = [
  'dashboard:view',
  'order:view',
  'order:confirm',
  'order:adjust',
  'order:cancel',
  'order:produce',
  'order:deliver',
  'product:view',
  'product:manage',
  'category:view',
  'category:manage',
  'case:view',
  'case:manage',
  'afterSale:view',
  'afterSale:complete',
  'report:view',
  'reminder:view',
  'reminder:manage',
  'store:view',
  'store:manage',
  'upload:admin',
] as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[number];

export const ADMIN_MENUS = [
  { path: '/', label: '工作台', permission: 'dashboard:view' },
  { path: '/orders', label: '订单管理', permission: 'order:view' },
  { path: '/delivery', label: '配送管理', permission: 'order:deliver' },
  { path: '/cases', label: '蛋糕案例', permission: 'case:view' },
  { path: '/after-sales', label: '售后反馈', permission: 'afterSale:view' },
  { path: '/reports', label: '数据报表', permission: 'report:view' },
  { path: '/reminders', label: '消息提醒', permission: 'reminder:view' },
  { path: '/products', label: '商品管理', permission: 'product:view' },
  { path: '/categories', label: '分类管理', permission: 'category:view' },
  { path: '/settings', label: '门店设置', permission: 'store:view' },
] as const;

export function allAdminPermissions(): string[] {
  return [...ADMIN_PERMISSIONS];
}

export function menusForPermissions(permissions: string[]) {
  const set = new Set(permissions);
  return ADMIN_MENUS.filter((item) => set.has(item.permission));
}
