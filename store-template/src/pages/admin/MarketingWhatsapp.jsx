import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle, RefreshCw, Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import {
  DEFAULT_MARKETING_MESSAGE, createMarketingCampaign, formatMoney,
  getMarketingCampaigns, getMarketingCustomers, sendIndividualMarketingMessage,
  sendMarketingCampaign,
} from '../../services/marketingWhatsapp'
import { getCoupons } from '../../services/coupons'

const filters = [
  { value: 'all', label: 'Todos' }, { value: 'recurring', label: 'Recorrentes' },
  { value: 'new', label: 'Novos' }, { value: 'inactive_30', label: 'Sem pedido ha 30 dias' },
  { value: 'inactive_60', label: 'Sem pedido ha 60 dias' }, { value: 'inactive_90', label: 'Sem pedido ha 90 dias' },
]

export default function MarketingWhatsapp() {
  const [customers, setCustomers] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [coupons, setCoupons] = useState([])
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [individual, setIndividual] = useState({ phone: '', message: '' })
  const [form, setForm] = useState({ title: '', coupon_code: '', message_template: DEFAULT_MARKETING_MESSAGE, pause_seconds: 45, daily_limit: 100 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [customerData, campaignData, couponData] = await Promise.all([
        getMarketingCustomers(filter),
        getMarketingCampaigns(),
        getCoupons(true),
      ])
      setCustomers(customerData)
      setCampaigns(campaignData)
      setCoupons(couponData)
      setSelected(new Set())
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])
  const allSelected = customers.length > 0 && selected.size === customers.length
  const selectedCustomers = useMemo(() => customers.filter((item) => selected.has(item.id)), [customers, selected])

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(customers.map((item) => item.id)))
  const toggle = (id) => setSelected((current) => {
    const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const selectCoupon = (couponCode) => {
    setForm((current) => {
      const previousCode = current.coupon_code.trim()
      let message = current.message_template

      if (previousCode) {
        message = message.replace(
          new RegExp(`^\\s*(?:Use o cupom:\\s*)?${previousCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gim'),
          couponCode ? `Use o cupom: ${couponCode}` : ''
        )
      } else if (couponCode) {
        message = message.replace(/\{cupom\}/gi, `Use o cupom: ${couponCode}`)
        if (!message.includes(couponCode)) {
          message = `${message.trim()}\n\nUse o cupom: ${couponCode}`
        }
      }

      return {
        ...current,
        coupon_code: couponCode,
        message_template: message.replace(/\n{3,}/g, '\n\n').trim(),
      }
    })
  }

  const couponOptions = useMemo(() => [
    { value: '', label: 'Sem cupom' },
    ...coupons.map((coupon) => ({
      value: coupon.code,
      label: `${coupon.code} - ${coupon.title || 'Cupom ativo'}`,
    })),
  ], [coupons])

  const createCampaign = async () => {
    if (!form.title.trim() || !form.message_template.trim() || !selected.size) return toast.error('Informe titulo, mensagem e publico')
    try {
      await createMarketingCampaign({ campaign: form, customer_ids: [...selected] })
      toast.success('Campanha criada. Nenhuma mensagem foi enviada ainda.')
      setForm((value) => ({ ...value, title: '' }))
      await load()
    } catch (error) { toast.error(error.message) }
  }

  const sendIndividual = async () => {
    if (!confirm('Enviar esta mensagem agora para apenas este telefone?')) return
    try {
      await sendIndividualMarketingMessage(individual.phone, individual.message)
      toast.success('Mensagem enviada e registrada')
      setIndividual({ phone: '', message: '' })
    } catch (error) { toast.error(error.message) }
  }

  const sendCampaign = async (campaign) => {
    if (!confirm(`Enviar a campanha "${campaign.title}" para ate ${campaign.daily_limit} destinatarios?`)) return
    try { await sendMarketingCampaign(campaign.id); toast.success('Processamento concluido'); await load() }
    catch (error) { toast.error(error.message) }
  }

  return <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-3xl font-bold text-white">Marketing WhatsApp</h1><p className="text-gray-400">Clientes reais da empresa atual, com envio controlado.</p></div>
      <Button variant="secondary" onClick={load}><RefreshCw size={16} className="mr-2" />Atualizar</Button>
    </div>

    <Card><CardContent className="p-5 space-y-4">
      <h2 className="text-white font-semibold flex items-center gap-2"><MessageCircle size={18} />Enviar mensagem individual</h2>
      <div className="grid md:grid-cols-[240px_1fr_auto] gap-3 items-end">
        <Input label="Telefone" value={individual.phone} onChange={(e) => setIndividual({ ...individual, phone: e.target.value })} />
        <Textarea label="Mensagem" rows={3} value={individual.message} onChange={(e) => setIndividual({ ...individual, message: e.target.value })} />
        <Button onClick={sendIndividual}><Send size={16} className="mr-2" />Enviar agora</Button>
      </div>
    </CardContent></Card>

    <Card><CardContent className="p-5 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-64"><Select label="Publico" value={filter} onChange={(e) => setFilter(e.target.value)} options={filters} /></div>
        <Button variant="secondary" onClick={toggleAll}><Users size={16} className="mr-2" />{allSelected ? 'Limpar selecao' : 'Selecionar todos filtrados'}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="text-left text-gray-400"><th></th><th>Cliente</th><th>Telefone</th><th>Pedidos</th><th>Total gasto</th><th>Ultimo pedido</th><th>Local</th></tr></thead>
          <tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-dark-700 text-gray-200">
            <td className="py-3"><input type="checkbox" checked={selected.has(customer.id)} onChange={() => toggle(customer.id)} /></td>
            <td>{customer.full_name}</td><td>{customer.phone}</td><td>{customer.total_orders}</td><td>{formatMoney(customer.total_spent_cents)}</td>
            <td>{customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString('pt-BR') : 'Sem pedido'}</td>
            <td>{[customer.neighborhood, customer.city].filter(Boolean).join(' / ') || '-'}</td>
          </tr>)}</tbody>
        </table>
        {!loading && !customers.length && <p className="py-8 text-center text-gray-400">Nenhum cliente elegivel neste filtro.</p>}
      </div>
    </CardContent></Card>

    <Card><CardContent className="p-5 space-y-4">
      <h2 className="font-semibold text-white">Nova campanha ({selectedCustomers.length} selecionados)</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Select
          label="Cupom opcional"
          value={form.coupon_code}
          onChange={(event) => selectCoupon(event.target.value)}
          options={couponOptions}
        />
        <Input label="Pausa entre envios (segundos)" type="number" value={form.pause_seconds} onChange={(e) => setForm({ ...form, pause_seconds: e.target.value })} />
        <Input label="Limite diario" type="number" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} />
      </div>
      <Textarea label="Mensagem" rows={8} value={form.message_template} onChange={(e) => setForm({ ...form, message_template: e.target.value })} />
      <p className="text-xs text-amber-300">Use apenas contatos com autorizacao. A criacao nao envia mensagens automaticamente.</p>
      <Button onClick={createCampaign}>Criar campanha</Button>
    </CardContent></Card>

    <Card><CardContent className="p-5"><h2 className="font-semibold text-white mb-4">Campanhas</h2>
      <div className="space-y-3">{campaigns.map((campaign) => <div key={campaign.id} className="flex items-center justify-between border border-dark-700 rounded-lg p-3">
        <div><strong className="text-white">{campaign.title}</strong><p className="text-xs text-gray-400">{campaign.total_recipients} destinatarios · {campaign.status}</p></div>
        <Button size="sm" disabled={campaign.status === 'completed'} onClick={() => sendCampaign(campaign)}>Enviar com confirmacao</Button>
      </div>)}</div>
    </CardContent></Card>
  </div>
}
