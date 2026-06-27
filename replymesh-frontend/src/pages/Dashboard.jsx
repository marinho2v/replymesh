import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge.jsx";
import { CoAvatar } from "../components/ui/CoAvatar.jsx";
import { Donut } from "../components/ui/Donut.jsx";
import { Icon } from "../components/ui/Icon.jsx";
import { LineChart } from "../components/ui/LineChart.jsx";
import { CardHead, SeeAll } from "../components/shared/CardHead.jsx";
import { companyImpersonationUrl } from "../lib/companyImpersonation.js";
import { api } from "../services/api.js";
import { BRL } from "../lib/utils.js";

const PERIODS = [
  { key: "7d", label: "Ultimos 7 dias" },
  { key: "30d", label: "Ultimos 30 dias" },
  { key: "current_month", label: "Mes atual" },
  { key: "previous_month", label: "Mes anterior" },
  { key: "today", label: "Hoje" },
];

const STATUS_BADGE = {
  active: ["green", "Ativa"],
  trial: ["amber", "Teste"],
  inactive: ["gray", "Inativa"],
  suspended: ["red", "Suspensa"],
  canceled: ["gray", "Cancelada"],
};

const fmtInt = (value) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));
const fmtDate = (value) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
const metricValue = (metric) => Number(metric?.value || 0);
const variation = (metric) => Number(metric?.variation_percent || 0);

function deltaText(metric, suffix = "vs periodo anterior") {
  const delta = variation(metric);
  if (!delta) return "sem variacao";
  return `${Math.abs(delta)}% ${suffix}`;
}

function StatCard({ icon, label, value, delta, dir = "up", onClick }) {
  return (
    <button className="card stat" onClick={onClick} type="button">
      <div className="top">
        <div className="si"><Icon name={icon} size={19} /></div>
        <div className="lab">{label}</div>
      </div>
      <div className="val">{value}</div>
      <div className={`delta ${dir}`}>
        {dir !== "flat" && <Icon name={dir === "up" ? "TrendingUp" : "TrendingDown"} size={14} />}
        {delta}
      </div>
    </button>
  );
}

function metricDir(metric) {
  const delta = variation(metric);
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function actionTarget(alert) {
  if (!alert.company?.id) return "/dashboard";
  if (alert.action === "whatsapp") return "/whatsapp";
  if (alert.action === "tickets") return `/tickets?company_id=${alert.company.id}`;
  if (alert.action === "subscription") return "/assinaturas";
  if (alert.action === "payments") return "/financeiro";
  return `/empresas/${alert.company.id}`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [impersonatingId, setImpersonatingId] = useState(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");

      api.getDashboard({ period })
        .then((payload) => {
          if (active) setData(payload);
        })
        .catch((err) => {
          if (active) setError(err.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [period]);

  const overview = data?.overview || {};
  const charts = data?.charts || {};
  const recentCompanies = data?.recent_companies || [];
  const recentActivities = data?.recent_activities || [];
  const alerts = data?.alerts || [];

  const whatsappTotal = useMemo(() => (
    (charts.whatsapp_status || []).reduce((sum, item) => sum + Number(item.value || 0), 0)
  ), [charts.whatsapp_status]);

  const enterCompany = async (company) => {
    setImpersonatingId(company.id);

    try {
      const impersonation = await api.impersonateCompany(company.id);
      window.location.assign(companyImpersonationUrl(impersonation));
    } catch (err) {
      setImpersonatingId(null);
      setError(err.message || "Nao foi possivel entrar na empresa.");
    }
  };

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">Visao Geral</div>
          <div className="ps">Painel administrativo da Replymesh</div>
        </div>
        <div className="grow" />
        <button className="btn btn-primary" onClick={() => navigate("/empresas/nova")}>
          <Icon name="Plus" size={17} /> Nova Empresa
        </button>
      </div>

      {error && <div className="card card-pad"><strong>Erro ao carregar dashboard</strong><p className="muted">{error}</p></div>}
      {loading && <div className="card card-pad">Carregando dados executivos...</div>}

      {!loading && !error && (
        <>
          <div className="stat-grid">
            <StatCard
              icon="Building2"
              label="Empresas Ativas"
              value={fmtInt(metricValue(overview.companies_active))}
              delta={deltaText(overview.companies_active)}
              dir={metricDir(overview.companies_active)}
              onClick={() => navigate("/empresas?tab=ativas")}
            />
            <StatCard
              icon="DollarSign"
              label="Receita Mensal"
              value={BRL(metricValue(overview.processed_revenue_cents) / 100)}
              delta={deltaText(overview.processed_revenue_cents)}
              dir={metricDir(overview.processed_revenue_cents)}
              onClick={() => navigate("/financeiro")}
            />
            <StatCard
              icon="MessageCircle"
              label="Instancias WhatsApp"
              value={fmtInt(whatsappTotal)}
              delta={`${fmtInt(metricValue(overview.whatsapp_connected))} conectadas`}
              dir={metricValue(overview.whatsapp_disconnected) ? "down" : "flat"}
              onClick={() => navigate("/whatsapp")}
            />
            <StatCard
              icon="ShoppingBag"
              label="Pedidos Hoje"
              value={fmtInt(metricValue(overview.orders_today))}
              delta={deltaText(overview.orders_today, "hoje")}
              dir={metricDir(overview.orders_today)}
              onClick={() => navigate("/logs/auditoria")}
            />
            <StatCard
              icon="Users"
              label="Usuarios Totais"
              value={fmtInt(metricValue(overview.master_users) + metricValue(overview.store_users))}
              delta={`${fmtInt(metricValue(overview.store_users))} nas lojas`}
              dir="up"
              onClick={() => navigate("/usuarios-master")}
            />
            <StatCard
              icon="Sparkles"
              label="Programa Fundadores"
              value={`${fmtInt(metricValue(overview.founder_companies))} cadastradas`}
              delta={`${fmtInt(metricValue(overview.founder_remaining))} vagas restantes`}
              dir="flat"
              onClick={() => navigate("/configuracoes/programa-fundadores")}
            />
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="card-head">
                <div className="ct">Receita <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>({PERIODS.find((item) => item.key === period)?.label})</span></div>
                <div className="grow" />
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  style={{ height: 34, border: "1px solid var(--border)", borderRadius: 9, padding: "0 10px", background: "var(--card)", color: "var(--text)", fontWeight: 550, fontSize: 13 }}
                >
                  {PERIODS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </div>
              <div className="card-pad">
                <LineChart data={(charts.revenue || []).map((item) => ({ l: item.label, v: item.value / 100 }))} height={258} format={BRL} />
              </div>
            </div>

            <div className="card">
              <CardHead title="Empresas Recentes" action={<SeeAll onClick={() => navigate("/empresas")} />} />
              <div>
                {recentCompanies.slice(0, 5).map((company) => {
                  const badge = STATUS_BADGE[company.status] || STATUS_BADGE.inactive;
                  return (
                    <div className="lrow" key={company.id}>
                      <CoAvatar name={company.name} />
                      <div className="m">
                        <div className="t">{company.name}</div>
                        <div className="s mono">{company.domain || "-"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="time" style={{ marginBottom: 4 }}>{company.plan || "-"}</div>
                        <Badge tone={badge[0]}>{badge[1]}</Badge>
                      </div>
                    </div>
                  );
                })}
                {!recentCompanies.length && <div className="empty"><div className="et">Nenhuma empresa recente</div></div>}
              </div>
            </div>

            <div className="card">
              <CardHead title="Atividades Recentes" action={<SeeAll onClick={() => navigate("/logs/auditoria")} />} />
              <div>
                {recentActivities.slice(0, 6).map((activity) => (
                  <div className="lrow" key={activity.id}>
                    <div className="lico"><Icon name="Activity" size={16} /></div>
                    <div className="m">
                      <div className="t">{activity.action.replaceAll("_", " ")}</div>
                      <div className="s">{activity.actor?.name || "Sistema"} - {activity.company?.name || "Global"} - {fmtDate(activity.created_at)}</div>
                    </div>
                  </div>
                ))}
                {!recentActivities.length && <div className="empty"><div className="et">Sem atividades recentes</div></div>}
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <CardHead title="Empresas" action={<SeeAll onClick={() => navigate("/empresas")} />} />
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Plano</th>
                      <th>Status</th>
                      <th>Pedidos Hoje</th>
                      <th>Receita Mes</th>
                      <th style={{ textAlign: "right" }}>Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCompanies.map((company) => {
                      const badge = STATUS_BADGE[company.status] || STATUS_BADGE.inactive;
                      return (
                        <tr key={company.id}>
                          <td>
                            <div className="cell-co">
                              <CoAvatar name={company.name} size={32} />
                              <div>
                                <div className="t">{company.name}</div>
                                <div className="s mono">{company.domain || "-"}</div>
                              </div>
                            </div>
                          </td>
                          <td>{company.plan || "-"}</td>
                          <td><Badge tone={badge[0]}>{badge[1]}</Badge></td>
                          <td className="mono">{fmtInt(company.orders_today)}</td>
                          <td className="mono">{BRL(Number(company.revenue_month_cents || 0) / 100)}</td>
                          <td>
                            <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                              <button className="ra" title="Ver" onClick={() => navigate(`/empresas/${company.id}`)}><Icon name="Eye" size={16} /></button>
                              <button className="ra" disabled={impersonatingId === company.id} title="Entrar como empresa" onClick={() => enterCompany(company)}>
                                <Icon name={impersonatingId === company.id ? "LoaderCircle" : "LogIn"} size={16} className={impersonatingId === company.id ? "spin" : ""} />
                              </button>
                              <button className="ra" title="WhatsApp" onClick={() => navigate("/whatsapp")}><Icon name="MessageCircle" size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col">
              <div className="card">
                <CardHead title="Status das Instancias WhatsApp" action={<SeeAll onClick={() => navigate("/whatsapp")} />} />
                <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 28 }}>
                  <div style={{ position: "relative", flex: "0 0 auto" }}>
                    <Donut segments={(charts.whatsapp_status || []).map((item) => ({ value: item.value, color: item.color }))} total={whatsappTotal || 1} size={150} stroke={18} />
                    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                      <div>
                        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em", lineHeight: 1 }}>{fmtInt(whatsappTotal)}</div>
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Total</div>
                      </div>
                    </div>
                  </div>
                  <div className="legend" style={{ flex: 1 }}>
                    {(charts.whatsapp_status || []).map((item) => (
                      <div className="li" key={item.label}>
                        <span className="lc" style={{ background: item.color }} />
                        <span className="ln">{item.label}</span>
                        <span className="lv">{fmtInt(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <CardHead title="Alertas do Sistema" action={<SeeAll onClick={() => navigate("/logs/auditoria")} />} />
                <div>
                  {alerts.slice(0, 6).map((alert, index) => (
                    <div className="lrow" key={`${alert.kind}-${alert.company?.id || index}-${index}`}>
                      <div className="lico" style={{ background: alert.kind === "old_ticket" ? "var(--amber-bg)" : "var(--blue-bg)", borderColor: "transparent", color: alert.kind === "old_ticket" ? "var(--amber)" : "var(--blue)" }}>
                        <Icon name="AlertTriangle" size={16} />
                      </div>
                      <div className="m">
                        <div className="t">{alert.title}</div>
                        <div className="s">{alert.company?.name || "Global"} - {alert.message}</div>
                      </div>
                      <button className="ra" title="Abrir" onClick={() => navigate(actionTarget(alert))}><Icon name="ArrowRight" size={16} /></button>
                    </div>
                  ))}
                  {!alerts.length && <div className="empty"><div className="et">Nenhum alerta importante agora</div></div>}
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-metric-strip card">
            <span>Total empresas <strong>{fmtInt(metricValue(overview.companies_total))}</strong></span>
            <span>Em teste <strong>{fmtInt(metricValue(overview.companies_trial))}</strong></span>
            <span>Inativas <strong>{fmtInt(metricValue(overview.companies_inactive))}</strong></span>
            <span>Novas no periodo <strong>{fmtInt(metricValue(overview.companies_new))}</strong></span>
            <span>MRR estimado <strong>{BRL(metricValue(overview.mrr_cents) / 100)}</strong></span>
            <span>Tickets abertos <strong>{fmtInt(metricValue(overview.tickets_open))}</strong></span>
            <span>Uso da Carina <strong>{fmtInt(metricValue(overview.carina_usage_today))}</strong></span>
            <span>Pix aprovados <strong>{fmtInt(metricValue(overview.pix_approved))}</strong></span>
            <span>Pix pendentes <strong>{fmtInt(metricValue(overview.pix_pending))}</strong></span>
            <span>Erros Mercado Pago <strong>{fmtInt(metricValue(overview.mercado_pago_errors))}</strong></span>
          </div>
        </>
      )}
    </div>
  );
}
