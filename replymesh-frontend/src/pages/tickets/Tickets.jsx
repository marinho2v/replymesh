import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardHead } from "../../components/shared/CardHead.jsx";
import { StatCard } from "../../components/shared/StatCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const TABS = [
  { path: "/tickets", key: "", label: "Todos" },
  { path: "/tickets/abertos", key: "open", label: "Abertos" },
  { path: "/tickets/andamento", key: "pending", label: "Em andamento" },
  { path: "/tickets/resolvidos", key: "resolved", label: "Resolvidos" },
]

const STATUS = {
  open: ["amber", "Aberto"],
  pending: ["blue", "Em andamento"],
  resolved: ["green", "Resolvido"],
  closed: ["gray", "Fechado"],
}

const PRIORITY = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
}

function formatDate(value) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}

export function Tickets({ onToast }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [companies, setCompanies] = useState([])
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState("")
  const [filters, setFilters] = useState({ company_id: "", priority: "", start_date: "", end_date: "" })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const tab = useMemo(() => TABS.find((item) => item.path === location.pathname) || TABS[0], [location.pathname])
  const stats = useMemo(() => ({
    open: tickets.filter((ticket) => ticket.status === "open").length,
    pending: tickets.filter((ticket) => ticket.status === "pending").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
    urgent: tickets.filter((ticket) => ticket.priority === "urgent").length,
  }), [tickets])

  const loadData = useCallback(async () => {
    setError("")
    setLoading(true)
    const params = {
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      ...(tab.key ? { status: tab.key } : {}),
      limit: 150,
    }
    const [ticketsData, companiesData] = await Promise.all([
      api.getTickets(params),
      api.getCompanies(),
    ])
    setTickets(ticketsData.tickets || [])
    setCompanies(companiesData.companies || [])
    if (!selected && ticketsData.tickets?.[0]) {
      const full = await api.getTicket(ticketsData.tickets[0].id)
      setSelected(full.ticket)
    }
  }, [filters, selected, tab.key])

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      loadData()
        .catch((err) => {
          if (!active) return
          setError(err.message)
          onToast?.(err.message, "err")
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [loadData, onToast])

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const openTicket = async (ticket) => {
    try {
      const data = await api.getTicket(ticket.id)
      setSelected(data.ticket)
    } catch (err) {
      onToast?.(err.message, "err")
    }
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected?.id) return
    setActionLoading(true)
    try {
      await api.replyTicket(selected.id, { message: reply, internal: false })
      const data = await api.getTicket(selected.id)
      setSelected(data.ticket)
      setReply("")
      onToast?.("Resposta enviada", "ok")
      await loadData()
    } catch (err) {
      onToast?.(err.message, "err")
    } finally {
      setActionLoading(false)
    }
  }

  const updateStatus = async (status) => {
    if (!selected?.id) return
    setActionLoading(true)
    try {
      const data = await api.updateTicketStatus(selected.id, status)
      setSelected(data.ticket)
      onToast?.("Status atualizado", "ok")
      await loadData()
    } catch (err) {
      onToast?.(err.message, "err")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Tickets</h1>
          <p className="ps">Atendimento das empresas, respostas e acompanhamento de pendencias.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="LifeBuoy" label="Abertos" value={String(stats.open)} delta="aguardando triagem" dir={stats.open ? "down" : "flat"} />
        <StatCard icon="MessagesSquare" label="Em andamento" value={String(stats.pending)} delta="em atendimento" dir="flat" />
        <StatCard icon="CheckCircle2" label="Resolvidos" value={String(stats.resolved)} delta="historico" dir="flat" />
        <StatCard icon="ShieldAlert" label="Urgentes" value={String(stats.urgent)} delta="prioridade alta" dir={stats.urgent ? "down" : "flat"} />
      </div>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((item) => (
            <button key={item.path} className={`tab ${tab.path === item.path ? "active" : ""}`} onClick={() => navigate(item.path)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          <div className="form-grid audit-filter-grid">
            <div className="field">
              <label>Empresa</label>
              <select value={filters.company_id} onChange={(event) => setFilter("company_id", event.target.value)}>
                <option value="">Todas</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Prioridade</label>
              <select value={filters.priority} onChange={(event) => setFilter("priority", event.target.value)}>
                <option value="">Todas</option>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div className="field">
              <label>Data inicial</label>
              <input type="date" value={filters.start_date} onChange={(event) => setFilter("start_date", event.target.value)} />
            </div>
            <div className="field">
              <label>Data final</label>
              <input type="date" value={filters.end_date} onChange={(event) => setFilter("end_date", event.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="card"><div className="empty"><div className="et">Erro ao carregar tickets</div><div className="es">{error}</div></div></div>}

      <div className="grid-2 audit-grid">
        <div className="card">
          <CardHead title="Lista de tickets" />
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Empresa</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Atualizado</th>
                  <th style={{ textAlign: "right" }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Carregando...</td></tr>
                ) : tickets.length ? tickets.map((ticket) => {
                  const [variant, label] = STATUS[ticket.status] || ["gray", ticket.status]
                  return (
                    <tr key={ticket.id}>
                      <td><strong>{ticket.subject}</strong><div className="muted">{ticket.last_message || ticket.message}</div></td>
                      <td>{ticket.company_name || "-"}</td>
                      <td>{PRIORITY[ticket.priority] || ticket.priority}</td>
                      <td><Badge variant={variant}>{label}</Badge></td>
                      <td>{formatDate(ticket.updated_at)}</td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <button className="ra" onClick={() => openTicket(ticket)} title="Abrir ticket"><Icon name="Eye" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan="6">Nenhum ticket encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <CardHead title="Detalhe do ticket" />
          {!selected ? (
            <div className="empty">
              <div className="ei"><Icon name="LifeBuoy" size={22} /></div>
              <div className="et">Selecione um ticket</div>
              <div className="es">Abra um ticket da lista para responder ou alterar status.</div>
            </div>
          ) : (
            <div className="card-pad">
              <div className="detail-head">
                <div>
                  <h3>{selected.subject}</h3>
                  <p>{selected.company_name} · {PRIORITY[selected.priority] || selected.priority}</p>
                </div>
                <select value={selected.status} onChange={(event) => updateStatus(event.target.value)} disabled={actionLoading}>
                  <option value="open">Aberto</option>
                  <option value="pending">Em andamento</option>
                  <option value="resolved">Resolvido</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>
              <div className="ticket-thread">
                {(selected.messages || []).map((message) => (
                  <div key={message.id} className="ticket-message">
                    <div className="ticket-message-meta">
                      <span>{message.user_name || message.user_email || "Sistema"}</span>
                      <span>{formatDate(message.created_at)}</span>
                    </div>
                    <p>{message.message}</p>
                  </div>
                ))}
              </div>
              <div className="field">
                <label>Responder</label>
                <textarea rows="4" value={reply} onChange={(event) => setReply(event.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={sendReply} disabled={actionLoading || !reply.trim()}>
                <Icon name="Send" size={16} />
                Enviar resposta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
