import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'

const MasterImpersonation = () => {
  const { companySlug } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const start = async () => {
      try {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const token = params.get('token')
        const sessionToken = params.get('session_token')
        const companyId = params.get('company_id')
        const slug = params.get('company_slug') || companySlug
        const companyName = params.get('company_name')
        const masterName = params.get('master_name')
        const rawUser = params.get('user')
        const expiresAt = params.get('expires_at')

        if (!token || !sessionToken || !companyId || !slug || slug !== companySlug || !expiresAt) {
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

        window.history.replaceState({}, document.title, `/loja/${slug}/admin/impersonate`)
        window.dispatchEvent(new Event('replymesh-auth-changed'))
        if (active) navigate(`/loja/${slug}/admin/dashboard`, { replace: true })
      } catch (impersonationError) {
        if (active) setError(impersonationError.message || 'Nao foi possivel entrar na empresa.')
      }
    }

    start()
    return () => { active = false }
  }, [companySlug, navigate])

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
