import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PageLoader } from '../ui/Loader'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

const normalizeStoreRole = (role) => {
  if (['admin', 'store_admin', 'super_admin', 'owner', 'manager'].includes(role)) return 'admin'
  if (role === 'cashier') return 'cashier'
  if (['attendant', 'employee', 'support_viewer'].includes(role)) return 'attendant'
  if (role === 'waiter') return 'waiter'
  if (role === 'kitchen') return 'kitchen'
  if (role === 'motoboy') return 'motoboy'
  return 'attendant'
}

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const basePath = useCompanyBasePath()
  const profileRole = normalizeStoreRole(profile?.role || profile?.company_member_role)

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to={`${basePath}/login`} replace state={{ from: location.pathname }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profileRole)) {
    const fallbackPath = profileRole === 'cashier'
      ? `${basePath}/admin/pos`
      : profileRole === 'attendant'
        ? `${basePath}/admin/orders`
      : profileRole === 'waiter'
        ? `${basePath}/admin/tables`
      : profileRole === 'kitchen'
        ? '/kitchen'
        : profileRole === 'admin'
          ? `${basePath}/admin/dashboard`
          : `${basePath}/login`

    return <Navigate to={fallbackPath} replace />
  }

  return children
}
