import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StatCard } from "../../components/shared/StatCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { BRL } from "../../lib/utils.js";
import { api } from "../../services/api.js";

const STATUS = {
  trial: ["amber", "Trial"],
  active: ["green", "Ativa"],
  overdue: ["red", "Inadimplente"],
  canceled: ["gray", "Cancelada"],
  suspended: ["red", "Suspensa"],
};

const TABS = [
  { path: "/assinaturas", label: "Visao Geral", filter: () => true },
  { path: "/assinaturas/faturas", label: "Faturas", filter: () => true },
  { path: "/assinaturas/inadimplencia", label: "Inadimplencia", filter: (item) => item.status === "overdue" },
];

function money(cents) {
  return BRL((cents || 0) / 100);
}

function date(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function Assinaturas({ onToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const tab = TABS.find((item) => item.path === location.pathname) || TABS[0];

  useEffect(() => {
    let active = true;

    Promise.all([api.getSubscriptions(), api.getPlans()])
      .then(([subscriptionsData, plansData]) => {
        if (!active) return;
        setSubscriptions(subscriptionsData.subscriptions || []);
        setMetrics(subscriptionsData.metrics || null);
        setPlans(plansData.plans || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        onToast?.(err.message, "err");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onToast]);

  const rows = useMemo(() => subscriptions.filter(tab.filter), [subscriptions, tab]);

  const updateSubscription = async (subscription, patch) => {
    setUpdatingId(subscription.id);

    try {
      const data = await api.updateSubscription(subscription.id, { subscription: patch });
      setSubscriptions((current) => current.map((item) => (item.id === subscription.id ? data.subscription : item)));
      const refreshed = await api.getSubscriptions();
      setMetrics(refreshed.metrics || null);
      onToast?.("Assinatura atualizada com sucesso", "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">Planos e Assinaturas</div>
          <div className="ps">Receita recorrente, empresas por plano e status das assinaturas</div>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost" onClick={() => navigate("/assinaturas/planos")}><Icon name="Layers" size={16} /> Planos</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard icon="Wallet" label="MRR ativo" value={money(metrics?.mrr_cents)} delta={`${metrics?.active_count || 0} assinaturas ativas`} dir="up" />
        <StatCard icon="Timer" label="Receita em trial" value={money(metrics?.trial_cents)} delta={`${metrics?.trial_count || 0} em teste`} dir="flat" />
        <StatCard icon="CircleAlert" label="Inadimplentes" value={metrics?.overdue_count || 0} delta="status overdue" dir={(metrics?.overdue_count || 0) > 0 ? "down" : "flat"} />
        <StatCard icon="CreditCard" label="Total de assinaturas" value={metrics?.total_count || 0} delta="base cadastrada" dir="flat" />
      </div>

      <div className="toolbar">
        <div className="tabs">
          {TABS.map((item) => (
            <button key={item.path} className={`tab${tab.path === item.path ? " active" : ""}`} onClick={() => navigate(item.path)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Empresa</th><th>Plano</th><th>Status</th><th>Valor</th><th>Periodo</th><th>Trial ate</th><th style={{ textAlign: "right" }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="7"><Empty icon="LoaderCircle" title="Carregando assinaturas" text="Buscando dados no backend Rails." spin /></td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan="7"><Empty icon="CircleAlert" title="Nao foi possivel carregar" text={error} /></td></tr>
              )}
              {!loading && !error && rows.map((subscription) => {
                const status = STATUS[subscription.status] || ["gray", subscription.status];
                return (
                  <tr key={subscription.id}>
                    <td>
                      <div className="cell-co">
                        <CoAvatar name={subscription.company.name} size={34} />
                        <div>
                          <div className="t">{subscription.company.name}</div>
                          <div className="s mono">{subscription.company.responsible_email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={subscription.plan.id}
                        disabled={updatingId === subscription.id}
                        onChange={(event) => updateSubscription(subscription, { plan_id: event.target.value })}
                        className="compact-select"
                      >
                        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        value={subscription.status}
                        disabled={updatingId === subscription.id}
                        onChange={(event) => updateSubscription(subscription, { status: event.target.value })}
                        className="compact-select"
                      >
                        {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label[1]}</option>)}
                      </select>
                    </td>
                    <td className="mono">{money(subscription.price_cents)}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{date(subscription.current_period_start)} - {date(subscription.current_period_end)}</td>
                    <td>{subscription.trial_ends_at ? <Badge tone="amber">{date(subscription.trial_ends_at)}</Badge> : <span className="muted">-</span>}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <Badge tone={status[0]}>{status[1]}</Badge>
                        {updatingId === subscription.id && <Icon name="LoaderCircle" size={16} className="spin" />}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan="7"><Empty icon="CreditCard" title="Nenhuma assinatura encontrada" text="Nao ha registros para este filtro." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Empty({ icon, title, text, spin = false }) {
  return (
    <div className="empty">
      <div className="ei"><Icon name={icon} size={24} className={spin ? "spin" : ""} /></div>
      <div className="et">{title}</div>
      <div className="es">{text}</div>
    </div>
  );
}
