import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, ChevronLeft, Lock, PlayCircle, Save } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
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

const compactCheckboxClass = 'flex items-center gap-3 rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-gray-200'
const sectionClass = 'rounded-xl border border-dark-700 bg-dark-950/70 p-4'
const sectionTitleClass = 'mb-3 text-sm font-bold uppercase tracking-wide text-yellow-300'

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

const CheckboxGroup = ({ options, settings, update }) => (
  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
    {options.map(([field, label]) => (
      <label className={compactCheckboxClass} key={field}>
        <input type="checkbox" checked={Boolean(settings[field])} onChange={(event) => update(field, event.target.checked)} />
        {label}
      </label>
    ))}
  </div>
)

const StoreAiSettings = () => {
  const basePath = useCompanyBasePath()
  const [featureLoading, setFeatureLoading] = useState(true)
  const [featureAllowed, setFeatureAllowed] = useState(false)
  const [settings, setSettings] = useState(defaultStoreAiSettings)
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

  const update = (field, value) => {
    setSettings((current) => {
      const next = { ...current, [field]: value }
      if (field === 'auto_reply_whatsapp') next.ai_auto_reply_enabled = value
      if (field === 'ai_auto_reply_enabled') next.auto_reply_whatsapp = value
      if (field === 'ai_mode') next.ai_sales_mode_enabled = value !== 'answers'
      return next
    })
  }

  const permissionOptions = useMemo(() => ([
    ['allow_orders', 'Responder sobre pedidos'],
    ['allow_products', 'Responder sobre produtos'],
    ['allow_hours', 'Responder sobre horarios'],
    ['allow_delivery', 'Responder sobre entrega'],
    ['allow_payments', 'Responder sobre pagamentos'],
    ['allow_promotions', 'Responder sobre promocoes'],
    ['allow_order_status', 'Consultar status do pedido'],
  ]), [])

  const clientOptions = useMemo(() => ([
    ['identify_customer_by_phone', 'Identificar cliente existente pelo telefone'],
    ['confirm_saved_address', 'Confirmar endereco salvo'],
    ['create_customer', 'Cadastrar novo cliente'],
    ['allow_address_update', 'Permitir atualizar endereco'],
  ]), [])

  const orderOptions = useMemo(() => ([
    ['auto_cart_enabled', 'Montar carrinho automaticamente'],
    ['create_order_after_confirmation', 'Criar pedido apos confirmacao'],
    ['calculate_delivery_fee', 'Calcular taxa de entrega'],
    ['verify_store_hours', 'Verificar horario da loja'],
    ['verify_delivery_area', 'Verificar area de entrega'],
    ['apply_coupon_enabled', 'Aplicar cupom se informado'],
  ]), [])

  const paymentOptions = useMemo(() => ([
    ['offer_cash', 'Oferecer dinheiro'],
    ['offer_pix', 'Oferecer Pix'],
    ['auto_generate_mercadopago_pix', 'Gerar Pix Mercado Pago automaticamente'],
    ['send_pix_copy_paste', 'Enviar Pix copia e cola'],
    ['wait_payment_confirmation', 'Aguardar confirmacao de pagamento'],
  ]), [])

  const handoffOptions = useMemo(() => ([
    ['pause_on_attendant_reply', 'Pausar IA quando atendente responder'],
    ['pause_after_order_confirmation', 'Pausar IA apos pedido confirmado'],
    ['handoff_on_unknown', 'Transferir para humano quando nao entender'],
    ['handoff_on_request', 'Transferir para humano se cliente pedir atendente'],
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

  const simulate = async () => {
    setSimLoading(true)
    setSimResult(null)
    try {
      const result = await railsSimulateStoreAi({ phone: simPhone, message: simMessage })
      setSimResult(result)
    } catch (error) {
      setSimResult({ success: false, error: error.message || 'Nao foi possivel simular a IA.' })
    } finally {
      setSimLoading(false)
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
          <p className="mt-1 text-sm text-gray-400">Configure atendimento, vendas e simulacao segura da IA da loja.</p>
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
                <h2 className="text-lg font-bold text-white">IA da loja</h2>
                <p className="mt-1 text-sm text-gray-400">
                  O modo vendedor fica desligado por padrao. Ative apenas em empresa QA ou ambiente controlado.
                </p>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400">Carregando IA da loja...</p>
            ) : (
              <>
                {message && <div className="rounded-lg border border-dark-600 bg-dark-900 p-3 text-sm text-gray-200">{message}</div>}

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>1. Status da IA</h2>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <label className={compactCheckboxClass}>
                      <input type="checkbox" checked={settings.enabled} onChange={(event) => update('enabled', event.target.checked)} />
                      Ativar IA da loja
                    </label>
                    <label className={compactCheckboxClass}>
                      <input type="checkbox" checked={settings.auto_reply_whatsapp} onChange={(event) => update('auto_reply_whatsapp', event.target.checked)} disabled={!settings.enabled} />
                      Responder automaticamente no WhatsApp
                    </label>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm text-gray-300">
                      Provedor de IA
                      <select value={settings.ai_provider || 'anthropic'} onChange={(event) => update('ai_provider', event.target.value)} className="mt-1 w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-white">
                        <option value="anthropic">Anthropic / Claude</option>
                        <option value="groq">Groq</option>
                        <option value="openai">OpenAI</option>
                        <option value="disabled">Desativado</option>
                      </select>
                    </label>
                    <Input label="Modelo" value={settings.ai_model || ''} onChange={(event) => update('ai_model', event.target.value)} placeholder="ex: llama-3.1-8b-instant" />
                    <Input label="Limite diario de mensagens" type="number" value={settings.ai_daily_message_limit} onChange={(event) => update('ai_daily_message_limit', Number(event.target.value))} />
                    <Input label="Limite mensal de mensagens" type="number" value={settings.ai_monthly_message_limit} onChange={(event) => update('ai_monthly_message_limit', Number(event.target.value))} />
                  </div>
                </section>

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>2. Modo de atendimento</h2>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      ['answers', 'Somente respostas', 'Responde duvidas sem montar carrinho.'],
                      ['sales_assistant', 'Assistente de vendas', 'Ajuda a vender, mas com confirmacao humana/segura.'],
                      ['auto_seller', 'Vendedor automatico', 'Avanca carrinho e pedido quando liberado.'],
                    ].map(([value, title, description]) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => update('ai_mode', value)}
                        className={`rounded-xl border p-4 text-left transition ${settings.ai_mode === value ? 'border-yellow-400 bg-yellow-400/10 text-white' : 'border-dark-700 bg-dark-900 text-gray-300 hover:border-dark-500'}`}
                      >
                        <span className="font-bold">{title}</span>
                        <span className="mt-1 block text-xs text-gray-400">{description}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>3. Identidade e escopo</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input label="Nome da IA" value={settings.assistant_name} onChange={(event) => update('assistant_name', event.target.value)} />
                    <Input label="Tom de voz" value={settings.tone} onChange={(event) => update('tone', event.target.value)} />
                  </div>
                  <div className="mt-4">
                    <Textarea label="Mensagem inicial" rows={3} value={settings.initial_message} onChange={(event) => update('initial_message', event.target.value)} />
                  </div>
                  <div className="mt-4">
                    <CheckboxGroup options={permissionOptions} settings={settings} update={update} />
                  </div>
                </section>

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>4. Cliente</h2>
                  <CheckboxGroup options={clientOptions} settings={settings} update={update} />
                </section>

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>5. Pedido</h2>
                  <CheckboxGroup options={orderOptions} settings={settings} update={update} />
                </section>

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>6. Pagamento</h2>
                  <CheckboxGroup options={paymentOptions} settings={settings} update={update} />
                </section>

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>7. Atendimento humano</h2>
                  <CheckboxGroup options={handoffOptions} settings={settings} update={update} />
                </section>

                <section className={sectionClass}>
                  <h2 className={sectionTitleClass}>8. Testar IA sem WhatsApp real</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr_auto] md:items-end">
                    <Input label="Telefone de teste" value={simPhone} onChange={(event) => setSimPhone(event.target.value)} />
                    <Input label="Mensagem do cliente" value={simMessage} onChange={(event) => setSimMessage(event.target.value)} />
                    <Button type="button" onClick={simulate} loading={simLoading}>
                      <PlayCircle size={18} className="mr-2" />
                      Simular resposta
                    </Button>
                  </div>
                  {simResult && (
                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <div className="rounded-lg border border-dark-700 bg-dark-900 p-4 text-sm text-gray-200">
                        <p className="mb-2 font-bold text-white">Resposta</p>
                        <p className="whitespace-pre-wrap">{simResult.answer || simResult.error || 'Sem resposta.'}</p>
                      </div>
                      <div className="rounded-lg border border-dark-700 bg-dark-900 p-4 text-xs text-gray-300">
                        <p className="mb-2 font-bold text-white">Diagnostico seguro</p>
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap">{JSON.stringify({
                          status: simResult.status,
                          stage: simResult.stage,
                          next_action: simResult.next_action,
                          products: simResult.products,
                          cart: simResult.cart,
                          order: simResult.order,
                        }, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StoreAiSettings
