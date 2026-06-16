import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, ChevronLeft, Lock, Save } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import {
  railsGetFeatureAccess,
  railsGetStoreAiSettings,
  railsUpdateStoreAiSettings,
} from '../../services/storeApi'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

const STORE_AI_FEATURE_KEYS = ['store_ai', 'ai', 'whatsapp_ai', 'artificial_intelligence', 'ai_assistant']

const defaultStoreAiSettings = {
  enabled: false,
  auto_reply_whatsapp: false,
  assistant_name: 'Assistente da Loja',
  initial_message: 'Ola! Como posso ajudar?',
  tone: 'simpatico, objetivo e natural',
  allow_orders: true,
  allow_products: true,
  allow_hours: true,
  allow_delivery: true,
  allow_payments: true,
  allow_promotions: true,
  allow_order_status: true,
}

const compactCheckboxClass = 'flex items-center gap-3 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-gray-200'

const isStoreAiEnabled = (featureAccess) => {
  const features = Array.isArray(featureAccess?.features) ? featureAccess.features : []
  const allowed = Array.isArray(featureAccess?.allowed) ? featureAccess.allowed : []
  const indexedFeature = features.find((feature) => STORE_AI_FEATURE_KEYS.includes(feature.key))

  if (indexedFeature) return indexedFeature.enabled !== false
  return STORE_AI_FEATURE_KEYS.some((key) => allowed.includes(key))
}

const StoreAiUnavailable = ({ basePath }) => (
  <Card>
    <CardContent className="p-6 sm:p-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dark-900 text-yellow-300">
          <Lock size={26} />
        </span>
        <h2 className="mt-4 text-2xl font-bold text-white">Atendimento automatico indisponivel no momento.</h2>
        <p className="mt-2 text-sm text-gray-400">
          Entre em contato com o suporte para habilitar este recurso.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={`${basePath}/admin/support`}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200"
          >
            Falar com suporte
          </Link>
          <Link
            to={`${basePath}/admin/dashboard`}
            className="rounded-lg border border-dark-600 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-dark-400"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </CardContent>
  </Card>
)

const StoreAiSettings = () => {
  const basePath = useCompanyBasePath()
  const [featureLoading, setFeatureLoading] = useState(true)
  const [featureAllowed, setFeatureAllowed] = useState(false)
  const [settings, setSettings] = useState(defaultStoreAiSettings)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true

    railsGetFeatureAccess()
      .then((payload) => {
        if (!alive) return
        const access = payload?.feature_access || payload
        setFeatureAllowed(isStoreAiEnabled(access))
      })
      .catch(() => {
        if (alive) setFeatureAllowed(false)
      })
      .finally(() => {
        if (alive) setFeatureLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (featureLoading || !featureAllowed) return undefined

    let alive = true
    setLoading(true)
    setMessage('')

    railsGetStoreAiSettings()
      .then((payload) => {
        if (!alive) return
        setSettings({ ...defaultStoreAiSettings, ...(payload.settings || {}) })
      })
      .catch((error) => {
        if (!alive) return
        if (error?.status === 403 || error?.code === 'feature_not_available') {
          setFeatureAllowed(false)
        } else {
          setMessage(error.message || 'Nao foi possivel carregar a IA da loja.')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [featureAllowed, featureLoading])

  const update = (field, value) => setSettings((current) => ({ ...current, [field]: value }))

  const permissionOptions = useMemo(() => ([
    ['allow_orders', 'Responder sobre pedidos'],
    ['allow_products', 'Responder sobre produtos'],
    ['allow_hours', 'Responder sobre horarios'],
    ['allow_delivery', 'Responder sobre entrega'],
    ['allow_payments', 'Responder sobre pagamentos'],
    ['allow_promotions', 'Responder sobre promocoes'],
    ['allow_order_status', 'Consultar status do pedido'],
  ]), [])

  const save = async () => {
    setSaving(true)
    setMessage('')

    try {
      const payload = await railsUpdateStoreAiSettings(settings)
      setSettings({ ...defaultStoreAiSettings, ...(payload.settings || {}) })
      setMessage('Configuracoes da IA salvas com sucesso.')
    } catch (error) {
      if (error?.status === 403 || error?.code === 'feature_not_available') {
        setFeatureAllowed(false)
        setMessage('')
      } else {
        setMessage(error.message || 'Nao foi possivel salvar a IA da loja.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to={`${basePath}/admin/dashboard`} className="mb-3 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ChevronLeft size={16} />
            Voltar ao dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Inteligencia Artificial</h1>
          <p className="mt-1 text-sm text-gray-400">Configure o atendimento automatico da sua loja.</p>
        </div>
        {featureAllowed && (
          <Button type="button" onClick={save} loading={saving}>
            <Save size={18} className="mr-2" />
            Salvar IA
          </Button>
        )}
      </div>

      {featureLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-400">Verificando acesso ao modulo de IA...</CardContent>
        </Card>
      ) : !featureAllowed ? (
        <StoreAiUnavailable basePath={basePath} />
      ) : (
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="flex items-start gap-3 rounded-xl border border-dark-700 bg-dark-900 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-800 text-yellow-300">
                <Bot size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Atendimento automatico</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Ajuste o comportamento da IA que atende clientes pelo WhatsApp.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">Carregando IA da loja...</p>
            ) : (
              <>
                {message && <div className="rounded-lg border border-dark-600 bg-dark-900 p-3 text-sm text-gray-200">{message}</div>}

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label className={compactCheckboxClass}>
                    <input type="checkbox" checked={settings.enabled} onChange={(event) => update('enabled', event.target.checked)} />
                    Ativar IA da loja
                  </label>
                  <label className={compactCheckboxClass}>
                    <input
                      type="checkbox"
                      checked={settings.auto_reply_whatsapp}
                      onChange={(event) => update('auto_reply_whatsapp', event.target.checked)}
                      disabled={!settings.enabled}
                    />
                    Responder automaticamente no WhatsApp
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Nome da IA" value={settings.assistant_name} onChange={(event) => update('assistant_name', event.target.value)} />
                  <Input label="Tom de voz" value={settings.tone} onChange={(event) => update('tone', event.target.value)} />
                </div>

                <Textarea label="Mensagem inicial" rows={3} value={settings.initial_message} onChange={(event) => update('initial_message', event.target.value)} />

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {permissionOptions.map(([field, label]) => (
                    <label className={compactCheckboxClass} key={field}>
                      <input type="checkbox" checked={Boolean(settings[field])} onChange={(event) => update(field, event.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StoreAiSettings
