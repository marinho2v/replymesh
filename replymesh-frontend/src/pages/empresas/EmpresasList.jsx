import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { BRL } from "../../lib/utils.js";
import { api, getStoredUser } from "../../services/api.js";

const STATUS_BADGE = {
  active: ["green", "Ativa"],
  inactive: ["gray", "Inativa"],
  trial: ["amber", "Em teste"],
  suspended: ["red", "Suspensa"],
  canceled: ["gray", "Cancelada"],
};

const PLAN_BADGE = {
  essencial: "blue",
  profissional: "green",
  premium_ia: "amber",
};

const EMP_TABS = [
  { id: "todas", label: "Todas", filter: () => true },
  { id: "ativas", label: "Ativas", filter: (company) => company.status === "active" },
  { id: "inativas", label: "Inativas", filter: (company) => company.status === "inactive" },
  { id: "teste", label: "Em teste", filter: (company) => company.status === "trial" },
];

const titles = {
  todas: "Todas as Empresas",
  ativas: "Empresas Ativas",
  inativas: "Empresas Inativas",
  teste: "Empresas em Teste",
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("pt-BR").format(date);
}

function normalizeCompany(company = {}) {
  return {
    ...company,
    id: company.id ?? `unknown-${company.slug || company.name || "company"}`,
    name: company.name || "Empresa sem nome",
    slug: company.slug || "",
    status: company.status || "inactive",
    plan_status: company.plan_status || "inactive",
    responsible_email: company.responsible_email || "",
    primary_domain: company.primary_domain || "",
    users_count: Number(company.users_count || 0),
  };
}

export function EmpresasList({ onToast }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = EMP_TABS.find((item) => item.id === searchParams.get("tab"))?.id || "todas";
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("all");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusLoadingId, setStatusLoadingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const masterUser = getStoredUser();
  const canImpersonate = masterUser?.global_role === "super_admin" ||
    Boolean(masterUser?.master_role?.permissions?.impersonate_company);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.getCompanies();
      setCompanies((data.companies || []).map(normalizeCompany));
    } catch (err) {
      setError(err.message);
      onToast?.(err.message, "err");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    let active = true;

    api.getCompanies()
      .then((data) => {
        if (active) setCompanies((data.companies || []).map(normalizeCompany));
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

  const counts = useMemo(() => {
    const result = {};
    EMP_TABS.forEach((item) => {
      result[item.id] = companies.filter(item.filter).length;
    });
    return result;
  }, [companies]);

  const rows = useMemo(() => {
    const base = EMP_TABS.find((item) => item.id === tab) || EMP_TABS[0];
    const needle = q.trim().toLowerCase();

    return companies
      .filter(base.filter)
      .filter((company) => plan === "all" || company.plan_slug === plan)
      .filter((company) => `${company.name || ""} ${company.primary_domain || ""} ${company.responsible_email || ""}`.toLowerCase().includes(needle));
  }, [companies, tab, q, plan]);

  const changeStatus = async (company) => {
    setStatusLoadingId(company.id);

    try {
      const data = company.status === "active"
        ? await api.deactivateCompany(company.id)
        : await api.activateCompany(company.id);

      setCompanies((current) => current.map((item) => (item.id === company.id ? data.company : item)));
      onToast?.(`Empresa "${company.name}" ${data.company.status === "active" ? "ativada" : "inativada"} com sucesso`, "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const enterCompany = (company) => {
    const confirmed = window.confirm(
      `Entrar no painel de "${company.name}" como suporte Replymesh?\n\nA sessao sera temporaria e todas as acoes ficarao auditadas.`
    );
    if (!confirmed) return;

    const popup = window.open(`/empresas/${company.id}/acesso`, "_blank", "noopener,noreferrer");
    if (!popup) {
      onToast?.("O navegador bloqueou a nova aba. Libere pop-ups para o Painel Master.", "err");
      return;
    }
    onToast?.(`Preparando acesso seguro para ${company.name}`, "ok");
  };

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">{titles[tab]}</div>
          <div className="ps">{rows.length} {rows.length === 1 ? "empresa" : "empresas"} - gerencie contas, planos e dominios</div>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost" onClick={loadCompanies} disabled={loading}><Icon name="RefreshCcw" size={16} /> Atualizar</button>
        <button className="btn btn-primary" onClick={() => navigate("/empresas/nova")}><Icon name="Plus" size={17} /> Nova Empresa</button>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {EMP_TABS.map((item) => (
            <button
              key={item.id}
              className={`tab${tab === item.id ? " active" : ""}`}
              onClick={() => {
                setSearchParams(item.id === "todas" ? {} : { tab: item.id });
              }}
            >
              {item.label}<span className="n">{counts[item.id] || 0}</span>
            </button>
          ))}
        </div>
        <div className="grow" style={{ flex: 1 }} />
        <div className="field-search">
          <Icon name="Search" size={16} className="si" />
          <input placeholder="Buscar empresa ou dominio..." value={q} onChange={(event) => setQ(event.target.value)} />
        </div>
        <select value={plan} onChange={(event) => setPlan(event.target.value)} style={{ height: 38, border: "1px solid var(--border)", borderRadius: 9, padding: "0 12px", background: "#fff", fontWeight: 550, fontSize: 13, color: "var(--text)" }}>
          <option value="all">Todos os planos</option>
          <option value="essencial">Essencial</option>
          <option value="profissional">Profissional</option>
          <option value="premium_ia">Premium IA</option>
        </select>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Empresa</th><th>Plano</th><th>Status</th><th>Usuarios</th><th>Pedidos (Hoje)</th><th>Receita (Mes)</th><th>Cadastro</th><th style={{ textAlign: "right" }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="8">
                    <div className="empty">
                      <div className="ei"><Icon name="LoaderCircle" size={24} className="spin" /></div>
                      <div className="et">Carregando empresas</div>
                      <div className="es">Buscando dados no backend Rails.</div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan="8">
                    <div className="empty">
                      <div className="ei"><Icon name="CircleAlert" size={24} /></div>
                      <div className="et">Nao foi possivel carregar empresas</div>
                      <div className="es">{error}</div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && rows.map((company) => {
                const status = STATUS_BADGE[company.status] || ["gray", company.status];

                return (
                  <tr key={company.id}>
                    <td>
                      <div className="cell-co">
                        <CoAvatar name={company.name} size={34} />
                        <div>
                          <div className="t">{company.name}</div>
                          <div className="s mono">{company.primary_domain || `${company.slug}.replymesh.cloud`}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge tone={PLAN_BADGE[company.plan_slug] || "gray"} dot={false}>{company.plan || "-"}</Badge></td>
                    <td><Badge tone={status[0]}>{status[1]}</Badge></td>
                    <td className="mono">{company.users_count || 0}</td>
                    <td className="mono">0</td>
                    <td className="mono">{BRL(0)}</td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{formatDate(company.created_at)}</td>
                    <td>
                      <div className="company-actions">
                        <button className="ra" title="Mais acoes" onClick={() => setOpenMenuId((current) => current === company.id ? null : company.id)}><Icon name="EllipsisVertical" size={16} /></button>
                        {openMenuId === company.id && <div className="company-action-menu">
                          <button onClick={() => navigate(`/empresas/${company.id}`)}><Icon name="Eye" size={15} />Visualizar</button>
                          <button onClick={() => navigate(`/empresas/${company.id}/editar`)}><Icon name="Pencil" size={15} />Editar</button>
                          <button disabled={statusLoadingId === company.id} onClick={() => { setOpenMenuId(null); changeStatus(company); }}><Icon name={company.status === "active" ? "PauseCircle" : "CircleCheck"} size={15} />{company.status === "active" ? "Suspender" : "Reativar"}</button>
                          <button onClick={() => navigate("/assinaturas")}><Icon name="CreditCard" size={15} />Assinatura</button>
                          <button onClick={() => navigate("/dominios")}><Icon name="Globe" size={15} />Dominio</button>
                          <button onClick={() => navigate("/whatsapp")}><Icon name="MessageCircle" size={15} />WhatsApp</button>
                          <button onClick={() => navigate(`/tickets?company_id=${company.id}`)}><Icon name="LifeBuoy" size={15} />Tickets</button>
                          <button onClick={() => navigate("/financeiro")}><Icon name="ChartNoAxesCombined" size={15} />Relatorios</button>
                          <button onClick={() => navigate(`/empresas/${company.id}/importar-backup-2r`)}><Icon name="Archive" size={15} />Importar backup</button>
                          {canImpersonate && (
                            <button onClick={() => enterCompany(company)}><Icon name="LogIn" size={15} />Entrar como empresa</button>
                          )}
                        </div>}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="empty">
                      <div className="ei"><Icon name="Building2" size={24} /></div>
                      <div className="et">Nenhuma empresa encontrada</div>
                      <div className="es">Ajuste os filtros ou cadastre uma nova empresa para comecar.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
