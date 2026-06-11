import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PageLoader } from '../ui/Loader'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const basePath = useCompanyBasePath()

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to={`${basePath}/login`} replace state={{ from: location.pathname }} />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    const fallbackPath = profile?.role === 'attendant'
      ? `${basePath}/admin/orders`
      : profile?.role === 'waiter'
        ? `${basePath}/admin/tables`
      : profile?.role === 'kitchen'
        ? '/kitchen'
        : profile?.role === 'admin'
          ? `${basePath}/admin/dashboard`
          : `${basePath}/login`

    return <Navigate to={fallbackPath} replace />
  }

  return children
}
