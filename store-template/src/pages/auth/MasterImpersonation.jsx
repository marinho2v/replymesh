import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'

const MasterImpersonation = () => {
  const { companySlug: pathCompanySlug } = useParams()
  const contextCompanySlug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const companySlug = pathCompanySlug || contextCompanySlug
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const readParam = (key) => {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      return searchParams.get(key) || hashParams.get(key)
    }

    const start = async () => {
      try {
        const token = readParam('token')
        const sessionToken = readParam('session_token')
        const companyId = readParam('company_id')
        const payloadSlug = readParam('company_slug')
        const slug = companySlug || payloadSlug
        const companyName = readParam('company_name')
        const masterName = readParam('master_name')
        const rawUser = readParam('user')
        const expiresAt = readParam('expires_at')

        if (!token || !sessionToken || !companyId || !slug || !expiresAt) {
          throw new Error('Acesso temporario invalido ou incompleto.')
        }

        const user = rawUser ? JSON.parse(rawUser) : { name: 'Admin Master', global_role: 'super_admin' }
        const profile = {
          id: user.id,
          email: user.email,
          full_name: user.name || 'Admin Master',
          role: 'admin',
          company_id: Number(companyId),
          company_slug: slug,
          provider: 'replymesh',
          impersonation: true,
        }

        const previousCompanyId = localStorage.getItem('replymesh_store_company_id')
        const previousCompanySlug = localStorage.getItem('replymesh_store_company_slug')

        localStorage.setItem('replymesh_impersonation_token', token)
        localStorage.setItem('replymesh_impersonation_user', JSON.stringify(user))
        localStorage.setItem('replymesh_impersonation_profile', JSON.stringify(profile))
        localStorage.setItem('replymesh_store_company_id', String(companyId))
        localStorage.setItem('replymesh_store_company_slug', slug)
        localStorage.setItem('replymesh_master_impersonation', JSON.stringify({
          session_token: sessionToken,
          company_id: Number(companyId),
          company_slug: slug,
          company_name: companyName,
          master_name: masterName || user.name,
          expires_at: expiresAt,
          previous_company_id: previousCompanyId,
          previous_company_slug: previousCompanySlug,
        }))

        window.history.replaceState({}, document.title, `${basePath}/admin/impersonate`)
        window.dispatchEvent(new Event('replymesh-auth-changed'))
        if (active) navigate(`${basePath}/admin/dashboard`, { replace: true })
      } catch (impersonationError) {
        if (active) setError(impersonationError.message || 'Nao foi possivel entrar na empresa.')
      }
    }

    start()
    return () => { active = false }
  }, [basePath, companySlug, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-dark-600 bg-dark-800 p-7 text-center shadow-2xl">
        {error ? (
          <>
            <ShieldCheck className="mx-auto mb-4 text-red-400" size={38} />
            <h1 className="text-xl font-bold text-white">Acesso nao autorizado</h1>
            <p className="mt-2 text-sm text-gray-400">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-yellow-400" size={38} />
            <h1 className="text-xl font-bold text-white">Abrindo painel da empresa</h1>
            <p className="mt-2 text-sm text-gray-400">Preparando uma sessao temporaria e auditada.</p>
          </>
        )}
      </div>
    </div>
  )
}

export default MasterImpersonation
