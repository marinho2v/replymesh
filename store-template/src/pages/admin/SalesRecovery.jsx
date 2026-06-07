import { useEffect, useState } from 'react'
import { MessageCircle, RefreshCw, Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import {
  createMarketingCampaign,
  formatMoney,
  getSalesRecoveryCustomers,
  sendIndividualMarketingMessage,
} from '../../services/marketingWhatsapp'

const templates = {
  missing: 'Ola, {nome}! Sentimos sua falta. Que tal fazer um novo pedido hoje? {link_loja}',
  coupon: 'Ola, {nome}! Preparamos um cupom de retorno para voce: {cupom}. Aproveite em {link_loja}',
  free_shipping: 'Ola, {nome}! Hoje temos uma condicao especial de frete gratis. Confira: {link_loja}',
  special: 'Ola, {nome}! Tem promocao especial esperando por voce. Veja o cardapio: {link_loja}',
  vip: 'Ola, {nome}! Voce e cliente VIP e temos uma oferta especial para seu proximo pedido: {link_loja}',
}

export default function SalesRecovery() {
  const [days, setDays] = useState('30')
  const [customers, setCustomers] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [template, setTemplate] = useState('missing')
  const [message, setMessage] = useState(templates.missing)
  const load = async () => {
    try {
      setCustomers(await getSalesRecoveryCustomers(days))
      setSelected(new Set())
    } catch (error) { toast.error(error.message) }
  }
  useEffect(() => { load() }, [days])
  const allSelected = customers.length > 0 && selected.size === customers.length
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(customers.map((customer) => customer.id)))
  const toggle = (id) => setSelected((current) => {
    const next = new Set(current)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const chooseTemplate = (value) => {
    setTemplate(value)
    setMessage(templates[value])
  }
  const sendIndividual = async (customer) => {
    if (!confirm(`Enviar mensagem agora para ${customer.full_name}?`)) return
    try {
      const personalized = message
        .replaceAll('{nome}', customer.full_name)
        .replaceAll('{cupom}', '')
      await sendIndividualMarketingMessage(customer.phone, personalized)
      toast.success('Mensagem individual enviada e registrada')
    } catch (error) { toast.error(error.message) }
  }
  const createCampaign = async () => {
    if (!selected.size) return toast.error('Selecione pelo menos um cliente')
    if (!confirm(`Criar campanha para ${selected.size} cliente(s)? Nenhuma mensagem sera enviada automaticamente.`)) return
    try {
      await createMarketingCampaign({
        campaign: {
          title: `Recuperacao ${days} dias - ${new Date().toLocaleDateString('pt-BR')}`,
          message_template: message,
          pause_seconds: 45,
          daily_limit: 100,
        },
        customer_ids: [...selected],
      })
      toast.success('Campanha criada. Revise e envie pelo Marketing WhatsApp.')
    } catch (error) { toast.error(error.message) }
  }
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold text-white">Recuperador de Vendas</h1><p className="text-gray-400">Encontre clientes que pararam de comprar.</p></div>
    <Card><CardContent className="p-5">
      <div className="flex flex-wrap items-end gap-3 mb-5"><div className="w-64"><Select label="Periodo sem comprar" value={days} onChange={(e) => setDays(e.target.value)} options={[7,15,30,60,90].map((value) => ({ value: String(value), label: `${value} dias` }))} /></div><Button variant="secondary" onClick={load}><RefreshCw size={16} className="mr-2" />Atualizar</Button><Button variant="secondary" onClick={selectAll}><Users size={16} className="mr-2" />{allSelected ? 'Limpar selecao' : 'Selecionar todos filtrados'}</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-gray-400"><th></th><th>Cliente</th><th>Telefone</th><th>Ultimo pedido</th><th>Dias</th><th>Pedidos</th><th>Total</th><th>Ticket medio</th><th>Acao</th></tr></thead>
        <tbody>{customers.map((customer) => <tr key={customer.id} className="border-t border-dark-700 text-gray-200"><td className="py-3"><input type="checkbox" checked={selected.has(customer.id)} onChange={() => toggle(customer.id)} /></td><td>{customer.full_name}</td><td>{customer.phone}</td><td>{new Date(customer.last_order_at).toLocaleDateString('pt-BR')}</td><td>{customer.days_without_order}</td><td>{customer.total_orders}</td><td>{formatMoney(customer.total_spent_cents)}</td><td>{formatMoney(customer.average_ticket_cents)}</td><td><Button size="sm" variant="secondary" onClick={() => sendIndividual(customer)}><MessageCircle size={14} className="mr-1" />Enviar</Button></td></tr>)}</tbody>
      </table>{!customers.length && <p className="py-8 text-center text-gray-400">Nenhum cliente encontrado neste periodo.</p>}</div>
    </CardContent></Card>
    <Card><CardContent className="p-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <Select label="Template pronto" value={template} onChange={(event) => chooseTemplate(event.target.value)} options={[
          { value: 'missing', label: 'Sentimos sua falta' },
          { value: 'coupon', label: 'Cupom de retorno' },
          { value: 'free_shipping', label: 'Frete gratis' },
          { value: 'special', label: 'Promocao especial' },
          { value: 'vip', label: 'Cliente VIP' },
        ]} />
        <Textarea label="Mensagem" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-amber-300">A campanha sera criada como rascunho. O envio em massa exige confirmacao no Marketing WhatsApp.</p>
        <Button onClick={createCampaign}><Send size={16} className="mr-2" />Criar campanha ({selected.size})</Button>
      </div>
    </CardContent></Card>
  </div>
}
