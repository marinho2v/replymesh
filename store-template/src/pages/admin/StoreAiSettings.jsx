import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Bot, ChevronLeft, CheckCircle2, Clock3, Lock, MessageCircle, PlayCircle, Save, ShoppingBag, Zap } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  railsGetFeatureAccess,
  railsGetStoreAiSettings,
  railsSimulateStoreAi,
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
  ai_provider: 'anthropic',
  ai_model: '',
  ai_mode: 'answers',
  ai_sales_mode_enabled: false,
  ai_auto_reply_enabled: false,
  ai_daily_message_limit: 100,
  ai_monthly_message_limit: 3000,
  ai_monthly_token_limit: 300000,
  identify_customer_by_phone: true,
  confirm_saved_address: true,
  create_customer: true,
  allow_address_update: true,
  auto_cart_enabled: false,
  create_order_after_confirmation: false,
  calculate_delivery_fee: true,
  verify_store_hours: true,
  verify_delivery_area: true,
  apply_coupon_enabled: true,
  offer_cash: true,
  offer_pix: true,
  auto_generate_mercadopago_pix: false,
  send_pix_copy_paste: true,
  wait_payment_confirmation: true,
  pause_on_attendant_reply: true,
  pause_after_order_confirmation: true,
  handoff_on_unknown: true,
  handoff_on_request: true,
}

const defaultMetrics = {
  conversations_today: 0,
  helped_orders: 0,
  answered_messages: 0,
  estimated_saving_label: '0 min',
}

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
        <h2 className="mt-4 text-2xl font-bold text-white">Assistente virtual indisponivel no momento.</h2>
        <p className="mt-2 text-sm text-gray-400">Entre em contato com o suporte para habilitar este recurso.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={`${basePath}/admin/support`} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-200">
            Falar com suporte
          </Link>
          <Link to={`${basePath}/admin/dashboard`} className="rounded-lg border border-dark-600 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-dark-400">
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </CardContent>
  </Card>
)

const statusFor = (settings) => {
  if (!settings.enabled) {
    return { label: 'Offline', detail: 'O assistente esta desligado.', color: 'bg-gray-500', tone: 'border-dark-700 bg-dark-900 text-gray-300' }
  }
  if (!settings.auto_reply_whatsapp) {
    return { label: 'Configuracao pendente', detail: 'Ative a resposta automatica para atender pelo WhatsApp.', color: 'bg-yellow-400', tone: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-100' }
  }
  return { label: 'Online', detail: 'Pronto para responder clientes no WhatsApp.', color: 'bg-emerald-400', tone: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' }
}

const automationModes = [
  {
    value: 'answers',
    title: 'Informações',
    description: 'Responde dúvidas sobre produtos, horários, promoções, entrega e pagamentos.',
    badge: null,
  },
  {
    value: 'sales_assistant',
    title: 'Vendas Assistidas',
    description: 'Ajuda o cliente a escolher produtos, monta o pedido e coleta informações antes da confirmação.',
    badge: 'Recomendado',
  },
  {
    value: 'auto_seller',
    title: 'Vendas Automáticas',
    description: 'Pode criar pedidos automaticamente e gerar cobrança Pix quando configurado.',
    badge: 'Beta',
  },
]

const MetricCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-dark-800 text-yellow-300">
      <Icon size={19} />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="mt-1 text-sm text-gray-400">{label}</p>
  </div>
)

const StoreAiSettings = () => {
  const basePath = useCompanyBasePath()
  const [featureLoading, setFeatureLoading] = useState(true)
  const [featureAllowed, setFeatureAllowed] = useState(false)
  const [settings, setSettings] = useState(defaultStoreAiSettings)
  const [metrics, setMetrics] = useState(defaultMetrics)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [simPhone, setSimPhone] = useState('21999999999')
  const [simMessage, setSimMessage] = useState('Oi, quero um hamburguer')
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState(null)

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
        setMetrics({ ...defaultMetrics, ...(payload.metrics || {}) })
      })
      .catch((error) => {
        if (!alive) return
        if (error?.status === 403 || error?.code === 'feature_not_available') {
          setFeatureAllowed(false)
        } else {
          setMessage(error.message || 'Nao foi possivel carregar o assistente virtual.')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [featureAllowed, featureLoading])

  const update = (field, value) => {
    setSettings((current) => {
      const next = { ...current, [field]: value }
      if (field === 'auto_reply_whatsapp') next.ai_auto_reply_enabled = value
      if (field === 'ai_auto_reply_enabled') next.auto_reply_whatsapp = value
      return next
    })
  }

  const selectAutomationMode = (value) => {
    setSettings((current) => ({
      ...current,
      ai_mode: value,
      ai_sales_mode_enabled: value !== 'answers',
      auto_cart_enabled: value !== 'answers',
      create_order_after_confirmation: value === 'auto_seller',
      auto_generate_mercadopago_pix: value === 'auto_seller',
    }))
  }

  const save = async () => {
    setSaving(true)
    setMessage('')

    try {
      const payload = await railsUpdateStoreAiSettings(settings)
      setSettings({ ...defaultStoreAiSettings, ...(payload.settings || {}) })
      setMetrics({ ...defaultMetrics, ...(payload.metrics || metrics) })
      setMessage('Assistente virtual salvo com sucesso.')
    } catch (error) {
      if (error?.status === 403 || error?.code === 'feature_not_available') {
        setFeatureAllowed(false)
        setMessage('')
      } else {
        setMessage(error.message || 'Nao foi possivel salvar o assistente virtual.')
      }
    } finally {
      setSaving(false)
    }
  }

  const simulate = async () => {
    setSimLoading(true)
    setSimResult(null)
    try {
      const result = await railsSimulateStoreAi({ phone: simPhone, message: simMessage })
      setSimResult(result)
    } catch (error) {
      setSimResult({ success: false, error: error.message || 'Nao foi possivel simular a resposta.' })
    } finally {
      setSimLoading(false)
    }
  }

  const status = statusFor(settings)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to={`${basePath}/admin/dashboard`} className="mb-3 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ChevronLeft size={16} />
            Voltar ao dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Inteligencia Artificial</h1>
          <p className="mt-1 text-sm text-gray-400">Atendimento virtual para vender e responder clientes pelo WhatsApp.</p>
        </div>
        {featureAllowed && (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`${basePath}/admin/ai/logs`}
              className="inline-flex items-center rounded-lg border border-dark-600 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-dark-400"
            >
              <Activity size={18} className="mr-2" />
              Ver logs
            </Link>
            <Button type="button" onClick={save} loading={saving}>
              <Save size={18} className="mr-2" />
              Salvar assistente
            </Button>
          </div>
        )}
      </div>

      {featureLoading ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-400">Verificando acesso ao assistente virtual...</CardContent>
        </Card>
      ) : !featureAllowed ? (
        <StoreAiUnavailable basePath={basePath} />
      ) : (
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-5 p-5">
              <div className="flex flex-col gap-4 rounded-2xl border border-dark-700 bg-gradient-to-br from-dark-900 to-dark-950 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                    <Bot size={23} />
                  </span>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-yellow-300">Assistente Virtual</p>
                    <h2 className="mt-1 text-2xl font-bold text-white">Atendimento inteligente da loja</h2>
                    <p className="mt-2 max-w-2xl text-sm text-gray-400">
                      Responda clientes, ajude na escolha dos produtos e reduza o tempo do atendimento no WhatsApp.
                    </p>
                  </div>
                </div>

                <div className={`rounded-2xl border px-4 py-3 ${status.tone}`}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span className={`h-2.5 w-2.5 rounded-full ${status.color}`} />
                    Status da IA: {status.label}
                  </div>
                  <p className="mt-1 text-xs opacity-80">{status.detail}</p>
                </div>
              </div>

              {loading ? (
                <p className="text-sm text-gray-400">Carregando assistente virtual...</p>
              ) : (
                <>
                  {message && <div className="rounded-lg border border-dark-600 bg-dark-900 p-3 text-sm text-gray-200">{message}</div>}

                  <section className="rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
                    <h3 className="text-lg font-bold text-white">Assistente Virtual</h3>
                    <p className="mt-1 text-sm text-gray-400">Controle se a IA aparece e se responde automaticamente no WhatsApp.</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm font-semibold text-gray-100">
                        <input type="checkbox" checked={settings.enabled} onChange={(event) => update('enabled', event.target.checked)} />
                        Ativar assistente virtual
                      </label>
                      <label className="flex items-center gap-3 rounded-xl border border-dark-700 bg-dark-900 px-4 py-3 text-sm font-semibold text-gray-100">
                        <input type="checkbox" checked={settings.auto_reply_whatsapp} onChange={(event) => update('auto_reply_whatsapp', event.target.checked)} disabled={!settings.enabled} />
                        Responder automaticamente no WhatsApp
                      </label>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white">Nivel de Automacao</h3>
                      <p className="mt-1 text-sm text-gray-400">Escolha o quanto o assistente pode ajudar no atendimento.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      {automationModes.map((mode) => {
                        const active = settings.ai_mode === mode.value
                        return (
                          <button
                            type="button"
                            key={mode.value}
                            onClick={() => selectAutomationMode(mode.value)}
                            className={`min-h-[170px] rounded-2xl border p-5 text-left transition ${
                              active
                                ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-500/10'
                                : 'border-dark-700 bg-dark-900 hover:border-dark-500'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-lg font-bold text-white">{mode.title}</span>
                              {active && <CheckCircle2 size={20} className="text-yellow-300" />}
                            </div>
                            {mode.badge && (
                              <span className="mt-3 inline-flex rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-black">
                                {mode.badge}
                              </span>
                            )}
                            <p className="mt-4 text-sm leading-6 text-gray-400">{mode.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard icon={MessageCircle} label="Conversas hoje" value={metrics.conversations_today} />
                    <MetricCard icon={ShoppingBag} label="Pedidos ajudados pela IA" value={metrics.helped_orders} />
                    <MetricCard icon={Zap} label="Mensagens respondidas" value={metrics.answered_messages} />
                    <MetricCard icon={Clock3} label="Economia estimada de atendimento" value={metrics.estimated_saving_label} />
                  </section>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h3 className="text-lg font-bold text-white">Teste rapido</h3>
                <p className="mt-1 text-sm text-gray-400">Simule uma conversa sem enviar mensagem real pelo WhatsApp.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
                <Input label="Telefone de teste" value={simPhone} onChange={(event) => setSimPhone(event.target.value)} />
                <Input label="Mensagem do cliente" value={simMessage} onChange={(event) => setSimMessage(event.target.value)} />
                <Button type="button" onClick={simulate} loading={simLoading}>
                  <PlayCircle size={18} className="mr-2" />
                  Simular
                </Button>
              </div>
              {simResult && (
                <div className="rounded-xl border border-dark-700 bg-dark-900 p-4 text-sm text-gray-200">
                  <p className="mb-2 font-bold text-white">Resposta do assistente</p>
                  <p className="whitespace-pre-wrap">{simResult.answer || simResult.error || 'Sem resposta.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default StoreAiSettings
