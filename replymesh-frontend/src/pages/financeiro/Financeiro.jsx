import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CardHead } from "../../components/shared/CardHead.jsx";
import { StatCard } from "../../components/shared/StatCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { LineChart } from "../../components/ui/LineChart.jsx";
import { BRL } from "../../lib/utils.js";
import { api } from "../../services/api.js";

const TABS = [
  { path: "/financeiro",               key: "visao-geral",   label: "Visão Geral",   icon: "BarChart3" },
  { path: "/financeiro/cobrancas",     key: "cobrancas",     label: "Cobranças",     icon: "Receipt" },
  { path: "/financeiro/inadimplencia", key: "inadimplencia", label: "Inadimplência", icon: "AlertCircle" },
];

const STATUS_BADGE = {
  active:    ["green",  "Ativo"],
  trial:     ["amber",  "Trial"],
  overdue:   ["red",    "Inadimplente"],
  suspended: ["red",    "Suspenso"],
  canceled:  ["gray",   "Cancelado"],
};

const SUB_STATUS_BADGE = {
  active:    ["green",  "Ativo"],
  trial:     ["amber",  "Trial"],
  overdue:   ["red",    "Inadimplente"],
  suspended: ["red",    "Suspenso"],
  canceled:  ["gray",   "Cancelado"],
};

function fmt(value) {
  if (value == null) return "—";
  return BRL(Number(value));
}

function fmtDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

// ────────────────────────────────────────────────
// Sub-page: Visão Geral
// ────────────────────────────────────────────────
function VisaoGeral({ onToast }) {
  const [loading, setLoading]           = useState(true);
  const [metrics, setMetrics]           = useState({});
  const [monthly, setMonthly]           = useState([]);
  const [byPlan, setByPlan]             = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [error, setError]               = useState("");

  useEffect(() => {
    let active = true;
    api.getFinanceiro()
      .then((data) => {
        if (!active) return;
        setMetrics(data.metrics || {});
        setMonthly(data.monthly_evolution || []);
        setByPlan(data.revenue_by_plan || []);
        setTopCompanies(data.top_companies || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        onToast?.(err.message, "err");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onToast]);

  const chartData = useMemo(
    () => monthly.map((m) => ({ l: m.month, v: Number(m.mrr_brl || 0) })),
    [monthly]
  );

  const totalByPlan = useMemo(
    () => byPlan.reduce((sum, p) => sum + Number(p.total_cents || 0), 0),
    [byPlan]
  );

  if (loading) return <div className="empty"><div className="ei"><Icon name="Loader" size={24} /></div><div className="et">Carregando...</div></div>;
  if (error)   return <div className="empty"><div className="ei"><Icon name="AlertTriangle" size={22} /></div><div className="et">Erro ao carregar</div><div className="es">{error}</div></div>;

  return (
    <>
      {/* ── Stat cards ── */}
      <div className="stat-grid">
        <StatCard icon="TrendingUp"    label="MRR atual"          value={fmt(metrics.mrr_brl)}           delta={`ARR: ${fmt(metrics.arr_brl)}`}                          dir="up" />
        <StatCard icon="Building2"     label="Empresas ativas"    value={String(metrics.active_companies || 0)}  delta={`${metrics.trial_companies || 0} em trial`}      dir="flat" />
        <StatCard icon="AlertCircle"   label="Inadimplentes"      value={String(metrics.overdue_companies || 0)} delta={`${metrics.suspended_companies || 0} suspensas`} dir={metrics.overdue_companies ? "down" : "flat"} />
        <StatCard icon="XCircle"       label="Canceladas"         value={String(metrics.canceled_companies || 0)} delta="histórico"                                       dir="flat" />
        <StatCard icon="CreditCard"    label="Assinaturas ativas" value={String(metrics.active_subscriptions || 0)} delta={`${metrics.trial_subscriptions || 0} trial`}  dir="flat" />
      </div>

      {/* ── MRR chart + receita por plano ── */}
      <div className="grid-3">
        <div className="card" style={{ gridColumn: "span 2" }}>
          <CardHead title="Evolução do MRR" />
          <div className="card-pad">
            {chartData.length > 0
              ? <LineChart data={chartData} height={240} format={BRL} />
              : <div className="empty" style={{ height: 240 }}><div className="et">Sem dados históricos</div></div>
            }
          </div>
        </div>

        <div className="card">
          <CardHead title="Receita por plano" />
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Plano</th>
                  <th>Assin.</th>
                  <th style={{ textAlign: "right" }}>MRR</th>
                </tr>
              </thead>
              <tbody>
                {byPlan.length ? byPlan.map((p) => (
                  <tr key={p.plan_id}>
                    <td>
                      <strong>{p.plan_name}</strong>
                      {totalByPlan > 0 && (
                        <div className="muted" style={{ fontSize: "11px" }}>
                          {Math.round((p.total_cents / totalByPlan) * 100)}%
                        </div>
                      )}
                    </td>
                    <td>{p.subscription_count}</td>
                    <td style={{ textAlign: "right" }}>
                      <strong>{fmt(p.total_brl)}</strong>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" className="muted">Nenhum plano ativo</td></tr>
                )}
              </tbody>
              {byPlan.length > 0 && (
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{byPlan.reduce((s, p) => s + p.subscription_count, 0)}</strong></td>
                    <td style={{ textAlign: "right" }}>
                      <strong>{fmt(metrics.mrr_brl)}</strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ── Top empresas por receita ── */}
      <div className="card">
        <CardHead title="Top empresas por receita" />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>MRR</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.length ? topCompanies.map((c) => {
                const st = STATUS_BADGE[c.status] || STATUS_BADGE.active;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CoAvatar name={c.name} size={28} />
                        <div>
                          <strong>{c.name}</strong>
                          <div className="muted mono" style={{ fontSize: "11px" }}>{c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge tone={st[0]}>{st[1]}</Badge></td>
                    <td style={{ textAlign: "right" }}>
                      <strong>{fmt(c.revenue_brl)}</strong>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="3" className="muted">Nenhuma empresa ativa com assinatura</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tabela mensal detalhada ── */}
      <div className="card">
        <CardHead title="Histórico mensal" />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Novas assinaturas</th>
                <th style={{ textAlign: "right" }}>MRR acumulado</th>
              </tr>
            </thead>
            <tbody>
              {monthly.length ? [...monthly].reverse().map((m) => (
                <tr key={m.month_key}>
                  <td><strong>{m.month}</strong></td>
                  <td>{m.new_count}</td>
                  <td style={{ textAlign: "right" }}>{fmt(m.mrr_brl)}</td>
                </tr>
              )) : (
                <tr><td colSpan="3" className="muted">Sem histórico</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────
// Sub-page: Cobranças
// ────────────────────────────────────────────────
function Cobrancas({ onToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState({ cobrancas: [], total_expected_brl: 0, count: 0 });
  const [error, setError]     = useState("");

  useEffect(() => {
    let active = true;
    api.getFinanceiroCobrancas()
      .then((d) => { if (active) setData(d); })
      .catch((err) => { if (active) { setError(err.message); onToast?.(err.message, "err"); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onToast]);

  if (loading) return <div className="empty"><div className="ei"><Icon name="Loader" size={24} /></div><div className="et">Carregando...</div></div>;
  if (error)   return <div className="empty"><div className="et">Erro: {error}</div></div>;

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard icon="Receipt"   label="Total a cobrar (mês)"  value={fmt(data.total_expected_brl)} delta="assinaturas ativas + trial" dir="flat" />
        <StatCard icon="FileText"  label="Cobranças listadas"    value={String(data.count || 0)}      delta="ativas e trial"            dir="flat" />
      </div>

      <div className="card">
        <CardHead title="Cobranças do período" />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Início</th>
                <th>Venc. trial</th>
                <th style={{ textAlign: "right" }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.cobrancas.length ? data.cobrancas.map((c) => {
                const st = SUB_STATUS_BADGE[c.status] || SUB_STATUS_BADGE.active;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CoAvatar name={c.company?.name || "?"} size={28} />
                        <div>
                          <strong>{c.company?.name || "—"}</strong>
                          <div className="muted mono" style={{ fontSize: "11px" }}>{c.company?.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.plan?.name || "—"}</td>
                    <td><Badge tone={st[0]}>{st[1]}</Badge></td>
                    <td>{fmtDate(c.started_at)}</td>
                    <td>{fmtDate(c.trial_ends_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <strong>{fmt(c.price_brl)}</strong>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6" className="muted">Nenhuma cobrança encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────
// Sub-page: Inadimplência
// ────────────────────────────────────────────────
function Inadimplencia({ onToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState({ inadimplentes: [], total_overdue_brl: 0, count: 0 });
  const [error, setError]     = useState("");

  useEffect(() => {
    let active = true;
    api.getFinanceiroInadimplencia()
      .then((d) => { if (active) setData(d); })
      .catch((err) => { if (active) { setError(err.message); onToast?.(err.message, "err"); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onToast]);

  if (loading) return <div className="empty"><div className="ei"><Icon name="Loader" size={24} /></div><div className="et">Carregando...</div></div>;
  if (error)   return <div className="empty"><div className="et">Erro: {error}</div></div>;

  return (
    <>
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard icon="AlertCircle" label="Total inadimplente" value={fmt(data.total_overdue_brl)} delta="receita em risco"         dir="down" />
        <StatCard icon="Users"       label="Empresas afetadas" value={String(data.count || 0)}     delta="overdue ou suspensas"      dir={data.count ? "down" : "flat"} />
      </div>

      <div className="card">
        <CardHead title="Empresas inadimplentes" />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Desde</th>
                <th style={{ textAlign: "right" }}>Valor em aberto</th>
              </tr>
            </thead>
            <tbody>
              {data.inadimplentes.length ? data.inadimplentes.map((item) => {
                const st = SUB_STATUS_BADGE[item.status] || SUB_STATUS_BADGE.overdue;
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <CoAvatar name={item.company?.name || "?"} size={28} />
                        <div>
                          <strong>{item.company?.name || "—"}</strong>
                          <div className="muted mono" style={{ fontSize: "11px" }}>{item.company?.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{item.plan?.name || "—"}</td>
                    <td><Badge tone={st[0]}>{st[1]}</Badge></td>
                    <td>{fmtDate(item.company?.created_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <strong style={{ color: "var(--red)" }}>{fmt(item.price_brl)}</strong>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5">
                    <div className="empty" style={{ padding: "32px 0" }}>
                      <div className="ei"><Icon name="CheckCircle2" size={22} /></div>
                      <div className="et">Nenhuma inadimplência registrada</div>
                      <div className="es">Todas as assinaturas estão em dia.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────
// Componente principal — Financeiro
// ────────────────────────────────────────────────
export function Financeiro({ onToast }) {
  const location = useLocation();
  const navigate = useNavigate();

  const tab = useMemo(
    () => TABS.find((t) => t.path === location.pathname) || TABS[0],
    [location.pathname]
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Financeiro</h1>
          <p className="ps">Receita recorrente, cobranças e inadimplência do SaaS.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="toolbar">
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.path}
              className={`tab ${tab.path === t.path ? "active" : ""}`}
              onClick={() => navigate(t.path)}
            >
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo por tab */}
      {tab.key === "visao-geral"   && <VisaoGeral     onToast={onToast} />}
      {tab.key === "cobrancas"     && <Cobrancas      onToast={onToast} />}
      {tab.key === "inadimplencia" && <Inadimplencia  onToast={onToast} />}
    </div>
  );
}
