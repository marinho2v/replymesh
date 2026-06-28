import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import BrandLogo from '../../components/shared/BrandLogo'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'
import {
  requestPasswordResetCode,
  resetStorePassword,
  verifyPasswordResetCode,
} from '../../services/publicApi'
import { getPublicStoreInfo } from '../../services/publicApi'
import { useEffect } from 'react'

const PasswordField = ({ label, value, onChange }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-white">{label}</label>
      <div className="relative">
        <input
          required
          minLength={10}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          placeholder="Digite a nova senha"
          className="w-full rounded-lg border border-dark-600 bg-dark-900 px-4 py-3 pr-12 text-white placeholder-gray-500 outline-none transition-colors focus:border-white"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-white"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  )
}

const PasswordReset = () => {
  const companySlug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const [storeInfo, setStoreInfo] = useState(null)
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [resetId, setResetId] = useState(null)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!companySlug) return
    getPublicStoreInfo(companySlug).then(setStoreInfo).catch(() => {})
  }, [companySlug])

  const sendCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = await requestPasswordResetCode({ email, companySlug })
      setResetId(payload.reset_id || null)
      setMaskedEmail(payload.email || email)
      setStep('code')
      toast.success('Se o e-mail estiver cadastrado, enviaremos um código de recuperação.')
    } catch (error) {
      toast.error(error.message || 'Não foi possível enviar o código.')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (event) => {
    event.preventDefault()
    if (!resetId) {
      toast.error('Solicite um novo código para continuar.')
      return
    }

    setLoading(true)
    try {
      await verifyPasswordResetCode({ resetId, code })
      setStep('password')
      toast.success('Código confirmado.')
    } catch (error) {
      toast.error(error.message || 'Código inválido.')
    } finally {
      setLoading(false)
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await resetStorePassword({ resetId, code, password, passwordConfirmation })
      toast.success('Senha alterada com sucesso.')
      setStep('done')
    } catch (error) {
      toast.error(error.message || 'Não foi possível alterar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-dark-600 bg-dark-800 p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <BrandLogo
            size="lg"
            name={storeInfo?.name || storeInfo?.store_name || ''}
            logoUrl={storeInfo?.logo_url}
            className="mb-4 justify-center"
            textClassName="text-2xl"
          />
          <p className="text-gray-400">Recuperação de senha</p>
        </div>

        {step === 'email' && (
          <form onSubmit={sendCode} className="space-y-5">
            <p className="text-sm leading-6 text-gray-300">Informe o e-mail do painel da loja. Vamos enviar um código para você criar uma nova senha.</p>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">E-mail</span>
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-dark-600 bg-dark-900 px-4 py-3 text-white outline-none focus:border-white" />
            </label>
            <Button type="submit" loading={loading} className="w-full" size="lg">Receber código</Button>
            <a className="block text-center text-sm font-semibold text-blue-300" href={`${basePath}/login`}>Voltar para o login</a>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode} className="space-y-5">
            <p className="text-sm leading-6 text-gray-300">Digite o código enviado para <strong>{maskedEmail}</strong>.</p>
            <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border border-dark-600 bg-dark-900 px-4 py-3 text-center text-2xl tracking-[0.35em] text-white outline-none focus:border-white" />
            <Button type="submit" loading={loading} className="w-full" size="lg">Confirmar código</Button>
            <button type="button" onClick={() => setStep('email')} className="w-full text-sm font-semibold text-blue-300">Usar outro e-mail</button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={savePassword} className="space-y-5">
            <PasswordField label="Nova senha" value={password} onChange={(event) => setPassword(event.target.value)} />
            <PasswordField label="Confirmar nova senha" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} />
            <Button type="submit" loading={loading} className="w-full" size="lg">Salvar nova senha</Button>
          </form>
        )}

        {step === 'done' && (
          <div className="space-y-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-2xl text-emerald-300">✓</div>
            <h1 className="text-2xl font-bold text-white">Senha alterada.</h1>
            <p className="text-sm leading-6 text-gray-300">Agora você já pode entrar no painel da sua loja com a nova senha.</p>
            <a className="block rounded-lg bg-white px-4 py-3 font-bold text-black" href={`${basePath}/login`}>Entrar no painel</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default PasswordReset
