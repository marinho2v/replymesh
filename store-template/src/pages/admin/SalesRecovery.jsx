import { useEffect, useMemo, useState } from 'react'
import { Bot, Clock, Gift, MessageCircle, Play, RefreshCw, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import {
  formatMoney,
  getSalesRecoveryAutomation,
  runSalesRecoveryEngine,
  simulateSalesRecoveryEngine,
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
  cooldown_hours: 24,
  recent_response_minutes: 30,
  min_cart_total_cents: 0,
  quiet_hours_enabled: true,
  quiet_window_start: '22:00',
  quiet_window_end: '08:00',
  coupon_rules_json: {
    high_cart_threshold_cents: 10000,
    high_cart_discount_percent: 15,
    low_cart_discount_percent: 5,
    first_order_discount_percent: 10,
    recurring_free_delivery: false,
  },
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
  const [simulation, setSimulation] = useState(null)
  const [simulating, setSimulating] = useState(false)

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

  const simulateEngine = async () => {
    try {
      setSimulating(true)
      const payload = await simulateSalesRecoveryEngine()
      setSimulation(payload.preview || null)
      if (payload.status === 'no_cart') {
        toast.info('Nenhum carrinho elegivel para simular agora')
      } else {
        toast.success('Simulacao gerada sem enviar mensagem')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSimulating(false)
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
        <Button variant="secondary" onClick={simulateEngine} disabled={simulating}><Sparkles size={16} className="mr-2" />{simulating ? 'Simulando...' : 'Simular Recovery'}</Button>
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
      <Metric icon={TrendingUp} label="Valor perdido" value={formatMoney(metrics.lost_value_cents || 0)} />
      <Metric icon={MessageCircle} label="Mensagens enviadas" value={metrics.messages_sent || 0} />
      <Metric icon={ShieldCheck} label="Taxa recuperacao" value={`${metrics.recovery_rate_percent || 0}%`} />
      <Metric icon={Gift} label="Cupons usados" value={metrics.coupons_used || 0} />
      <Metric icon={Gift} label="Frete gratis usado" value={metrics.free_delivery_used || 0} />
      <Metric icon={ShieldCheck} label="Mensagens bloqueadas" value={metrics.blocked_messages || 0} />
      <Metric icon={Sparkles} label="Score medio" value={metrics.average_recovery_score || 0} />
      <Metric icon={Users} label="Customer Value medio" value={metrics.average_customer_value_score || 0} />
      <Metric icon={Users} label="Clientes recuperados" value={metrics.customers_recovered || 0} />
      <Metric icon={Clock} label="Tempo medio ate compra" value={`${metrics.average_conversion_minutes || 0} min`} />
      <Metric icon={ShieldCheck} label="Clientes pausados" value={metrics.paused_customers || 0} />
      <Metric icon={Gift} label="Cupom mais usado" value={metrics.top_coupon?.code || '-'} />
      <Metric icon={TrendingUp} label="Ticket recuperado medio" value={formatMoney(metrics.average_recovered_value_cents || 0)} />
      <Metric icon={Sparkles} label="Carrinhos elegiveis" value={metrics.eligible_carts || 0} />
      <Metric icon={ShieldCheck} label="Carrinhos bloqueados" value={metrics.blocked_carts || 0} />
      <Metric icon={TrendingUp} label="Potencial recuperavel" value={formatMoney(metrics.potential_recoverable_cents || 0)} />
      <Metric icon={Clock} label="Horario com mais abandono" value={metrics.top_abandonment_hour ? `${String(metrics.top_abandonment_hour.hour).padStart(2, '0')}h` : '-'} />
      <Metric icon={Gift} label="Categoria abandonada" value={metrics.top_abandoned_category?.name || '-'} />
      <Metric icon={ShieldCheck} label="Motivo mais comum" value={blockReasonLabel(metrics.top_abandonment_reason?.reason)} />
    </div>

    {simulation && <Card className="border-primary-500/30">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-400">Simulacao sem envio</p>
          <h3 className="mt-2 text-2xl font-black text-white">Score {simulation.recovery_score} - {simulation.recovery_classification}</h3>
          <p className="mt-1 text-sm text-gray-400">{simulation.recovery_chance} para {simulation.customer}</p>
          <div className="mt-4 grid gap-2 text-sm">
            <span className="rounded-xl border border-dark-700 bg-dark-900 p-3 text-gray-200">Carrinho: {formatMoney(simulation.cart_total_cents || 0)}</span>
            <span className="rounded-xl border border-dark-700 bg-dark-900 p-3 text-gray-200">Beneficio: {benefitLabel(simulation.benefit_decision)}</span>
            <span className="rounded-xl border border-dark-700 bg-dark-900 p-3 text-gray-200">Cupom: {simulation.coupon_suggested?.code || 'sem cupom'}</span>
            <span className={`rounded-xl border p-3 ${simulation.auto_sendable ? 'border-green-500/30 bg-green-500/10 text-green-200' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'}`}>
              {simulation.auto_sendable ? 'Pode enviar automaticamente' : `Nao envia automatico: ${blockReasonLabel(simulation.block_reason || 'low_recovery_score')}`}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-black text-white">Motivos do score</p>
            <div className="grid gap-2 md:grid-cols-2">
              {(simulation.score_reasons || []).map((reason) => <span key={reason} className="rounded-xl border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-gray-200">✓ {reason}</span>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-black text-white">Mensagem sugerida</p>
            <pre className="whitespace-pre-wrap rounded-2xl border border-dark-700 bg-dark-950 p-4 text-sm text-gray-200">{simulation.message_suggested}</pre>
          </div>
        </div>
      </CardContent>
    </Card>}

    <Card className="border-primary-500/20 bg-dark-950/70">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-400">Recovery Insights</p>
            <h3 className="mt-1 text-2xl font-black text-white">Aprendizado automatico de recuperacao</h3>
            <p className="text-sm text-gray-400">A Replymesh compara mensagens, horarios, cupons e categorias que mais viram pedido nesta empresa.</p>
          </div>
          <span className="rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-black text-primary-300">
            Taxa geral {metrics.learning?.overall_rate_percent || 0}%
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Insight label="Melhor estrategia" value={metrics.learning?.best_strategy?.label || '-'} helper={metrics.learning?.best_strategy?.insight} />
          <Insight label="Melhor horario" value={metrics.learning?.best_hour?.label || '-'} helper={`${metrics.learning?.best_hour?.rate_percent || 0}% de conversao`} />
          <Insight label="Melhor dia" value={metrics.learning?.best_day?.label || '-'} helper={`${metrics.learning?.best_day?.rate_percent || 0}% de conversao`} />
          <Insight label="Cupom campeao" value={metrics.learning?.best_coupon?.label || '-'} helper={`${metrics.learning?.best_coupon?.recovered || 0} recuperados`} />
          <Insight label="IA converteu" value={`${metrics.learning?.ai_conversion_percent || 0}%`} helper="comparado aos recoveries com IA" />
          <Insight label="Template converteu" value={`${metrics.learning?.template_conversion_percent || 0}%`} helper="comparado aos templates prontos" />
          <Insight label="Categoria recuperada" value={metrics.learning?.top_recovered_category?.name || '-'} helper={`${metrics.learning?.top_recovered_category?.total || 0} recuperacoes`} />
          <Insight label="Tendencia" value={metrics.learning?.trend || 'Aguardando dados'} helper="ultimos 7 dias vs periodo anterior" />
        </div>
        <div className="rounded-2xl border border-dark-700 bg-dark-900 p-4">
          <p className="mb-3 text-sm font-black text-white">Top 5 estrategias</p>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {(metrics.learning?.top_strategies || []).map((item, index) => <div key={`${item.name}-${index}`} className="rounded-xl bg-dark-950 p-3">
              <p className="text-xs text-gray-500">{index + 1}. {item.label}</p>
              <p className="mt-1 text-lg font-black text-primary-300">{item.rate_percent}%</p>
              <p className="text-xs text-gray-500">{item.recovered}/{item.sent} recuperados</p>
            </div>)}
            {!(metrics.learning?.top_strategies || []).length && <p className="text-sm text-gray-500">Ainda sem dados suficientes.</p>}
          </div>
        </div>
      </CardContent>
    </Card>

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Cooldown por cliente (h)" type="number" min="1" max="168" value={settings.cooldown_hours} onChange={(e) => setField('cooldown_hours', Number(e.target.value))} />
        <Field label="Nao enviar se respondeu ha (min)" type="number" min="5" max="240" value={settings.recent_response_minutes} onChange={(e) => setField('recent_response_minutes', Number(e.target.value))} />
        <Field label="Valor minimo do carrinho (R$)" type="number" min="0" value={Math.round((settings.min_cart_total_cents || 0) / 100)} onChange={(e) => setField('min_cart_total_cents', Number(e.target.value) * 100)} />
        <ToggleCard title="Horario de silencio" description="Bloqueia envios fora de hora para reduzir risco de spam." checked={settings.quiet_hours_enabled} onChange={(value) => setField('quiet_hours_enabled', value)} icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Silencio inicia" type="time" value={settings.quiet_window_start} onChange={(e) => setField('quiet_window_start', e.target.value)} />
        <Field label="Silencio termina" type="time" value={settings.quiet_window_end} onChange={(e) => setField('quiet_window_end', e.target.value)} />
        <Field label="Desconto acima de R$100 (%)" type="number" min="1" max="30" value={settings.coupon_rules_json?.high_cart_discount_percent || 15} onChange={(e) => setField('coupon_rules_json', { ...(settings.coupon_rules_json || {}), high_cart_discount_percent: Number(e.target.value), high_cart_threshold_cents: settings.coupon_rules_json?.high_cart_threshold_cents || 10000 })} />
        <Field label="Desconto carrinho menor (%)" type="number" min="1" max="30" value={settings.coupon_rules_json?.low_cart_discount_percent || 5} onChange={(e) => setField('coupon_rules_json', { ...(settings.coupon_rules_json || {}), low_cart_discount_percent: Number(e.target.value) })} />
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

    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card><CardContent className="p-5">
        <h3 className="mb-4 text-lg font-black text-white">Logs de recuperacao</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400"><th>Cliente</th><th>Status</th><th>Score</th><th>Classe</th><th>Perfil</th><th>Beneficio</th><th>Total</th><th>Motivo</th><th>Data</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log.id} className="border-t border-dark-700 text-gray-200">
              <td className="py-3"><div className="font-bold">{log.customer || 'Cliente'}</div><div className="text-xs text-gray-500">{log.phone}</div></td>
              <td><span className="rounded-full bg-dark-800 px-2 py-1 text-xs">{statusLabel[log.status] || log.status}</span></td>
              <td><div className="font-bold text-primary-300">{log.recovery_score ?? '-'}</div><div className="text-xs text-gray-500">{log.recovery_chance || '-'}</div></td>
              <td><div className="font-bold text-white">{log.recovery_classification || '-'}</div><div className="max-w-xs truncate text-xs text-gray-500">{(log.score_reasons || []).join(' | ')}</div></td>
              <td><div>{segmentLabel(log.customer_segment)}</div><div className="text-xs text-gray-500">{log.customer_value_score ?? 0}</div></td>
              <td><div>{benefitLabel(log.benefit_decision)}</div><div className="text-xs text-gray-500">{log.coupon || '-'}</div></td>
              <td>{formatMoney(log.recovered_value_cents || log.cart_total_cents || 0)}</td>
              <td className="max-w-md truncate text-gray-400">{log.block_reason || log.benefit_reason || log.error || '-'}</td>
              <td>{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}</td>
            </tr>)}</tbody>
          </table>
          {!logs.length && <p className="py-8 text-center text-gray-400">{loading ? 'Carregando...' : 'Nenhum log de recuperacao ainda.'}</p>}
        </div>
      </CardContent></Card>
      <div className="space-y-4">
        <Card><CardContent className="p-5">
          <h3 className="mb-4 text-lg font-black text-white">Quase comprando</h3>
          <div className="space-y-3">
            {(metrics.ranking || []).map((item, index) => <div key={item.id} className="rounded-xl border border-dark-700 bg-dark-900 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-white">{index + 1}. {item.customer}</span>
                <span className="rounded-full bg-primary-500/15 px-2 py-1 text-xs font-black text-primary-300">Score {item.recovery_score} - {item.recovery_classification || item.recovery_chance}</span>
              </div>
              <div className="mt-2 grid gap-1 text-xs text-gray-400">
                <span>{item.recovery_chance} • {segmentLabel(item.customer_segment)} • {formatMoney(item.cart_total_cents || 0)}</span>
                <span>{benefitLabel(item.benefit_decision)} — {item.benefit_reason || 'sem decisao registrada'}</span>
              </div>
            </div>)}
            {!(metrics.ranking || []).length && <p className="text-sm text-gray-400">Sem carrinhos ranqueados ainda.</p>}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <h3 className="mb-4 text-lg font-black text-white">Insights automaticos</h3>
          <div className="space-y-3">
            {(metrics.insights || []).map((item, index) => <div key={item} className="rounded-xl border border-dark-700 bg-dark-900 p-3 text-sm text-gray-200">
              {index + 1}. {item}
            </div>)}
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

    <Card><CardContent className="p-5">
      <h3 className="mb-4 text-lg font-black text-white">Conversao por decisao</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <ConversionList title="Beneficio" rows={metrics.conversion_by_benefit || []} labelFn={benefitLabel} />
        <ConversionList title="Mensagem" rows={metrics.conversion_by_strategy || []} labelFn={(value) => value === 'ai' ? 'IA' : value === 'template' ? 'Template' : value} />
        <ConversionList title="Dia da semana" rows={metrics.conversion_by_weekday || []} labelFn={weekdayName} />
      </div>
    </CardContent></Card>

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

const Insight = ({ label, value, helper }) => <div className="rounded-2xl border border-dark-700 bg-dark-900 p-4">
  <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
  <p className="mt-1 text-lg font-black text-white">{value}</p>
  {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
</div>

const ConversionList = ({ title, rows, labelFn }) => <div className="rounded-2xl border border-dark-700 bg-dark-900 p-4">
  <p className="mb-3 text-sm font-black text-white">{title}</p>
  <div className="space-y-2">
    {rows.map((row) => <div key={`${title}-${row.name}`} className="flex items-center justify-between gap-3 text-sm">
      <span className="text-gray-300">{labelFn(row.name)}</span>
      <span className="font-bold text-primary-300">{row.rate}%</span>
    </div>)}
    {!rows.length && <p className="text-sm text-gray-500">Sem dados suficientes.</p>}
  </div>
</div>

const benefitLabel = (value) => ({
  none: 'Lembrete sem desconto',
  percentage: 'Cupom percentual',
  free_shipping: 'Frete gratis',
}[value] || value || '-')

const segmentLabel = (value) => ({
  vip: 'VIP',
  recurring: 'Recorrente',
  active: 'Ativo',
  new: 'Novo',
}[value] || 'Novo')

const weekdayName = (value) => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][Number(value)] || value

const blockReasonLabel = (value) => ({
  low_recovery_score: 'Score baixo',
  customer_paused: 'Cliente pausado',
  cart_below_minimum: 'Carrinho abaixo do minimo',
  outside_window: 'Fora da janela',
  quiet_hours: 'Horario de silencio',
  store_closed: 'Loja fechada',
  order_already_created: 'Pedido ja criado',
  recent_customer_reply: 'Cliente respondeu agora',
  active_conversation: 'Conversa ativa',
  cooldown_active: 'Cooldown ativo',
  daily_limit_reached: 'Limite diario',
  customer_limit_reached: 'Limite por cliente',
  empty_cart: 'Carrinho vazio',
  already_recovered: 'Ja recuperado',
}[value] || value || '-')
