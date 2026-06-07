import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle, Clock, LifeBuoy, MessageSquare, RefreshCw, Send, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { toast } from 'sonner'
import {
  createSupportTicket,
  getSupportTicket,
  getSupportTickets,
  replySupportTicket,
} from '../../services/supportTickets'

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const statusOptions = [
  { value: 'open', label: 'Aberto' },
  { value: 'pending', label: 'Em andamento' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'closed', label: 'Fechado' },
]

const statusLabels = {
  open: 'Aberto',
  pending: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

const priorityLabels = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
}

const statusVariant = {
  open: 'warning',
  pending: 'info',
  resolved: 'success',
  closed: 'default',
}

const priorityVariant = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
}

const priorityBorderColor = {
  low: 'border-l-gray-500',
  normal: 'border-l-blue-500',
  high: 'border-l-yellow-500',
  urgent: 'border-l-red-500',
}

const formatDate = (value) => value ? new Date(value).toLocaleString('pt-BR') : '-'
const formatDateShort = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins}min atrás`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h atrás`
  return d.toLocaleDateString('pt-BR')
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 rounded-xl bg-dark-800 border border-dark-600 p-4">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
      <Icon size={20} />
    </span>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
)

const MessageBubble = ({ message }) => {
  const isStaff = message.is_staff === true
    || message.sender_type === 'staff'
    || message.sender_role === 'admin'
    || message.role === 'admin'

  if (isStaff) {
    return (
      <div className="flex justify-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          S
        </div>
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-tl-sm bg-dark-700 border border-dark-500 px-4 py-3">
            <p className="whitespace-pre-wrap text-sm text-gray-100">{message.message}</p>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium text-blue-400">Suporte Replymesh</span>
            <span>·</span>
            <span>{formatDateShort(message.created_at)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-end gap-2">
      <div className="max-w-[75%]">
        <div className="rounded-2xl rounded-tr-sm bg-white/10 border border-white/15 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-gray-100">{message.message}</p>
        </div>
        <div className="mt-1 flex items-center justify-end gap-2 text-xs text-gray-500">
          <span>{formatDateShort(message.created_at)}</span>
          <span>·</span>
          <span className="font-medium text-gray-400">{message.user_name || message.user_email || 'Você'}</span>
        </div>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-600 text-xs font-bold text-white">
        V
      </div>
    </div>
  )
}

const Support = () => {
  const [tickets, setTickets] = useState([])
  const [form, setForm] = useState({ subject: '', priority: 'normal', message: '' })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [reply, setReply] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const messagesEndRef = useRef(null)

  const stats = useMemo(() => ({
    open: tickets.filter(ticket => ticket.status === 'open').length,
    pending: tickets.filter(ticket => ticket.status === 'pending').length,
    resolved: tickets.filter(ticket => ticket.status === 'resolved').length,
    closed: tickets.filter(ticket => ticket.status === 'closed').length,
  }), [tickets])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const data = await getSupportTickets({ status: statusFilter })
      setTickets(data)
      if (data.length) {
        const selected = selectedTicket
          ? data.find(ticket => String(ticket.id) === String(selectedTicket.id)) || data[0]
          : data[0]
        const full = await getSupportTicket(selected.id)
        setSelectedTicket(full)
      } else {
        setSelectedTicket(null)
      }
    } catch (error) {
      toast.error(error.message || 'Erro ao carregar tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedTicket?.messages?.length])

  const createTicket = async (event) => {
    event.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Informe assunto e mensagem')
      return
    }

    try {
      setActionLoading(true)
      const ticket = await createSupportTicket(form)
      setForm({ subject: '', priority: 'normal', message: '' })
      setShowNewTicketForm(false)
      setSelectedTicket(ticket)
      await loadTickets()
      toast.success('Ticket criado com sucesso')
    } catch (error) {
      toast.error(error.message || 'Erro ao criar ticket')
    } finally {
      setActionLoading(false)
    }
  }

  const selectTicket = async (ticket) => {
    try {
      const full = await getSupportTicket(ticket.id)
      setSelectedTicket(full)
    } catch (error) {
      toast.error(error.message || 'Erro ao abrir ticket')
    }
  }

  const sendReply = async () => {
    if (!reply.trim() || !selectedTicket?.id) return

    try {
      setActionLoading(true)
      await replySupportTicket(selectedTicket.id, reply)
      const full = await getSupportTicket(selectedTicket.id)
      setSelectedTicket(full)
      setReply('')
      await loadTickets()
      toast.success('Resposta enviada')
    } catch (error) {
      toast.error(error.message || 'Erro ao responder ticket')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      sendReply()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Suporte</h1>
          <p className="mt-0.5 text-sm text-gray-400">Abra tickets e acompanhe respostas da equipe Replymesh.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={loadTickets} loading={loading}>
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button type="button" onClick={() => setShowNewTicketForm(prev => !prev)}>
            <LifeBuoy size={16} className="mr-2" />
            Novo ticket
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={AlertTriangle} label="Abertos" value={stats.open} color="bg-yellow-500/15 text-yellow-400" />
        <StatCard icon={Clock} label="Em andamento" value={stats.pending} color="bg-blue-500/15 text-blue-400" />
        <StatCard icon={CheckCircle} label="Resolvidos" value={stats.resolved} color="bg-green-500/15 text-green-400" />
        <StatCard icon={XCircle} label="Fechados" value={stats.closed} color="bg-gray-500/15 text-gray-400" />
      </div>

      {showNewTicketForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LifeBuoy size={20} className="text-yellow-300" />
                <h2 className="text-lg font-bold text-white">Abrir novo ticket</h2>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewTicketForm(false)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTicket} className="grid gap-4 md:grid-cols-[1fr_200px]">
              <div className="space-y-4">
                <Input label="Assunto" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
                <Textarea label="Mensagem" rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
              </div>
              <div className="space-y-4">
                <Select label="Prioridade" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} options={priorityOptions} />
                <Button type="submit" loading={actionLoading} className="w-full">
                  <Send size={16} className="mr-2" />
                  Criar ticket
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
        <Card className="flex flex-col">
          <CardHeader className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={18} className="text-blue-300" />
              <h2 className="font-bold text-white">Meus tickets</h2>
            </div>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[{ value: '', label: 'Todos os status' }, ...statusOptions]}
            />
          </CardHeader>
          <CardContent className="flex-1 space-y-2 p-3 overflow-y-auto max-h-[60vh]">
            {loading && (
              <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Carregando...
              </div>
            )}
            {!loading && tickets.length === 0 && (
              <div className="rounded-xl border border-dashed border-dark-600 p-6 text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-400">Nenhum ticket encontrado.</p>
                <p className="mt-1 text-xs text-gray-500">Clique em "Novo ticket" para abrir um chamado.</p>
              </div>
            )}
            {!loading && tickets.map(ticket => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => selectTicket(ticket)}
                className={`w-full rounded-xl border-l-4 border border-dark-600 bg-dark-900 p-3 text-left transition-all hover:bg-dark-800 ${
                  priorityBorderColor[ticket.priority] || 'border-l-gray-500'
                } ${
                  String(selectedTicket?.id) === String(ticket.id)
                    ? 'ring-1 ring-white/20 bg-dark-700'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-white leading-snug">{ticket.subject}</p>
                  <Badge variant={statusVariant[ticket.status] || 'default'} className="shrink-0 text-[10px] px-1.5 py-0">
                    {statusLabels[ticket.status] || ticket.status}
                  </Badge>
                </div>
                {ticket.last_message && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">{ticket.last_message}</p>
                )}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-500">
                  <Badge variant={priorityVariant[ticket.priority] || 'default'} className="text-[10px] px-1.5 py-0">
                    {priorityLabels[ticket.priority] || ticket.priority}
                  </Badge>
                  <span>·</span>
                  <span>{formatDateShort(ticket.created_at)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col min-h-[500px]">
          {!selectedTicket ? (
            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
              <MessageSquare size={40} className="mb-3 text-gray-600" />
              <p className="text-sm font-medium text-gray-400">Selecione um ticket para ver a conversa</p>
            </div>
          ) : (
            <>
              <CardHeader className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-white">{selectedTicket.subject}</h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                      Aberto em {formatDate(selectedTicket.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusVariant[selectedTicket.status] || 'default'}>
                      {statusLabels[selectedTicket.status] || selectedTicket.status}
                    </Badge>
                    <Badge variant={priorityVariant[selectedTicket.priority] || 'default'}>
                      {priorityLabels[selectedTicket.priority] || selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
                <div className="flex-1 space-y-4 overflow-y-auto rounded-xl bg-dark-900 p-4 min-h-[280px] max-h-[420px]">
                  {(selectedTicket.messages || []).length === 0 && (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      Nenhuma mensagem ainda.
                    </div>
                  )}
                  {(selectedTicket.messages || []).map(message => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedTicket.status !== 'closed' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Digite sua resposta... (Ctrl+Enter para enviar)"
                      rows={3}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={handleReplyKeyDown}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Ctrl + Enter para enviar</p>
                      <Button
                        type="button"
                        onClick={sendReply}
                        loading={actionLoading}
                        disabled={!reply.trim()}
                      >
                        <Send size={16} className="mr-2" />
                        Responder
                      </Button>
                    </div>
                  </div>
                )}

                {selectedTicket.status === 'closed' && (
                  <div className="rounded-xl border border-dark-600 bg-dark-900 p-3 text-center text-sm text-gray-400">
                    Este ticket está fechado. Abra um novo ticket se precisar de mais ajuda.
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default Support
