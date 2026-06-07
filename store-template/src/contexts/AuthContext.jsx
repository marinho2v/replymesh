import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext(null)

const clearImpersonationSession = () => {
  localStorage.removeItem('replymesh_impersonation_token')
  localStorage.removeItem('replymesh_impersonation_user')
  localStorage.removeItem('replymesh_impersonation_profile')
  localStorage.removeItem('replymesh_master_impersonation')
}

const getValidImpersonation = () => {
  const token = localStorage.getItem('replymesh_impersonation_token')
  if (!token) return null

  try {
    const impersonation = JSON.parse(localStorage.getItem('replymesh_master_impersonation') || 'null')
    const currentCompanyId = localStorage.getItem('replymesh_store_company_id')
    const currentCompanySlug = localStorage.getItem('replymesh_store_company_slug')
    const expired = impersonation?.expires_at && new Date(impersonation.expires_at).getTime() <= Date.now()
    const sameCompany = !currentCompanyId || String(impersonation?.company_id) === String(currentCompanyId)
    const sameSlug = !currentCompanySlug || String(impersonation?.company_slug) === String(currentCompanySlug)

    if (impersonation && !expired && sameCompany && sameSlug) return impersonation
  } catch {
    // Sessao temporaria invalida; volta para o login normal da loja.
  }

  clearImpersonationSession()
  return null
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileRequestId = useRef(0)

  const clearAuth = useCallback(() => {
    profileRequestId.current += 1
    setUser(null)
    setProfile(null)
    setLoading(false)
  }, [])

  const loadReplymeshSession = useCallback(() => {
    const impersonating = Boolean(getValidImpersonation())
    const token = impersonating
      ? localStorage.getItem('replymesh_impersonation_token')
      : localStorage.getItem('replymesh_store_token')
    const rawUser = impersonating
      ? localStorage.getItem('replymesh_impersonation_user')
      : localStorage.getItem('replymesh_store_user')
    const rawProfile = impersonating
      ? localStorage.getItem('replymesh_impersonation_profile')
      : localStorage.getItem('replymesh_store_profile')

    if (!token || !rawUser || !rawProfile) return false

    try {
      setUser(JSON.parse(rawUser))
      setProfile(JSON.parse(rawProfile))
      setLoading(false)
      return true
    } catch {
      if (impersonating) {
        clearImpersonationSession()
      } else {
        localStorage.removeItem('replymesh_store_token')
        localStorage.removeItem('replymesh_store_user')
        localStorage.removeItem('replymesh_store_profile')
      }
      return false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    loadReplymeshSession()

    const handleReplymeshAuth = () => {
      if (!mounted) return
      if (!loadReplymeshSession()) clearAuth()
    }

    window.addEventListener('replymesh-auth-changed', handleReplymeshAuth)

    return () => {
      mounted = false
      window.removeEventListener('replymesh-auth-changed', handleReplymeshAuth)
    }
  }, [clearAuth, loadReplymeshSession])

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isAttendant: profile?.role === 'attendant',
    isKitchen: profile?.role === 'kitchen',
    isMotoboy: profile?.role === 'motoboy',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
