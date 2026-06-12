export interface AdminMenuItem {
  path: string;
  label: string;
  permission: string;
}

export function getPermissions(): string[] {
  try {
    return JSON.parse(localStorage.getItem('admin_permissions') || '[]');
  } catch {
    return [];
  }
}

export function getMenus(): AdminMenuItem[] {
  try {
    return JSON.parse(localStorage.getItem('admin_menus') || '[]');
  } catch {
    return [];
  }
}

export function hasPermission(permission?: string): boolean {
  if (!permission) return true;
  return getPermissions().includes(permission);
}

export function clearAdminAuth() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_permissions');
  localStorage.removeItem('admin_menus');
}
