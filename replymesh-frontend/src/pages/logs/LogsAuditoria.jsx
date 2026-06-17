import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardHead } from "../../components/shared/CardHead.jsx";
import { StatCard } from "../../components/shared/StatCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const TABS = [
  { path: "/logs", key: "", label: "Geral", icon: "ScrollText" },
  { path: "/logs/atividades", key: "atividades", label: "Atividades", icon: "Activity" },
  { path: "/logs/erros", key: "erros", label: "Erros", icon: "AlertTriangle" },
  { path: "/logs/webhooks", key: "webhooks", label: "Webhooks", icon: "Webhook" },
  { path: "/logs/evolution", key: "evolution", label: "WhatsApp", icon: "MessageCircle" },
  { path: "/logs/automacoes", key: "automacoes", label: "Automacoes", icon: "Bot" },
];

const LEVEL_BADGE = {
  critical: ["red", "Critico"],
  error: ["red", "Erro"],
  warning: ["amber", "Aviso"],
  info: ["blue", "Info"],
};

const STATUS_BADGE = {
  pending: ["amber", "Pendente"],
  resolved: ["green", "Resolvido"],
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function companyLabel(item) {
  return item.company?.name || "Global";
}

export function LogsAuditoria({ onToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activityMetrics, setActivityMetrics] = useState({});
  const [alertMetrics, setAlertMetrics] = useState({});
  const [filters, setFilters] = useState({ company_id: "", status: "", date_from: "", date_to: "" });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");

  const tab = useMemo(() => TABS.find((item) => item.path === location.pathname) || TABS[0], [location.pathname]);
  const isErrorTab = tab.key === "erros";

  const loadData = useCallback(async () => {
    setError("");
    const params = {
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      ...(tab.key ? { type: tab.key } : {}),
      limit: 150,
    };
    const alertParams = {
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      ...(isErrorTab ? { level: "error" } : {}),
      limit: 150,
    };

    const [logsData, alertsData, companiesData] = await Promise.all([
      api.getActivityLogs(params),
      api.getSystemAlerts(alertParams),
      api.getCompanies(),
    ]);

    setActivityLogs(logsData.activity_logs || []);
    setActivityMetrics(logsData.metrics || {});
    setAlerts(alertsData.system_alerts || []);
    setAlertMetrics(alertsData.metrics || {});
    setCompanies(companiesData.companies || []);
  }, [filters, isErrorTab, tab.key]);

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      loadData()
        .catch((err) => {
          if (!active) return;
          setError(err.message);
          onToast?.(err.message, "err");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadData, onToast]);

  const applyFilters = async () => {
    setLoading(true);
    try {
      await loadData();
    } catch (err) {
      setError(err.message);
      onToast?.(err.message, "err");
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alert) => {
    setActionId(alert.id);
    try {
      const data = await api.resolveSystemAlert(alert.id);
      setAlerts((current) => current.map((item) => (item.id === alert.id ? data.system_alert : item)));
      setAlertMetrics((current) => ({
        ...current,
        pending_count: Math.max(Number(current.pending_count || 1) - 1, 0),
        resolved_count: Number(current.resolved_count || 0) + 1,
      }));
      onToast?.("Alerta resolvido", "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setActionId(null);
    }
  };

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Logs, Alertas e Auditoria</h1>
          <p className="ps">Eventos master, incidentes e rastreabilidade operacional.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon="ScrollText" label="Logs totais" value={String(activityMetrics.total_count || 0)} delta={`${activityMetrics.today_count || 0} hoje`} dir="flat" />
        <StatCard icon="MessageCircle" label="WhatsApp" value={String(activityMetrics.evolution_count || 0)} delta="eventos auditados" dir="flat" />
        <StatCard icon="AlertTriangle" label="Pendentes" value={String(alertMetrics.pending_count || 0)} delta="alertas abertos" dir={alertMetrics.pending_count ? "down" : "flat"} />
        <StatCard icon="ShieldAlert" label="Criticos" value={String(alertMetrics.critical_count || 0)} delta={`${alertMetrics.error_count || 0} erros`} dir={alertMetrics.critical_count ? "down" : "flat"} />
        <StatCard icon="CheckCircle2" label="Resolvidos" value={String(alertMetrics.resolved_count || 0)} delta="historico" dir="flat" />
      </div>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((item) => (
            <button key={item.path} className={`tab ${tab.path === item.path ? "active" : ""}`} onClick={() => navigate(item.path)}>
              <Icon name={item.icon} size={14} />
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
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Status do alerta</label>
              <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
                <option value="">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="resolved">Resolvidos</option>
              </select>
            </div>
            <div className="field">
              <label>Data inicial</label>
              <input type="date" value={filters.date_from} onChange={(event) => setFilter("date_from", event.target.value)} />
            </div>
            <div className="field">
              <label>Data final</label>
              <input type="date" value={filters.date_to} onChange={(event) => setFilter("date_to", event.target.value)} />
            </div>
            <div className="field audit-filter-action">
              <label>&nbsp;</label>
              <button className="btn btn-primary" onClick={applyFilters} disabled={loading}>
                <Icon name="Filter" size={16} />
                Filtrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="card">
          <div className="empty">
            <div className="ei"><Icon name="AlertTriangle" size={22} /></div>
            <div className="et">Erro ao carregar logs</div>
            <div className="es">{error}</div>
          </div>
        </div>
      )}

      <div className="grid-2 audit-grid">
        <div className="card">
          <CardHead title="Atividades" />
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Empresa</th>
                  <th>Usuario</th>
                  <th>Recurso</th>
                  <th>Data</th>
                  <th style={{ textAlign: "right" }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Carregando...</td></tr>
                ) : activityLogs.length ? activityLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <strong>{log.action_label}</strong>
                      <div className="muted mono">{log.action}</div>
                    </td>
                    <td>{companyLabel(log)}</td>
                    <td>{log.user?.name || "-"}</td>
                    <td className="mono">{log.resource_type || "-"} #{log.resource_id || "-"}</td>
                    <td>{formatDate(log.created_at)}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="ra" onClick={() => setSelected({ title: log.action_label, data: log })} title="Detalhes">
                          <Icon name="Eye" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6">Nenhum log encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <CardHead title="Alertas" />
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Alerta</th>
                  <th>Nivel</th>
                  <th>Status</th>
                  <th>Empresa</th>
                  <th>Data</th>
                  <th style={{ textAlign: "right" }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Carregando...</td></tr>
                ) : alerts.length ? alerts.map((alert) => {
                  const level = LEVEL_BADGE[alert.level] || LEVEL_BADGE.info;
                  const status = STATUS_BADGE[alert.status] || STATUS_BADGE.pending;
                  return (
                    <tr key={alert.id}>
                      <td>
                        <strong>{alert.title}</strong>
                        <div className="muted">{alert.message}</div>
                      </td>
                      <td><Badge tone={level[0]}>{level[1]}</Badge></td>
                      <td><Badge tone={status[0]}>{status[1]}</Badge></td>
                      <td>{companyLabel(alert)}</td>
                      <td>{formatDate(alert.created_at)}</td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <button className="ra" onClick={() => setSelected({ title: alert.title, data: alert })} title="Detalhes">
                            <Icon name="Eye" size={16} />
                          </button>
                          {alert.status !== "resolved" && (
                            <button className="ra" disabled={actionId === alert.id} onClick={() => resolveAlert(alert)} title="Resolver">
                              <Icon name="Check" size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6">Nenhum alerta encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal audit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="card-head">
              <div className="ct">{selected.title}</div>
              <div className="grow" />
              <button className="icon-btn" onClick={() => setSelected(null)}><Icon name="X" size={18} /></button>
            </div>
            <pre>{JSON.stringify(selected.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
