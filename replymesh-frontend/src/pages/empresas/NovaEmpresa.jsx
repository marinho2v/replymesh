import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { Switch } from "../../components/ui/Switch.jsx";
import { PLATFORM_URLS, RESERVED_SLUGS } from "../../config/platform.js";
import { slugify } from "../../lib/utils.js";
import { api } from "../../services/api.js";

  const PLANS = [
    { id: "start", label: "START", price: "R$ 299/mes", desc: "Cardapio, pedidos, WhatsApp basico, caixa e gestao inicial" },
    { id: "pro", label: "PRO", price: "R$ 499/mes", desc: "START + IA, automacoes, cupons, roleta, estoque, salao e relatorios avancados" },
  ];

const PLAN_BADGE = {
    start: "blue",
    pro: "green",
};

const STATUS_BADGE = {
  trial: ["amber", "Em teste"],
  active: ["green", "Ativa"],
  inactive: ["gray", "Inativa"],
};

export function NovaEmpresa({ onToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    slugTouched: false,
    adminName: "",
    email: "",
    phone: "",
    doc: "",
    adminPassword: "admin123456",
    plan: "start",
    status: "trial",
    whatsapp: false,
    customDomain: false,
    domain: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const computedSlug = form.slugTouched ? form.slug : slugify(form.name);
  const currentPlan = PLANS.find((plan) => plan.id === form.plan) || PLANS[0];

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Informe o nome da empresa";
    if (!computedSlug) next.slug = "Subdominio obrigatorio";
    else if (RESERVED_SLUGS.has(computedSlug)) next.slug = "Subdominio reservado para infraestrutura";
    if (!form.adminName.trim()) next.adminName = "Informe o nome do administrador";
    if (!form.email.trim()) next.email = "Informe o e-mail do administrador";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "E-mail invalido";
    if (!form.phone.trim()) next.phone = "Informe o telefone";
    if (!form.adminPassword.trim() || form.adminPassword.length < 8) next.adminPassword = "Use pelo menos 8 caracteres";
    if (form.customDomain && !form.domain.trim()) next.domain = "Informe o dominio personalizado";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      onToast?.("Verifique os campos destacados", "err");
      return;
    }

    setSubmitting(true);

    try {
      await api.createCompany({
        company: {
          name: form.name.trim(),
          slug: computedSlug,
          legal_name: form.name.trim(),
          document_number: form.doc.trim(),
          responsible_name: form.adminName.trim(),
          responsible_email: form.email.trim(),
          responsible_phone: form.phone.trim(),
          plan_slug: form.plan,
          status: form.status,
          plan_status: form.status === "active" ? "active" : "trial",
          admin_password: form.adminPassword,
          custom_domain: form.customDomain ? form.domain.trim() : "",
        },
        options: {
          create_whatsapp_instance: form.whatsapp,
          create_default_settings: true,
          create_default_templates: true,
          create_default_payment_methods: true,
        },
      });

      onToast?.(`Empresa "${form.name}" criada com sucesso`, "ok");
      navigate("/empresas");
    } catch (err) {
      onToast?.(err.message, "err");
      setErrors((current) => ({ ...current, submit: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page fade-up" style={{ maxWidth: 980 }}>
      <div className="page-head">
        <div>
          <button className="link" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => navigate("/empresas")}>
            <Icon name="ArrowLeft" size={15} /> Empresas
          </button>
          <div className="pt">Nova Empresa</div>
          <div className="ps">Cadastre uma nova conta e configure plano, acesso e dominio</div>
        </div>
      </div>

      <div className="nova-empresa-layout" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card card-pad">
            <div style={{ marginBottom: 18 }}>
              <div className="form-section-t">Dados da empresa</div>
              <div className="form-section-s">Informacoes basicas e endereco da conta na plataforma</div>
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Nome da empresa</label>
                <input className={errors.name ? "err" : ""} placeholder="Ex.: Pizzaria do Joao" value={form.name} onChange={(event) => set("name", event.target.value)} />
                {errors.name && <div className="errmsg"><Icon name="CircleAlert" size={13} /> {errors.name}</div>}
              </div>
              <div className="field">
                <label>Subdominio <span className="hint">replymesh.cloud</span></label>
                <div className="pre">
                  <input
                    className={errors.slug ? "err" : ""}
                    placeholder="minhaempresa"
                    value={computedSlug}
                    onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value), slugTouched: true }))}
                  />
                  <div className="suf mono">{PLATFORM_URLS.subdomainSuffix}</div>
                </div>
                {errors.slug && <div className="errmsg"><Icon name="CircleAlert" size={13} /> {errors.slug}</div>}
                <div className="hint" style={{ marginTop: 7 }}>
                  Esse sera o endereco padrao da loja. Depois voce podera configurar um dominio proprio.
                </div>
              </div>
              <div className="field">
                <label>CNPJ / CPF <span className="hint">opcional</span></label>
                <input placeholder="00.000.000/0000-00" value={form.doc} onChange={(event) => set("doc", event.target.value)} />
              </div>
              <div className="field">
                <label>Telefone</label>
                <input className={errors.phone ? "err" : ""} placeholder="(11) 90000-0000" value={form.phone} onChange={(event) => set("phone", event.target.value)} />
                {errors.phone && <div className="errmsg"><Icon name="CircleAlert" size={13} /> {errors.phone}</div>}
              </div>
              <div className="field">
                <label>Nome do administrador</label>
                <input className={errors.adminName ? "err" : ""} placeholder="Maria Silva" value={form.adminName} onChange={(event) => set("adminName", event.target.value)} />
                {errors.adminName && <div className="errmsg"><Icon name="CircleAlert" size={13} /> {errors.adminName}</div>}
              </div>
              <div className="field">
                <label>E-mail do administrador</label>
                <input className={errors.email ? "err" : ""} placeholder="admin@empresa.com.br" type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
                {errors.email && <div className="errmsg"><Icon name="CircleAlert" size={13} /> {errors.email}</div>}
              </div>
              <div className="field full">
                <label>Senha inicial</label>
                <input className={errors.adminPassword ? "err" : ""} type="password" value={form.adminPassword} onChange={(event) => set("adminPassword", event.target.value)} />
                {errors.adminPassword && <div className="errmsg"><Icon name="CircleAlert" size={13} /> {errors.adminPassword}</div>}
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ marginBottom: 16 }}>
              <div className="form-section-t">Plano de assinatura</div>
              <div className="form-section-s">Defina o plano inicial da empresa</div>
            </div>
            <div className="seg">
              {PLANS.map((plan) => (
                <div key={plan.id} className={`seg-opt${form.plan === plan.id ? " sel" : ""}`} onClick={() => set("plan", plan.id)}>
                  <div className="so-t">{plan.label}{form.plan === plan.id && <Icon name="Check" size={16} />}</div>
                  <div className="so-s">{plan.price}</div>
                  <div className="so-s" style={{ marginTop: 6 }}>{plan.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div style={{ marginBottom: 6 }}>
              <div className="form-section-t">Configuracoes iniciais</div>
              <div className="form-section-s">Recursos provisionados na criacao da conta</div>
            </div>
            <div className="toggle-row">
              <div className="tr-m">
                <div className="tr-t">Provisionar instancia WhatsApp</div>
                <div className="tr-s">Cria automaticamente uma instancia para conexao</div>
              </div>
              <Switch on={form.whatsapp} onClick={() => set("whatsapp", !form.whatsapp)} />
            </div>
            <div className="toggle-row">
              <div className="tr-m">
                <div className="tr-t">Dominio personalizado</div>
                <div className="tr-s">Usar um dominio proprio em vez do subdominio padrao</div>
              </div>
              <Switch on={form.customDomain} onClick={() => set("customDomain", !form.customDomain)} />
            </div>
            {form.customDomain && (
              <div className="field" style={{ marginTop: 14 }}>
                <label>Dominio personalizado</label>
                <input className={errors.domain ? "err" : ""} placeholder="pedidos.minhaempresa.com.br" value={form.domain} onChange={(event) => set("domain", event.target.value)} />
                {errors.domain && <div className="errmsg"><Icon name="CircleAlert" size={13} /> {errors.domain}</div>}
              </div>
            )}
            <div className="field" style={{ marginTop: 14 }}>
              <label>Observacoes <span className="hint">opcional</span></label>
              <textarea placeholder="Notas internas sobre a conta..." value={form.notes} onChange={(event) => set("notes", event.target.value)} />
            </div>
            {errors.submit && <div className="login-error" style={{ marginTop: 14 }}><Icon name="CircleAlert" size={14} /> {errors.submit}</div>}
          </div>
        </div>

        <div className="card card-pad nova-empresa-summary" style={{ position: "sticky", top: 88 }}>
          <div className="form-section-t" style={{ marginBottom: 14 }}>Resumo</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <CoAvatar name={form.name || "Nova Empresa"} size={42} radius={11} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 650, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{form.name || "Nova empresa"}</div>
              <div className="mono muted" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(computedSlug || "minhaempresa")}{PLATFORM_URLS.subdomainSuffix}</div>
            </div>
          </div>
          <div className="divider" style={{ margin: "4px 0 14px" }} />
          <SummaryRow label="Plano" value={<Badge tone={PLAN_BADGE[form.plan]} dot={false}>{currentPlan.label}</Badge>} />
          <SummaryRow label="Status inicial" value={<Badge tone={STATUS_BADGE[form.status][0]}>{STATUS_BADGE[form.status][1]}</Badge>} />
          <SummaryRow label="WhatsApp" value={form.whatsapp ? "1 instancia" : "-"} />
          <SummaryRow label="Dominio" value={form.customDomain ? "Personalizado" : "Subdominio"} />
          <div className="field" style={{ marginTop: 12 }}>
            <label>Status inicial</label>
            <select value={form.status} onChange={(event) => set("status", event.target.value)} style={{ height: 42 }}>
              <option value="trial">Em teste (trial 14 dias)</option>
              <option value="active">Ativa</option>
              <option value="inactive">Inativa</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={submitting} onClick={submit}>
            {submitting ? <><Icon name="LoaderCircle" size={16} className="spin" /> Criando...</> : <><Icon name="Check" size={17} /> Criar empresa</>}
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} disabled={submitting} onClick={() => navigate("/empresas")}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", fontSize: 13 }}>
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 550 }}>{value}</span>
    </div>
  );
}
