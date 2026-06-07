import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { StatCard } from "../../components/shared/StatCard.jsx";
import { api } from "../../services/api.js";

const STATUS = {
  success: ["green", "Sucesso"],
  denied: ["red", "Negado"],
  failed: ["red", "Falhou"],
};

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value))
  : "-";

const humanize = (value) => String(value || "")
  .replaceAll(".", " ")
  .replaceAll("_", " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

export function MasterAuditLogs({ onToast }) {
  const [logs, setLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [available, setAvailable] = useState({ actions: [], modules: [], users: [] });
  const [metrics, setMetrics] = useState({});
  const [filters, setFilters] = useState({
    user_id: "", company_id: "", log_action: "", module_name: "",
    status: "", date_from: "", date_to: "",
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const [auditData, companiesData] = await Promise.all([
        api.getMasterAuditLogs({ ...params, limit: 300 }),
        api.getCompanies(),
      ]);
      setLogs(auditData.audit_logs || []);
      setMetrics(auditData.metrics || {});
      setAvailable(auditData.filters || { actions: [], modules: [], users: [] });
      setCompanies(companiesData.companies || []);
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setLoading(false);
    }
  }, [filters, onToast]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="pt">Auditoria Master</div>
          <div className="ps">Rastreabilidade das acoes administrativas e acessos de suporte.</div>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <Icon name="RefreshCw" size={16} /> Atualizar
        </button>
      </div>

      <div className="stat-grid">
        <StatCard icon="ShieldCheck" label="Registros" value={String(metrics.total_count || 0)} delta={`${metrics.today_count || 0} hoje`} dir="flat" />
        <StatCard icon="LogIn" label="Acessos de suporte" value={String(metrics.impersonation_count || 0)} delta="entradas e saidas" dir="flat" />
        <StatCard icon="ShieldAlert" label="Acessos negados" value={String(metrics.denied_count || 0)} delta="tentativas bloqueadas" dir={metrics.denied_count ? "down" : "flat"} />
      </div>

      <div className="card card-pad">
        <div className="form-grid audit-master-filters">
          <div className="field"><label>Usuario</label><select value={filters.user_id} onChange={(event) => updateFilter("user_id", event.target.value)}><option value="">Todos</option>{available.users.map(([id, name, email]) => <option key={id} value={id}>{name} - {email}</option>)}</select></div>
          <div className="field"><label>Empresa</label><select value={filters.company_id} onChange={(event) => updateFilter("company_id", event.target.value)}><option value="">Todas</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>
          <div className="field"><label>Acao</label><select value={filters.log_action} onChange={(event) => updateFilter("log_action", event.target.value)}><option value="">Todas</option>{available.actions.map((action) => <option key={action} value={action}>{humanize(action)}</option>)}</select></div>
          <div className="field"><label>Modulo</label><select value={filters.module_name} onChange={(event) => updateFilter("module_name", event.target.value)}><option value="">Todos</option>{available.modules.map((moduleName) => <option key={moduleName} value={moduleName}>{humanize(moduleName)}</option>)}</select></div>
          <div className="field"><label>Status</label><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="">Todos</option><option value="success">Sucesso</option><option value="denied">Negado</option><option value="failed">Falhou</option></select></div>
          <div className="field"><label>Data inicial</label><input type="date" value={filters.date_from} onChange={(event) => updateFilter("date_from", event.target.value)} /></div>
          <div className="field"><label>Data final</label><input type="date" value={filters.date_to} onChange={(event) => updateFilter("date_to", event.target.value)} /></div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Data/hora</th><th>Usuario master</th><th>Acao</th><th>Empresa</th><th>Modulo</th><th>IP</th><th>Status</th><th /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8">Carregando auditoria...</td></tr> : logs.length ? logs.map((log) => {
                const badge = STATUS[log.status] || STATUS.success;
                return <tr key={log.id}>
                  <td>{formatDate(log.created_at)}</td>
                  <td><strong>{log.actor?.name || "-"}</strong><div className="muted">{log.actor?.email || "-"}</div></td>
                  <td><strong>{humanize(log.action)}</strong><div className="muted mono">{log.action}</div></td>
                  <td>{log.company?.name || "Global"}</td>
                  <td>{humanize(log.module_name)}</td>
                  <td className="mono">{log.ip_address || "-"}</td>
                  <td><Badge tone={badge[0]}>{badge[1]}</Badge></td>
                  <td><button className="ra" title="Ver detalhes" onClick={() => setSelected(log)}><Icon name="Eye" size={16} /></button></td>
                </tr>;
              }) : <tr><td colSpan="8">Nenhum registro encontrado para os filtros selecionados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}>
        <div className="modal audit-modal" onClick={(event) => event.stopPropagation()}>
          <div className="card-head"><div className="ct">Detalhes da auditoria</div><div className="grow" /><button className="icon-btn" onClick={() => setSelected(null)}><Icon name="X" size={18} /></button></div>
          <div className="audit-detail-list">
            <div><span>Usuario</span><strong>{selected.actor?.name || "-"}</strong></div>
            <div><span>Empresa</span><strong>{selected.company?.name || "Global"}</strong></div>
            <div><span>Acao</span><strong>{selected.action}</strong></div>
            <div><span>Modulo</span><strong>{selected.module_name}</strong></div>
            <div><span>IP</span><strong>{selected.ip_address || "-"}</strong></div>
            <div><span>Navegador</span><strong>{selected.user_agent || "-"}</strong></div>
            <div><span>Data</span><strong>{formatDate(selected.created_at)}</strong></div>
          </div>
          <pre>{JSON.stringify(selected.metadata || {}, null, 2)}</pre>
        </div>
      </div>}
    </div>
  );
}
