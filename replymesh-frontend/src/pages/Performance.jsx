import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge.jsx";
import { Icon } from "../components/ui/Icon.jsx";
import { api } from "../services/api.js";

const EMPTY = "Indisponivel";
const SLOW_QUERY_PAGE_SIZE = 6;
const INDEX_PAGE_SIZE = 8;

const nf = new Intl.NumberFormat("pt-BR");
const dtf = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const present = (value) => value !== null && value !== undefined && value !== "";
const text = (value) => present(value) ? String(value) : EMPTY;
const pct = (value) => present(value) ? `${number(value).toFixed(1)}%` : EMPTY;
const ms = (value) => present(value) ? `${number(value).toFixed(1)} ms` : EMPTY;
const count = (value) => present(value) ? nf.format(number(value)) : "0";
const bytes = (value) => {
  const size = number(value, NaN);
  if (!Number.isFinite(size)) return EMPTY;
  if (size >= 1024 ** 3) return `${(size / (1024 ** 3)).toFixed(2)} GB`;
  if (size >= 1024 ** 2) return `${(size / (1024 ** 2)).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};
const uptime = (seconds) => {
  const value = number(seconds, NaN);
  if (!Number.isFinite(value)) return EMPTY;
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return [days ? `${days}d` : null, `${hours}h`, `${minutes}m`].filter(Boolean).join(" ");
};

const toneForPercent = (value, warn = 70, critical = 85) => {
  const parsed = number(value, 0);
  if (parsed >= critical) return "red";
  if (parsed >= warn) return "amber";
  return "green";
};

const toneForMs = (value, warn, critical) => {
  const parsed = number(value, 0);
  if (parsed >= critical) return "red";
  if (parsed >= warn) return "amber";
  return "green";
};

const serviceLabels = {
  cloudflare_r2: "Cloudflare R2",
  ai: "IA",
  mercado_pago: "Mercado Pago",
  evolution: "Evolution",
};

function ProgressBar({ value, warn = 70, critical = 85 }) {
  const percent = Math.max(0, Math.min(100, number(value, 0)));
  const tone = toneForPercent(percent, warn, critical);
  return (
    <div className="perf-progress">
      <span className={`perf-progress-fill ${tone}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function CacheProgress({ value }) {
  const percent = Math.max(0, Math.min(100, number(value, 0)));
  const tone = percent < 30 ? "red" : percent < 60 ? "amber" : "green";
  return (
    <div className="perf-progress">
      <span className={`perf-progress-fill ${tone}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function HealthBadge({ tone, children }) {
  const label = tone === "red" ? "Critico" : tone === "amber" ? "Atencao" : "Saudavel";
  return <Badge tone={tone}>{children || label}</Badge>;
}

function MetricCard({ icon, title, value, subtitle, tone = "green", children }) {
  return (
    <div className={`card perf-card ${tone}`}>
      <div className="perf-card-head">
        <div className="perf-icon"><Icon name={icon} size={18} /></div>
        <div>
          <span>{title}</span>
          <strong>{value}</strong>
        </div>
      </div>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  );
}

function ResourceCard({ icon, title, resource, warn, critical }) {
  const used = resource?.used_percent;
  const tone = toneForPercent(used, warn, critical);
  return (
    <MetricCard icon={icon} title={title} value={pct(used)} subtitle={`${bytes(resource?.used_bytes)} usados de ${bytes(resource?.total_bytes)}`} tone={tone}>
      <ProgressBar value={used} warn={warn} critical={critical} />
      <div className="perf-mini-grid">
        <span>Total <b>{bytes(resource?.total_bytes)}</b></span>
        <span>Livre <b>{bytes(resource?.free_bytes)}</b></span>
      </div>
    </MetricCard>
  );
}

function ServiceCard({ id, data }) {
  const calls = number(data?.calls);
  const hasCalls = calls > 0;
  const tone = number(data?.errors) > 0 ? "red" : hasCalls ? toneForMs(data?.average_ms, id === "ai" ? 1200 : 800, id === "ai" ? 2000 : 2000) : "green";
  const value = hasCalls ? ms(data?.average_ms) : "Sem chamadas ainda";
  const subtitle = hasCalls ? `${count(data?.calls)} chamadas / ${count(data?.errors)} erros` : "Monitor aguardando o primeiro uso";
  return (
    <MetricCard icon={id === "ai" ? "Bot" : id === "cloudflare_r2" ? "Globe" : id === "mercado_pago" ? "CreditCard" : "MessageCircle"} title={serviceLabels[id]} value={value} subtitle={subtitle} tone={tone}>
      <div className="perf-mini-grid">
        <span>Maior <b>{hasCalls ? ms(data?.max_ms) : "Aguardando"}</b></span>
        <span>Menor <b>{hasCalls ? ms(data?.min_ms) : "Aguardando"}</b></span>
      </div>
    </MetricCard>
  );
}

function EmptyRow({ colSpan, label = "Sem dados neste periodo." }) {
  return <tr><td colSpan={colSpan} className="muted">{label}</td></tr>;
}

function Section({ title, children, action }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="ct">{title}</div>
        <div className="grow" />
        {action}
      </div>
      {children}
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <div className="perf-pagination">
      {pages.map((item) => (
        <button
          className={item === page ? "active" : ""}
          key={item}
          type="button"
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function AlertList({ alerts }) {
  return (
    <div className="perf-alerts">
      {alerts.length ? alerts.map((alert) => (
        <div className={`perf-alert ${alert.tone}`} key={alert.label}>
          <Icon name={alert.tone === "red" ? "TriangleAlert" : alert.tone === "amber" ? "AlertTriangle" : "CheckCircle2"} size={16} />
          <span>{alert.label}</span>
          <strong>{alert.value}</strong>
        </div>
      )) : (
        <div className="perf-alert green">
          <Icon name="CheckCircle2" size={16} />
          <span>Nenhum alerta critico no snapshot atual.</span>
          <strong>OK</strong>
        </div>
      )}
    </div>
  );
}

export function Performance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hidden, setHidden] = useState(document.hidden);
  const [slowPage, setSlowPage] = useState(1);
  const [indexPage, setIndexPage] = useState(1);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const payload = await api.getPerformance();
      setData(payload);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Nao foi possivel carregar performance.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => load({ silent: true }), hidden ? 30000 : 5000);
    return () => window.clearInterval(interval);
  }, [hidden]);

  const system = data?.system || {};
  const database = data?.database || {};
  const external = data?.external || {};
  const cache = data?.cache || {};
  const sql = data?.sql || {};
  const apiData = data?.api || {};
  const endpoints = data?.endpoints || {};
  const payloads = data?.payloads || {};
  const companies = data?.companies || {};
  const indexes = data?.indexes || [];

  const alerts = useMemo(() => {
    const items = [];
    const pushPercent = (label, value, warn, critical) => {
      const parsed = number(value, NaN);
      if (!Number.isFinite(parsed)) return;
      if (parsed >= critical) items.push({ tone: "red", label, value: pct(parsed) });
      else if (parsed >= warn) items.push({ tone: "amber", label, value: pct(parsed) });
    };
    const pushMs = (label, value, warn, critical) => {
      const parsed = number(value, NaN);
      if (!Number.isFinite(parsed)) return;
      if (parsed >= critical) items.push({ tone: "red", label, value: ms(parsed) });
      else if (parsed >= warn) items.push({ tone: "amber", label, value: ms(parsed) });
    };

    pushPercent("CPU acima do limite", system.cpu?.used_percent, 80, 90);
    pushPercent("RAM acima do limite", system.memory?.used_percent, 85, 95);
    pushPercent("Disco acima do limite", system.disk?.used_percent, 90, 96);
    if (present(cache.hit_rate) && number(cache.hit_rate) < 60) items.push({ tone: "amber", label: "Cache Hit baixo", value: pct(cache.hit_rate) });
    pushMs("SQL medio alto", sql.average_ms, 100, 250);
    pushMs("Cloudflare R2 lento", external.cloudflare_r2?.average_ms, 1000, 2000);
    pushMs("IA lenta", external.ai?.average_ms, 2000, 4000);
    pushMs("Mercado Pago lento", external.mercado_pago?.average_ms, 2000, 4000);
    pushMs("Evolution lento", external.evolution?.average_ms, 2000, 4000);
    return items;
  }, [system, cache, sql, external]);

  const slowQueries = sql.top_slow_queries || [];
  const topPayloads = endpoints.top_by_payload || [];
  const topRequestPayloads = endpoints.top_by_request_payload || [];
  const topLoad = companies.top_load || [];
  const monitorActive = data?.enabled || data?.status === "observing";
  const slowTotalPages = Math.max(1, Math.ceil(slowQueries.length / SLOW_QUERY_PAGE_SIZE));
  const indexTotalPages = Math.max(1, Math.ceil(indexes.length / INDEX_PAGE_SIZE));
  const visibleSlowQueries = slowQueries.slice((slowPage - 1) * SLOW_QUERY_PAGE_SIZE, slowPage * SLOW_QUERY_PAGE_SIZE);
  const visibleIndexes = indexes.slice((indexPage - 1) * INDEX_PAGE_SIZE, indexPage * INDEX_PAGE_SIZE);

  return (
    <div className="page fade-up performance-page">
      <div className="page-head">
        <div>
          <div className="pt">Performance</div>
          <div className="ps">Monitoramento operacional da plataforma Replymesh em tempo real.</div>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost" type="button" onClick={() => load()}>
          <Icon name={loading ? "LoaderCircle" : "RefreshCw"} size={16} className={loading ? "spin" : ""} />
          Atualizar
        </button>
      </div>

      {error && <div className="notice danger" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="perf-hero card">
        <div>
          <span className="eyebrow">Status da plataforma</span>
          <h2>{monitorActive ? "Observabilidade ativa" : "Coleta aguardando ativacao"}</h2>
          <p>
            Endpoint unico: <span className="mono">/api/v1/master/performance</span>. {monitorActive ? "As metricas sao preenchidas conforme o sistema e as integracoes sao usadas." : "Ative a coleta no ambiente para registrar eventos operacionais."} Atualizacao {hidden ? "reduzida porque a aba esta oculta" : "automatica a cada 5 segundos"}.
          </p>
        </div>
        <div className="perf-status-stack">
          <HealthBadge tone={error ? "red" : monitorActive ? "green" : "amber"}>{error ? "Offline" : monitorActive ? "Online" : "Pendente"}</HealthBadge>
          <span>Ultima atualizacao: <b>{lastUpdated ? dtf.format(lastUpdated) : EMPTY}</b></span>
          <span>Janela: <b>{count(data?.window_size)} eventos</b></span>
        </div>
      </div>

      <div className="perf-grid-main">
        <MetricCard icon="Cpu" title="CPU" value={pct(system.cpu?.used_percent)} subtitle={`Load average: ${(system.load_average || []).join(" / ") || EMPTY}${system.cpu?.cores ? ` / ${system.cpu.cores} CPU` : ""}`} tone={toneForPercent(system.cpu?.used_percent, 80, 90)}>
          <ProgressBar value={system.cpu?.used_percent} warn={80} critical={90} />
        </MetricCard>
        <ResourceCard icon="Activity" title="RAM" resource={system.memory} warn={85} critical={95} />
        <ResourceCard icon="Server" title="Disco" resource={system.disk} warn={90} critical={96} />
        <MetricCard icon="Database" title="Banco" value={`${count(database.connections?.open)} / ${count(database.connections?.max)}`} subtitle={`SQL medio ${ms(database.query_average_ms)} / ${count(database.average_queries_per_request)} queries/request`} tone={toneForMs(database.query_average_ms, 100, 250)}>
          <div className="perf-mini-grid">
            <span>Ativas <b>{count(database.connections?.active)}</b></span>
            <span>Ociosas <b>{count(database.connections?.idle)}</b></span>
          </div>
        </MetricCard>
        <MetricCard icon="Activity" title="Cache" value={pct(cache.hit_rate)} subtitle={`${count(cache.hit)} hits / ${count(cache.miss)} misses`} tone={present(cache.hit_rate) && number(cache.hit_rate) < 60 ? "amber" : "green"}>
          <CacheProgress value={cache.hit_rate || 0} />
          <div className="perf-mini-grid">
            <span>TTL medio <b>{present(cache.average_ttl_seconds) ? `${count(cache.average_ttl_seconds)}s` : EMPTY}</b></span>
            <span>Grupo <b>{text(cache.largest_group?.value)}</b></span>
          </div>
        </MetricCard>
      </div>

      <Section title="Alertas">
        <AlertList alerts={alerts} />
      </Section>

      <div className="perf-grid-services">
        <ServiceCard id="cloudflare_r2" data={external.cloudflare_r2} />
        <ServiceCard id="ai" data={external.ai} />
        <ServiceCard id="mercado_pago" data={external.mercado_pago} />
        <ServiceCard id="evolution" data={external.evolution} />
      </div>

      <div className="perf-grid-two">
        <Section title="Empresas com maior consumo">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Empresa</th><th>Requests</th><th>Tempo medio</th><th>Queries</th><th>Payload</th><th>Cache</th><th>IA</th><th>Cloudflare</th></tr></thead>
              <tbody>
                {topLoad.length ? topLoad.map((company, index) => (
                  <tr key={company.company_id || `company-load-${index}`}>
                    <td className="mono">#{company.company_id || "-"}</td>
                    <td>{count(company.requests)}</td>
                    <td>{ms(company.average_ms)}</td>
                    <td>{count(company.query_count)}</td>
                    <td>{bytes(company.largest_payload_bytes)}</td>
                    <td>{pct(company.cache_hit_rate)}</td>
                    <td>{count(company.ai_calls)}</td>
                    <td>{EMPTY}</td>
                  </tr>
                )) : <EmptyRow colSpan={8} />}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Endpoints">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Endpoint</th><th>Tempo medio</th><th>Maior tempo</th><th>Payload</th><th>Requests</th></tr></thead>
              <tbody>
                {endpoints.slowest ? (
                  <tr>
                    <td className="mono">{text(endpoints.slowest.endpoint)}</td>
                    <td>{ms(apiData.average_ms)}</td>
                    <td>{ms(endpoints.slowest.duration_ms)}</td>
                    <td>{bytes(apiData.average_payload_bytes)}</td>
                    <td>{count(apiData.total_requests)}</td>
                  </tr>
                ) : <EmptyRow colSpan={5} />}
                {endpoints.most_accessed && (
                  <tr>
                    <td className="mono">{text(endpoints.most_accessed.value)}</td>
                    <td>{EMPTY}</td>
                    <td>{EMPTY}</td>
                    <td>{EMPTY}</td>
                    <td>{count(endpoints.most_accessed.count)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="perf-grid-two">
        <Section
          title="Slow Queries"
          action={<Pagination page={slowPage} totalPages={slowTotalPages} onChange={setSlowPage} />}
        >
          <div className="tbl-wrap">
            <table className="tbl perf-compact-table">
              <thead><tr><th>Tempo</th><th>Endpoint</th><th>Empresa</th><th>SQL resumido</th><th>Timestamp</th></tr></thead>
              <tbody>
                {visibleSlowQueries.length ? visibleSlowQueries.map((query, index) => (
                  <tr key={`${query.at}-${index}`}>
                    <td>{ms(query.duration_ms)}</td>
                    <td className="mono">{text(query.endpoint)}</td>
                    <td className="mono">{query.company_id ? `#${query.company_id}` : "-"}</td>
                    <td className="mono perf-sql">{text(query.sql)}</td>
                    <td>{query.at ? dtf.format(new Date(query.at)) : EMPTY}</td>
                  </tr>
                )) : <EmptyRow colSpan={5} />}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Payloads">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Endpoint</th><th>Payload medio</th><th>Maior payload</th><th>Tipo</th></tr></thead>
              <tbody>
                {payloads.largest_response && (
                  <tr><td className="mono">{text(payloads.largest_response.endpoint)}</td><td>{bytes(apiData.average_payload_bytes)}</td><td>{bytes(payloads.largest_response.payload_bytes)}</td><td>Resposta</td></tr>
                )}
                {payloads.largest_request && (
                  <tr><td className="mono">{text(payloads.largest_request.endpoint)}</td><td>{bytes(apiData.average_request_payload_bytes)}</td><td>{bytes(payloads.largest_request.request_payload_bytes)}</td><td>Requisicao</td></tr>
                )}
                {!payloads.largest_response && !payloads.largest_request && <EmptyRow colSpan={4} />}
                {topPayloads.slice(0, 5).map((item, index) => (
                  <tr key={`payload-${index}`}><td className="mono">{text(item.endpoint)}</td><td>{bytes(apiData.average_payload_bytes)}</td><td>{bytes(item.payload_bytes)}</td><td>Top resposta</td></tr>
                ))}
                {topRequestPayloads.slice(0, 5).map((item, index) => (
                  <tr key={`request-payload-${index}`}><td className="mono">{text(item.endpoint)}</td><td>{bytes(apiData.average_request_payload_bytes)}</td><td>{bytes(item.request_payload_bytes)}</td><td>Top request</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <Section
        title="Indices do banco"
        action={<Pagination page={indexPage} totalPages={indexTotalPages} onChange={setIndexPage} />}
      >
        <div className="tbl-wrap">
          <table className="tbl perf-compact-table">
            <thead><tr><th>Tabela</th><th>Indice</th><th>Utilizado</th><th>Nao utilizado</th><th>Sugestao</th></tr></thead>
            <tbody>
              {visibleIndexes.length ? visibleIndexes.map((item, index) => (
                <tr key={`${item.table}-${index}`}>
                  <td className="mono">{text(item.table)}</td>
                  <td className="mono">{(item.existing_indexes || []).slice(0, 3).join(", ") || EMPTY}</td>
                  <td>{(item.used_indexes || []).length ? "Sim" : "Nao"}</td>
                  <td>{(item.unused_indexes || []).slice(0, 2).join(", ") || "-"}</td>
                  <td>{(item.suggestions || []).join("; ") || "-"}</td>
                </tr>
              )) : <EmptyRow colSpan={5} />}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="perf-footer card card-pad">
        <span>Versoes: Ruby {text(system.versions?.ruby)} / Rails {text(system.versions?.rails)} / PostgreSQL {text(system.versions?.postgresql)} / Node {text(system.versions?.node)}</span>
        <span>Uptime: {uptime(system.uptime_seconds)} / Threads Puma: {count(system.puma?.current_process_threads)} / {text(system.puma?.max_threads)}</span>
        <span>Conexoes HTTP abertas: {count(system.http_connections_open)} / Tempo desde deploy: {uptime(system.last_deploy?.seconds_since_deploy)}</span>
      </div>
    </div>
  );
}
