import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, MessageSquare, QrCode, RefreshCw, Send, Smartphone } from 'lucide-react'
import {
  railsEnsureWhatsappInstance,
  railsGetWhatsappInstanceStatus,
  railsGetWhatsappConfiguration,
  railsGetWhatsappQrCode,
  railsSendWhatsappTest,
  railsGetWhatsappTemplates,
} from '../../services/storeApi'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { toast } from 'sonner'
import { scheduleAdaptivePoll } from '../../utils/adaptivePolling'

const STATUS_POLL_INTERVAL = 30000
const HIDDEN_STATUS_POLL_INTERVAL = 120000

const statusLabel = {
  connected: 'Conectado',
  connecting: 'Conectando',
  disconnected: 'Desconectado',
  created: 'Preparado',
  not_created: 'Nao criado',
  error: 'Erro',
}

const Whatsapp = () => {
  const basePath = useCompanyBasePath()
  const [instances, setInstances] = useState([])
  const [templates, setTemplates] = useState([])
  const [qrCode, setQrCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ensuring, setEnsuring] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [testOrderId, setTestOrderId] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [whatsappMode, setWhatsappMode] = useState('automatic')
  const pollRef = useRef(null)

  const instance = useMemo(() => instances[0] || null, [instances])
  const connected = instance?.status === 'connected'

  const load = async () => {
    setLoading(true)
    try {
      const [configuration, loadedTemplates] = await Promise.all([
        railsGetWhatsappConfiguration(),
        railsGetWhatsappTemplates().catch(() => []),
      ])
      setWhatsappMode(configuration.whatsapp_mode || 'automatic')
      setInstances(configuration.instances || [])
      setTemplates(loadedTemplates || [])
    } catch (error) {
      toast.error(error.message || 'Erro ao carregar WhatsApp')
    } finally {
      setLoading(false)
    }
  }

  // Atualiza status silenciosamente via cache/job para nao sobrecarregar a Evolution.
  const pollStatus = async () => {
    if (!instance || whatsappMode === 'manual') return
    try {
      const updated = await railsGetWhatsappInstanceStatus(instance.id)
      if (updated) {
        setInstances([updated])
        if (updated.status === 'connected') setQrCode(null)
      }
    } catch {
      // Silencioso — nao interrompe a experiência
    }
  }

  const ensureInstance = async () => {
    setEnsuring(true)
    try {
      const prepared = await railsEnsureWhatsappInstance()
      setInstances(prepared ? [prepared] : [])
      setQrCode(null)
      toast.success('Instancia WhatsApp preparada para esta empresa')
    } catch (error) {
      toast.error(error.message || 'Erro ao preparar instancia')
    } finally {
      setEnsuring(false)
    }
  }

  const refreshStatus = async () => {
    if (!instance) return

    try {
      const updated = await railsGetWhatsappInstanceStatus(instance.id, { force: true })
      setInstances(updated ? [updated] : [])
      if (updated?.status === 'connected') setQrCode(null)
      toast.success('Status atualizado')
    } catch (error) {
      toast.error(error.message || 'Erro ao atualizar status')
    }
  }

  const generateQrCode = async () => {
    if (!instance || connected) return

    setGenerating(true)
    try {
      const payload = await railsGetWhatsappQrCode(instance.id)
      setQrCode(payload.qrcode)
      if (payload.instance) {
        setInstances([{ ...instance, ...payload.instance }])
      }
      toast.success('QR Code gerado')
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('session already logged in')) {
        await refreshStatus()
        setQrCode({ type: 'connected', value: null })
        toast.success('WhatsApp ja esta conectado')
        return
      }
      toast.error(error.message || 'Erro ao gerar QR Code')
    } finally {
      setGenerating(false)
    }
  }

  const sendTest = async () => {
    if (!testOrderId.trim()) {
      toast.error('Informe o ID do pedido teste')
      return
    }

    setSendingTest(true)
    try {
      const result = await railsSendWhatsappTest({ orderId: testOrderId.trim(), status: 'accepted' })
      if (result.manual_whatsapp?.url) {
        window.open(result.manual_whatsapp.url, '_blank', 'noopener,noreferrer')
        toast.success('Mensagem manual preparada. Confira e envie no WhatsApp.')
        return
      }
      toast[result.sent ? 'success' : 'info'](result.sent ? 'Mensagem teste enviada' : (result.message || 'Envio teste nao disparado'))
    } catch (error) {
      toast.error(error.message || 'Erro no envio teste')
    } finally {
      setSendingTest(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Auto-polling de status
  useEffect(() => {
    if (!instance) return
    pollRef.current = scheduleAdaptivePoll({
      run: pollStatus,
      visibleMs: STATUS_POLL_INTERVAL,
      hiddenMs: HIDDEN_STATUS_POLL_INTERVAL,
      maxMs: 120000,
      enabled: whatsappMode !== 'manual',
    })
    return () => pollRef.current?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance?.id, instance?.status, whatsappMode])

  if (!loading && whatsappMode === 'manual') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
            <p className="text-sm text-gray-400">Envio manual pelo WhatsApp Web ou aplicativo.</p>
          </div>
          <Link
            to={`${basePath}/admin/whatsapp/templates`}
            className="inline-flex items-center justify-center rounded-lg border border-dark-600 px-4 py-2 text-sm text-gray-200 hover:bg-dark-800"
          >
            <MessageSquare size={18} className="mr-2" />
            Templates WhatsApp
          </Link>
        </div>

        <section className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 shrink-0 text-blue-300" size={22} />
            <div>
              <h2 className="font-bold text-white">Modo manual ativo</h2>
              <p className="mt-1 text-sm leading-6 text-blue-100/80">
                As mensagens devem ser enviadas pelo atendente. Ao atualizar um pedido, o sistema prepara o texto usando seus templates e abre o WhatsApp para conferencia e envio.
              </p>
              <p className="mt-2 text-xs text-gray-400">Nenhuma instancia, QR Code ou reconexao com Replymesh Connect e necessaria neste modo.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dark-700 bg-dark-900">
          <div className="flex items-center justify-between border-b border-dark-700 px-5 py-4">
            <div>
              <h2 className="font-semibold text-white">Templates de mensagem</h2>
              <p className="mt-0.5 text-xs text-gray-500">{templates.length} templates configurados para gerar mensagens manuais.</p>
            </div>
            <Link to={`${basePath}/admin/whatsapp/templates`} className="text-xs text-gray-400 underline underline-offset-2 hover:text-white">
              Editar templates
            </Link>
          </div>
          <div className="divide-y divide-dark-700">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{template.title || template.template_key}</p>
                  <p className="truncate text-xs text-gray-500">{template.template_key}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${template.enabled !== false ? 'bg-green-900/40 text-green-300' : 'bg-dark-700 text-gray-400'}`}>
                  {template.enabled !== false ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-dark-700 bg-dark-900 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-semibold text-white">Teste manual de mensagem</h2>
              <p className="mt-1 text-sm text-gray-400">
                Informe um pedido desta empresa. O sistema monta a mensagem pelo template e abre o WhatsApp para envio manual.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={testOrderId}
                onChange={(event) => setTestOrderId(event.target.value)}
                placeholder="ID do pedido teste"
                className="rounded-lg border border-dark-600 bg-dark-950 px-4 py-2 text-sm text-white outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={sendTest}
                disabled={sendingTest}
                className="inline-flex items-center justify-center rounded-lg bg-blue-400 px-4 py-2 text-sm font-bold text-black hover:bg-blue-300 disabled:opacity-60"
              >
                <Send size={18} className="mr-2" />
                {sendingTest ? 'Preparando...' : 'Preparar WhatsApp'}
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
          <p className="text-sm text-gray-400">Uma empresa usa uma unica conexao WhatsApp via Replymesh Connect.</p>
        </div>
        <Link
          to={`${basePath}/admin/whatsapp/templates`}
          className="inline-flex items-center justify-center rounded-lg border border-dark-600 px-4 py-2 text-sm text-gray-200 hover:bg-dark-800"
        >
          <MessageSquare size={18} className="mr-2" />
          Templates WhatsApp
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-dark-700 bg-dark-900 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-yellow-300">
                <Smartphone size={18} />
                Conexao
              </div>
              <h2 className="mt-2 text-xl font-bold text-white">
                {loading ? 'Carregando...' : instance?.instance_name || 'Nenhuma instancia preparada'}
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                {connected ? 'Sessao ativa. QR Code fica oculto enquanto estiver conectado.' : 'Gere o QR Code para conectar o WhatsApp da loja.'}
              </p>
            </div>

            <div className={`rounded-full px-3 py-1 text-sm font-bold ${
              connected ? 'bg-green-500/15 text-green-300' : 'bg-yellow-500/15 text-yellow-300'
            }`}>
              {statusLabel[instance?.status] || instance?.status || 'Sem instancia'}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-dark-700 bg-dark-950 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
              <p className="mt-1 font-semibold text-white">{statusLabel[instance?.status] || instance?.status || '-'}</p>
            </div>
            <div className="rounded-lg border border-dark-700 bg-dark-950 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Numero conectado</p>
              <p className="mt-1 break-all font-semibold text-white">{instance?.connected_number || '-'}</p>
            </div>
            <div className="rounded-lg border border-dark-700 bg-dark-950 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Ultima sincronizacao</p>
              <p className="mt-1 font-semibold text-white">
                {instance?.last_remote_sync_at ? new Date(instance.last_remote_sync_at).toLocaleString('pt-BR') : '-'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!instance && (
              <button
                type="button"
                onClick={ensureInstance}
                disabled={ensuring}
                className="inline-flex items-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                <QrCode size={18} className="mr-2" />
                {ensuring ? 'Preparando...' : 'Preparar instancia'}
              </button>
            )}
            {instance && (
              <button
                type="button"
                onClick={refreshStatus}
                className="inline-flex items-center rounded-lg border border-dark-600 px-4 py-2 text-sm text-gray-200 hover:bg-dark-800"
              >
                <RefreshCw size={18} className="mr-2" />
                Atualizar status
              </button>
            )}
            {instance && !connected && (
              <button
                type="button"
                onClick={generateQrCode}
                disabled={generating}
                className="inline-flex items-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
              >
                <QrCode size={18} className="mr-2" />
                {generating ? 'Gerando...' : 'Reconectar / gerar QR'}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-dark-700 bg-dark-900 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-yellow-300">
            <QrCode size={18} />
            QR Code
          </div>
          <div className="mt-4 flex aspect-square items-center justify-center rounded-xl bg-white p-4">
            {connected ? (
              <div className="text-center">
                <CheckCircle className="mx-auto text-green-600" size={42} />
                <p className="mt-3 text-lg font-bold text-gray-900">WhatsApp conectado</p>
                <p className="mt-2 text-sm text-gray-600">{instance?.connected_number}</p>
              </div>
            ) : qrCode?.type === 'base64' && qrCode.value ? (
              <img src={qrCode.value} alt="QR Code WhatsApp" className="h-full w-full object-contain" />
            ) : qrCode?.value ? (
              <p className="break-all text-sm text-gray-900">{qrCode.value}</p>
            ) : (
              <p className="text-center text-sm text-gray-500">QR Code aparece aqui quando a instancia estiver desconectada.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-dark-700 bg-dark-900 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-white">Teste controlado de envio</h2>
            <p className="mt-1 text-sm text-gray-400">
              Envia somente o template pedido_aceito para um pedido de teste desta empresa.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={testOrderId}
              onChange={(event) => setTestOrderId(event.target.value)}
              placeholder="ID do pedido teste"
              className="rounded-lg border border-dark-600 bg-dark-950 px-4 py-2 text-sm text-white outline-none focus:border-yellow-400"
            />
            <button
              type="button"
              onClick={sendTest}
              disabled={sendingTest || !connected}
              className="inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
            >
              <Send size={18} className="mr-2" />
              {sendingTest ? 'Enviando...' : 'Enviar teste'}
            </button>
          </div>
        </div>
      </section>

      {/* Card de Templates */}
      <section className="rounded-xl border border-dark-700 bg-dark-900">
        <div className="flex items-center justify-between border-b border-dark-700 px-5 py-4">
          <div>
            <h2 className="font-semibold text-white">Templates de mensagem</h2>
            <p className="mt-0.5 text-xs text-gray-500">{templates.length} template{templates.length !== 1 ? 's' : ''} configurado{templates.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            to={`${basePath}/admin/whatsapp/templates`}
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-white"
          >
            Editar templates
          </Link>
        </div>
        <div className="divide-y divide-dark-700">
          {templates.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Nenhum template configurado.</p>
          ) : templates.slice(0, 5).map((template) => (
            <div key={template.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{template.title || template.template_key}</p>
                <p className="truncate text-xs text-gray-500">{template.template_key}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${template.enabled !== false ? 'bg-green-900/40 text-green-300' : 'bg-dark-700 text-gray-400'}`}>
                {template.enabled !== false ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}

export default Whatsapp
