import { useEffect, useMemo, useState } from 'react'
import { Bot, Gift, MessageCircle, Play, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import {
  formatMoney,
  getSalesRecoveryAutomation,
  runSalesRecoveryEngine,
  updateSalesRecoverySettings,
} from '../../services/marketingWhatsapp'

const defaultSettings = {
  enabled: false,
  delay_minutes: 60,
  daily_limit: 20,
  window_start: '08:00',
  window_end: '21:00',
  allowed_weekdays: [1, 2, 3, 4, 5, 6, 0],
  use_ai: true,
  auto_coupon: true,
  default_discount_percent: 10,
  free_delivery: false,
  coupon_validity_hours: 48,
  per_customer_daily_limit: 1,
  queue_spacing_minutes: 3,
  message_template: '',
}

const weekdays = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' },
]

const statusLabel = {
  queued: 'Na fila',
  sent: 'Enviada',
  failed: 'Falhou',
  recovered: 'Recuperado',
  ignored: 'Ignorado',
  skipped: 'Ignorado',
}

export default function SalesRecovery() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(defaultSettings)
  const [metrics, setMetrics] = useState({})
  const [logs, setLogs] = useState([])

  const loadAutomation = async () => {
    try {
      setLoading(true)
      const payload = await getSalesRecoveryAutomation()
      setSettings({ ...defaultSettings, ...(payload.settings || {}) })
      setMetrics(payload.metrics || {})
      setLogs(payload.logs || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAutomation() }, [])

  const headline = useMemo(() => (
    `Replymesh recuperou ${formatMoney(metrics.recovered_value_cents || 0)} em carrinhos`
  ), [metrics.recovered_value_cents])

  const setField = (field, value) => setSettings((current) => ({ ...current, [field]: value }))

  const toggleWeekday = (day) => {
    setSettings((current) => {
      const daysSet = new Set(current.allowed_weekdays || [])
      daysSet.has(day) ? daysSet.delete(day) : daysSet.add(day)
      return { ...current, allowed_weekdays: [...daysSet] }
    })
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const saved = await updateSalesRecoverySettings(settings)
      setSettings({ ...defaultSettings, ...saved })
      toast.success('Automacao salva com sucesso')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const runEngine = async () => {
    try {
      const payload = await runSalesRecoveryEngine()
      setMetrics(payload.metrics || metrics)
      toast.success(`Motor executado: ${payload.result?.stats?.sent || 0} mensagem(ns) enviadas`)
      await loadAutomation()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-400">Marketing & Automacao</p>
        <h1 className="mt-2 text-3xl font-black text-white">Automacao Inteligente</h1>
        <p className="text-gray-400">Recupere carrinhos abandonados com IA, cupons e WhatsApp sem envio em massa.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={loadAutomation}><RefreshCw size={16} className="mr-2" />Atualizar</Button>
        <Button variant="secondary" onClick={runEngine}><Play size={16} className="mr-2" />Executar teste seguro</Button>
        <Button onClick={saveSettings} disabled={saving}>{saving ? 'Salvando...' : 'Salvar automacao'}</Button>
      </div>
    </div>

    <Card className="border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-dark-900">
      <CardContent className="grid gap-4 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary-500 p-3 text-dark-950"><Sparkles size={22} /></span>
            <div>
              <h2 className="text-2xl font-black text-white">{headline}</h2>
              <p className="text-sm text-gray-300">A engine trabalha com limites, janela de horario e isolamento por empresa.</p>
            </div>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dark-700 bg-dark-950/70 px-4 py-3 text-white">
          <input type="checkbox" checked={settings.enabled} onChange={(event) => setField('enabled', event.target.checked)} />
          <span className="font-bold">{settings.enabled ? 'Recuperador ativo' : 'Recuperador pausado'}</span>
        </label>
      </CardContent>
    </Card>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <Metric icon={TrendingUp} label="Hoje recuperados" value={metrics.today_recovered || 0} />
      <Metric icon={Users} label="Carrinhos recuperados" value={metrics.recovered_carts || 0} />
      <Metric icon={Gift} label="Valor recuperado" value={formatMoney(metrics.recovered_value_cents || 0)} />
      <Metric icon={MessageCircle} label="Mensagens enviadas" value={metrics.messages_sent || 0} />
      <Metric icon={ShieldCheck} label="Taxa recuperacao" value={`${metrics.recovery_rate_percent || 0}%`} />
      <Metric icon={Gift} label="Cupons usados" value={metrics.coupons_used || 0} />
    </div>

    <Card><CardContent className="space-y-6 p-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <ToggleCard title="Usar IA nas mensagens" description="Gera textos naturais com contexto do carrinho." checked={settings.use_ai} onChange={(value) => setField('use_ai', value)} icon={Bot} />
        <ToggleCard title="Gerar cupom automatico" description="Cria cupom unico para cada recuperacao." checked={settings.auto_coupon} onChange={(value) => setField('auto_coupon', value)} icon={Gift} />
        <ToggleCard title="Frete gratis como beneficio" description="Troca desconto percentual por frete gratis." checked={settings.free_delivery} onChange={(value) => setField('free_delivery', value)} icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select label="Tempo sem finalizar" value={String(settings.delay_minutes)} onChange={(e) => setField('delay_minutes', Number(e.target.value))} options={[
          { value: '30', label: '30 minutos' }, { value: '60', label: '1 hora' }, { value: '120', label: '2 horas' },
          { value: '240', label: '4 horas' }, { value: '720', label: '12 horas' }, { value: '1440', label: '24 horas' },
        ]} />
        <Select label="Limite diario" value={String(settings.daily_limit)} onChange={(e) => setField('daily_limit', Number(e.target.value))} options={[10, 20, 30, 50, 100].map((value) => ({ value: String(value), label: `${value} mensagens/dia` }))} />
        <Select label="Desconto padrao" value={String(settings.default_discount_percent)} onChange={(e) => setField('default_discount_percent', Number(e.target.value))} options={[5, 10, 15].map((value) => ({ value: String(value), label: `${value}%` }))} />
        <Select label="Cupom valido por" value={String(settings.coupon_validity_hours)} onChange={(e) => setField('coupon_validity_hours', Number(e.target.value))} options={[24, 48, 72].map((value) => ({ value: String(value), label: `${value} horas` }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Inicio da janela" type="time" value={settings.window_start} onChange={(e) => setField('window_start', e.target.value)} />
        <Field label="Fim da janela" type="time" value={settings.window_end} onChange={(e) => setField('window_end', e.target.value)} />
        <Field label="Limite por cliente/dia" type="number" min="1" max="5" value={settings.per_customer_daily_limit} onChange={(e) => setField('per_customer_daily_limit', Number(e.target.value))} />
        <Field label="Intervalo da fila (min)" type="number" min="1" max="30" value={settings.queue_spacing_minutes} onChange={(e) => setField('queue_spacing_minutes', Number(e.target.value))} />
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-white">Dias permitidos</p>
        <div className="flex flex-wrap gap-2">
          {weekdays.map((day) => {
            const active = (settings.allowed_weekdays || []).includes(day.value)
            return <button key={day.value} type="button" onClick={() => toggleWeekday(day.value)} className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${active ? 'border-primary-500 bg-primary-500 text-dark-950' : 'border-dark-700 bg-dark-900 text-gray-300'}`}>{day.label}</button>
          })}
        </div>
      </div>

      <Textarea label="Mensagem personalizada opcional" rows={4} value={settings.message_template || ''} onChange={(e) => setField('message_template', e.target.value)} placeholder="Use {nome}, {loja}, {itens}, {beneficio}, {cupom}, {link_loja}. Se vazio, a Replymesh gera ou escolhe a mensagem automaticamente." />
    </CardContent></Card>

    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <Card><CardContent className="p-5">
        <h3 className="mb-4 text-lg font-black text-white">Logs de recuperacao</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400"><th>Cliente</th><th>Status</th><th>Cupom</th><th>Total</th><th>Mensagem</th><th>Data</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log.id} className="border-t border-dark-700 text-gray-200">
              <td className="py-3"><div className="font-bold">{log.customer || 'Cliente'}</div><div className="text-xs text-gray-500">{log.phone}</div></td>
              <td><span className="rounded-full bg-dark-800 px-2 py-1 text-xs">{statusLabel[log.status] || log.status}</span></td>
              <td>{log.coupon || '-'}</td>
              <td>{formatMoney(log.recovered_value_cents || log.cart_total_cents || 0)}</td>
              <td className="max-w-md truncate text-gray-400">{log.error || log.message || '-'}</td>
              <td>{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}</td>
            </tr>)}</tbody>
          </table>
          {!logs.length && <p className="py-8 text-center text-gray-400">{loading ? 'Carregando...' : 'Nenhum log de recuperacao ainda.'}</p>}
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-5">
        <h3 className="mb-4 text-lg font-black text-white">Produtos mais recuperados</h3>
        <div className="space-y-3">
          {(metrics.top_products || []).map((item, index) => <div key={item.name} className="flex items-center justify-between rounded-xl border border-dark-700 bg-dark-900 p-3">
            <span className="text-sm text-white">{index + 1}. {item.name}</span>
            <span className="text-xs font-bold text-primary-300">{item.count}x</span>
          </div>)}
          {!(metrics.top_products || []).length && <p className="text-sm text-gray-400">Sem dados suficientes ainda.</p>}
        </div>
      </CardContent></Card>
    </div>

  </div>
}

const Metric = ({ icon: Icon, label, value }) => <Card><CardContent className="p-4">
  <Icon size={20} className="mb-3 text-primary-400" />
  <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
  <p className="mt-1 text-2xl font-black text-white">{value}</p>
</CardContent></Card>

const ToggleCard = ({ icon: Icon, title, description, checked, onChange }) => <button type="button" onClick={() => onChange(!checked)} className={`rounded-2xl border p-4 text-left transition ${checked ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 bg-dark-900'}`}>
  <div className="flex items-start gap-3">
    <span className={`rounded-xl p-2 ${checked ? 'bg-primary-500 text-dark-950' : 'bg-dark-800 text-gray-400'}`}><Icon size={18} /></span>
    <span>
      <span className="block font-black text-white">{title}</span>
      <span className="mt-1 block text-sm text-gray-400">{description}</span>
    </span>
  </div>
</button>

const Field = ({ label, ...props }) => <label className="block">
  <span className="mb-2 block text-sm font-bold text-white">{label}</span>
  <input {...props} className="w-full rounded-xl border border-dark-700 bg-dark-950 px-4 py-3 text-white outline-none focus:border-primary-500" />
</label>
