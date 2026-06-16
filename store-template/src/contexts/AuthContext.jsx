import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  clearStoreAuthSession,
  readStoreAuthSession,
  resolveStoreAuthSlug,
} from '../services/storeAuthStorage'
import { validateStoreSessionAccess } from '../services/auth'

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

    if (impersonation && !expired && sameCompany && (sameSlug || currentCompanyId)) return impersonation
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

  const loadReplymeshSession = useCallback(async () => {
    const impersonating = Boolean(getValidImpersonation())
    const companySlug = resolveStoreAuthSlug()
    const tenantSession = impersonating ? null : readStoreAuthSession(companySlug)
    const token = impersonating ? localStorage.getItem('replymesh_impersonation_token') : tenantSession?.token
    const rawUser = impersonating ? localStorage.getItem('replymesh_impersonation_user') : tenantSession?.user
    const rawProfile = impersonating ? localStorage.getItem('replymesh_impersonation_profile') : tenantSession?.profile

    if (!token || !rawUser || !rawProfile) return false

    try {
      const parsedUser = impersonating ? JSON.parse(rawUser) : rawUser
      const parsedProfile = impersonating ? JSON.parse(rawProfile) : rawProfile
      if (!companySlug || (!impersonating && parsedProfile?.company_slug !== companySlug)) {
        if (impersonating) {
          clearImpersonationSession()
        } else {
          clearStoreAuthSession(companySlug)
        }
        sessionStorage.setItem(
          'replymesh:store:auth-message',
          'Sua sessao pertence a outra empresa. Faca login novamente.',
        )
        return false
      }

      const allowed = await validateStoreSessionAccess({
        token,
        companySlug,
        companyId: localStorage.getItem('replymesh_store_company_id'),
      })

      if (!allowed) {
        if (impersonating) {
          clearImpersonationSession()
        } else {
          clearStoreAuthSession(companySlug)
        }
        return false
      }

      setUser(parsedUser)
      setProfile(parsedProfile)
      setLoading(false)
      return true
    } catch {
      if (impersonating) {
        clearImpersonationSession()
      } else {
        clearStoreAuthSession(companySlug)
      }
      return false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const boot = async () => {
      if (!await loadReplymeshSession()) clearAuth()
    }
    boot()

    const handleReplymeshAuth = async () => {
      if (!mounted) return
      setLoading(true)
      if (!await loadReplymeshSession()) clearAuth()
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
    isWaiter: profile?.role === 'waiter',
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
