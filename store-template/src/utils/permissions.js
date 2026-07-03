const normalizeStoreRole = (role) => {
  if (role === 'store_admin' || role === 'super_admin') return 'admin'
  if (role === 'employee') return 'attendant'
  return role
}

export const hasPermission = (userRole, permission) => {
  const normalizedRole = normalizeStoreRole(userRole)
  const permissions = {
    admin: [
      'view_dashboard',
      'view_orders',
      'view_order_details',
      'update_order_status',
      'view_tables',
      'manage_tables',
      'view_products',
      'manage_products',
      'view_categories',
      'manage_categories',
      'view_delivery_zones',
      'manage_delivery_zones',
      'view_customers',
      'manage_customers',
      'view_coupons',
      'manage_coupons',
      'view_reports',
      'view_settings',
      'manage_settings',
      'view_whatsapp_templates',
      'manage_whatsapp_templates',
      'view_marketing_whatsapp',
      'manage_marketing_whatsapp',
      'view_motoboys',
      'manage_motoboys',
      'view_users',
      'manage_users',
    ],
    attendant: [
      'view_orders',
      'view_order_details',
      'update_order_status',
      'view_tables',
      'manage_tables',
      'send_whatsapp_messages',
      'view_motoboys',
      'manage_motoboys',
    ],
    waiter: [
      'view_tables',
      'manage_tables',
    ],
    kitchen: [
      'view_kitchen_board',
      'view_orders',
      'update_order_status_kitchen',
    ],
  }

  return permissions[normalizedRole]?.includes(permission) || false
}

export const canAccessRoute = (userRole, route) => {
  const normalizedRole = normalizeStoreRole(userRole)
  const routes = {
    '/admin/dashboard': ['admin'],
    '/admin/orders': ['admin', 'attendant'],
    '/admin/orders/:id': ['admin', 'attendant'],
    '/admin/tables': ['admin', 'attendant', 'waiter'],
    '/admin/products': ['admin'],
    '/admin/categories': ['admin'],
    '/admin/delivery-zones': ['admin'],
    '/admin/customers': ['admin'],
    '/admin/customer-intelligence': ['admin'],
    '/admin/coupons': ['admin'],
    '/admin/cash-register': ['admin'],
    '/admin/pos': ['admin', 'attendant'],
    '/admin/reports': ['admin'],
    '/admin/settings': ['admin'],
    '/admin/whatsapp-templates': ['admin'],
    '/admin/marketing-whatsapp': ['admin'],
    '/admin/sales-recovery': ['admin'],
    '/admin/sales-coach': ['admin'],
    '/admin/business-intelligence': ['admin'],
    '/admin/strategy': ['admin'],
    '/admin/motoboys': ['admin', 'attendant'],
    '/admin/users': ['admin'],
    '/kitchen': ['kitchen'],
  }

  const routePattern = route.replace(/\/[^/]+$/, '/:id')
  const allowedRoles = routes[route] || routes[routePattern]

  return allowedRoles?.includes(normalizedRole) || false
}

export const canUpdateOrderStatus = (userRole, currentStatus, newStatus) => {
  const normalizedRole = normalizeStoreRole(userRole)
  if (!hasPermission(normalizedRole, 'update_order_status') && !hasPermission(normalizedRole, 'update_order_status_kitchen')) {
    return false
  }

  if (normalizedRole === 'kitchen') {
    const allowedTransitions = {
      'pending': ['accepted'],
      'accepted': ['preparing'],
      'preparing': ['ready'],
    }
    return allowedTransitions[currentStatus]?.includes(newStatus) || false
  }

  return true
}

export const getAccessibleRoutes = (userRole) => {
  const normalizedRole = normalizeStoreRole(userRole)
  const allRoutes = {
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard' },
      { path: '/admin/orders', label: 'Pedidos' },
      { path: '/admin/tables', label: 'Mesas' },
      { path: '/admin/pos', label: 'PDV / Balcao' },
      { path: '/admin/motoboys', label: 'Motoboys' },
      { path: '/admin/products', label: 'Produtos' },
      { path: '/admin/categories', label: 'Categorias' },
      { path: '/admin/delivery-zones', label: 'Zonas de Entrega' },
      { path: '/admin/customers', label: 'Clientes' },
      { path: '/admin/customer-intelligence', label: 'Inteligencia de Clientes' },
      { path: '/admin/coupons', label: 'Cupons' },
      { path: '/admin/reports', label: 'Relatórios' },
      { path: '/admin/settings', label: 'Configurações' },
      { path: '/admin/whatsapp-templates', label: 'Templates WhatsApp' },
      { path: '/admin/marketing-whatsapp', label: 'Marketing WhatsApp' },
      { path: '/admin/sales-recovery', label: 'Automacao Inteligente' },
      { path: '/admin/sales-coach', label: 'Consultor de Vendas' },
      { path: '/admin/business-intelligence', label: 'Inteligencia do Negocio' },
      { path: '/admin/strategy', label: 'Estrategia' },
      { path: '/admin/users', label: 'Usuários' },
    ],
    attendant: [
      { path: '/admin/orders', label: 'Pedidos' },
      { path: '/admin/tables', label: 'Mesas' },
      { path: '/admin/pos', label: 'PDV / Balcao' },
      { path: '/admin/motoboys', label: 'Motoboys' },
    ],
    waiter: [
      { path: '/admin/tables', label: 'Mesas' },
    ],
    kitchen: [
      { path: '/kitchen', label: 'Painel Cozinha' },
    ],
  }

  return allRoutes[normalizedRole] || []
}
