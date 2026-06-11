import { USER_ROLES } from './constants'

const normalizeStoreRole = (role) => {
  if (role === 'store_admin' || role === 'super_admin') return USER_ROLES.ADMIN
  if (role === 'employee') return USER_ROLES.ATTENDANT
  return role
}

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'view_dashboard',
    'view_orders',
    'manage_orders',
    'view_tables',
    'manage_tables',
    'view_motoboys',
    'manage_motoboys',
    'view_products',
    'manage_products',
    'view_categories',
    'manage_categories',
    'view_delivery_zones',
    'manage_delivery_zones',
    'view_customers',
    'manage_customers',
    'export_customers',
    'view_coupons',
    'manage_coupons',
    'view_users',
    'manage_users',
    'view_reports',
    'view_settings',
    'manage_settings',
    'view_whatsapp_templates',
    'manage_whatsapp_templates',
    'view_kitchen',
    'view_pos',
    'manage_pos',
  ],
  [USER_ROLES.ATTENDANT]: [
    'view_orders',
    'manage_orders',
    'view_tables',
    'manage_tables',
    'view_pos',
    'manage_pos',
  ],
  [USER_ROLES.WAITER]: [
    'view_tables',
    'manage_tables',
  ],
  [USER_ROLES.KITCHEN]: [
    'view_kitchen',
    'manage_kitchen_orders',
  ],
}

export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[normalizeStoreRole(role)] || []
  return permissions.includes(permission)
}

export const canAccessRoute = (role, route) => {
  const normalizedRole = normalizeStoreRole(role)
  const routePermissions = {
    '/admin/dashboard': ['view_dashboard'],
    '/admin/orders': ['view_orders'],
    '/admin/tables': ['view_tables'],
    '/admin/motoboys': ['view_motoboys'],
    '/admin/cash-register': ['view_cash_register'],
    '/admin/pos': ['view_pos'],
    '/admin/products': ['view_products'],
    '/admin/categories': ['view_categories'],
    '/admin/delivery-zones': ['view_delivery_zones'],
    '/admin/customers': ['view_customers'],
    '/admin/coupons': ['view_coupons'],
    '/admin/users': ['view_users'],
    '/admin/reports': ['view_reports'],
    '/admin/settings': ['view_settings'],
    '/admin/whatsapp-templates': ['view_whatsapp_templates'],
    '/kitchen': ['view_kitchen'],
  }

  const requiredPermissions = routePermissions[route] || []
  if (requiredPermissions.length === 0) return true

  return requiredPermissions.some(perm => hasPermission(normalizedRole, perm))
}
