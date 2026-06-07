import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StatCard } from "../../components/shared/StatCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const DNS_STATUS = {
  pending: ["amber", "Pendente"],
  active: ["green", "Ativo"],
  dns_error: ["red", "Erro DNS"],
  inactive: ["gray", "Inativo"],
};

const SSL_STATUS = {
  pending: ["amber", "Pendente"],
  active: ["green", "Ativo"],
  error: ["red", "Erro SSL"],
};

const TABS = [
  { path: "/dominios", label: "Todos", filter: () => true },
  { path: "/dominios/dns", label: "Configuracao DNS", filter: (domain) => domain.status !== "active" },
  { path: "/dominios/ssl", label: "Certificados SSL", filter: (domain) => domain.ssl_status !== "active" },
];

const EMPTY_FORM = {
  id: null,
  company_id: "",
  domain: "",
  domain_type: "subdomain",
  status: "pending",
  ssl_status: "pending",
  is_primary: false,
};

function date(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formFromDomain(domain) {
  return {
    id: domain.id,
    company_id: String(domain.company.id),
    domain: domain.domain,
    domain_type: domain.domain_type,
    status: domain.status,
    ssl_status: domain.ssl_status,
    is_primary: Boolean(domain.is_primary),
  };
}

export function Dominios({ onToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const tab = TABS.find((item) => item.path === location.pathname) || TABS[0];

  const loadData = async () => {
    setError("");
    const [domainsData, companiesData] = await Promise.all([api.getDomains(), api.getCompanies()]);
    setDomains(domainsData.domains || []);
    setMetrics(domainsData.metrics || null);
    setCompanies(companiesData.companies || []);
    setForm((current) => current.company_id ? current : { ...current, company_id: String(companiesData.companies?.[0]?.id || "") });
  };

  useEffect(() => {
    let active = true;

    Promise.all([api.getDomains(), api.getCompanies()])
      .then(([domainsData, companiesData]) => {
        if (!active) return;
        setDomains(domainsData.domains || []);
        setMetrics(domainsData.metrics || null);
        setCompanies(companiesData.companies || []);
        setForm((current) => current.company_id ? current : { ...current, company_id: String(companiesData.companies?.[0]?.id || "") });
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

  const rows = useMemo(() => domains.filter(tab.filter), [domains, tab]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const refreshDomain = (domain) => {
    setDomains((current) => current.map((item) => (item.id === domain.id ? domain : item)));
  };

  const save = async () => {
    if (!form.company_id || !form.domain.trim()) {
      onToast?.("Informe empresa e dominio", "err");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        domain: {
          company_id: form.company_id,
          domain: form.domain.trim(),
          domain_type: form.domain_type,
          status: form.status,
          ssl_status: form.ssl_status,
          is_primary: form.is_primary,
        },
      };
      const data = form.id ? await api.updateDomain(form.id, payload) : await api.createDomain(payload);
      if (form.id) refreshDomain(data.domain);
      else setDomains((current) => [data.domain, ...current]);
      const fresh = await api.getDomains();
      setMetrics(fresh.metrics || null);
      setForm({ ...EMPTY_FORM, company_id: form.company_id });
      onToast?.(`Dominio "${data.domain.domain}" salvo com sucesso`, "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (domain, action) => {
    setActionId(domain.id);

    try {
      const data = await action(domain.id);
      refreshDomain(data.domain);
      const fresh = await api.getDomains();
      setMetrics(fresh.metrics || null);
      onToast?.(`Dominio "${data.domain.domain}" atualizado`, "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">Dominios</div>
          <div className="ps">Gerencie subdominios, dominios customizados, DNS e SSL em modo mock</div>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost" onClick={() => loadData().then(() => onToast?.("Dominios atualizados", "ok")).catch((err) => onToast?.(err.message, "err"))}>
          <Icon name="RefreshCcw" size={16} /> Atualizar
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard icon="Globe" label="Total" value={metrics?.total_count || 0} delta="dominios cadastrados" dir="flat" />
        <StatCard icon="CircleCheck" label="Ativos" value={metrics?.active_count || 0} delta="DNS resolvido" dir="up" />
        <StatCard icon="Timer" label="Pendentes" value={metrics?.pending_count || 0} delta="aguardando verificacao" dir="flat" />
        <StatCard icon="CircleAlert" label="Com erro" value={metrics?.error_count || 0} delta="DNS ou SSL" dir={(metrics?.error_count || 0) > 0 ? "down" : "flat"} />
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

      <div className="domains-layout">
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Dominio</th><th>Empresa</th><th>Tipo</th><th>DNS</th><th>SSL</th><th>Ultima verificacao</th><th style={{ textAlign: "right" }}>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="7"><Empty icon="LoaderCircle" title="Carregando dominios" spin /></td></tr>}
                {!loading && error && <tr><td colSpan="7"><Empty icon="CircleAlert" title={error} /></td></tr>}
                {!loading && !error && rows.map((domain) => {
                  const dns = DNS_STATUS[domain.status] || ["gray", domain.status];
                  const ssl = SSL_STATUS[domain.ssl_status] || ["gray", domain.ssl_status];
                  return (
                    <tr key={domain.id}>
                      <td>
                        <div className="t mono">{domain.domain}</div>
                        <div className="s">{domain.is_primary ? "Primario" : "Secundario"}</div>
                      </td>
                      <td>
                        <div className="cell-co">
                          <CoAvatar name={domain.company.name} size={30} />
                          <div>
                            <div className="t">{domain.company.name}</div>
                            <div className="s mono">{domain.company.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge tone={domain.domain_type === "subdomain" ? "blue" : "gray"} dot={false}>{domain.domain_type === "subdomain" ? "Subdominio" : "Customizado"}</Badge></td>
                      <td><Badge tone={dns[0]}>{dns[1]}</Badge></td>
                      <td><Badge tone={ssl[0]}>{ssl[1]}</Badge></td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{date(domain.last_checked_at)}</td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                          <button className="ra" title="Editar" onClick={() => setForm(formFromDomain(domain))}><Icon name="Pencil" size={15} /></button>
                          <button className="ra" title="Verificar DNS" disabled={actionId === domain.id} onClick={() => runAction(domain, api.verifyDomain)}>
                            {actionId === domain.id ? <Icon name="LoaderCircle" size={16} className="spin" /> : <Icon name="Radar" size={16} />}
                          </button>
                          <button className="ra" title="Definir como primario" disabled={domain.is_primary || actionId === domain.id} onClick={() => runAction(domain, api.setPrimaryDomain)}><Icon name="Star" size={16} /></button>
                          <button className="ra" title="Desativar" disabled={domain.status === "inactive" || actionId === domain.id} onClick={() => runAction(domain, api.deactivateDomain)}><Icon name="Archive" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && !error && rows.length === 0 && <tr><td colSpan="7"><Empty icon="Globe" title="Nenhum dominio encontrado" /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad domain-form-card">
          <div className="form-section-t">{form.id ? "Editar dominio" : "Novo dominio"}</div>
          <div className="form-section-s">Vincule um dominio ou subdominio a uma empresa</div>

          <div className="field" style={{ marginTop: 14 }}>
            <label>Empresa</label>
            <select value={form.company_id} onChange={(event) => set("company_id", event.target.value)} disabled={Boolean(form.id)}>
              <option value="">Selecione</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Dominio</label>
            <input value={form.domain} onChange={(event) => set("domain", event.target.value.toLowerCase())} placeholder="loja.replymesh.cloud" />
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label>Tipo</label>
              <select value={form.domain_type} onChange={(event) => set("domain_type", event.target.value)}>
                <option value="subdomain">Subdominio</option>
                <option value="custom_domain">Customizado</option>
              </select>
            </div>
            <div className="field">
              <label>Primario</label>
              <select value={form.is_primary ? "true" : "false"} onChange={(event) => set("is_primary", event.target.value === "true")}>
                <option value="false">Nao</option>
                <option value="true">Sim</option>
              </select>
            </div>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label>Status DNS</label>
              <select value={form.status} onChange={(event) => set("status", event.target.value)}>
                {Object.entries(DNS_STATUS).map(([value, label]) => <option key={value} value={value}>{label[1]}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Status SSL</label>
              <select value={form.ssl_status} onChange={(event) => set("ssl_status", event.target.value)}>
                {Object.entries(SSL_STATUS).map(([value, label]) => <option key={value} value={value}>{label[1]}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} disabled={saving} onClick={save}>
            {saving ? <><Icon name="LoaderCircle" size={16} className="spin" /> Salvando...</> : <><Icon name="Save" size={17} /> Salvar dominio</>}
          </button>
          {form.id && <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setForm({ ...EMPTY_FORM, company_id: form.company_id })}>Novo dominio</button>}
        </div>
      </div>
    </div>
  );
}

function Empty({ icon, title, spin = false }) {
  return (
    <div className="empty">
      <div className="ei"><Icon name={icon} size={24} className={spin ? "spin" : ""} /></div>
      <div className="et">{title}</div>
    </div>
  );
}
