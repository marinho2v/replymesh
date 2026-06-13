import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const STATUS_LABELS = {
  active: ["green", "Ativa"],
  inactive: ["gray", "Inativa"],
  trial: ["amber", "Em teste"],
  suspended: ["red", "Suspensa"],
  canceled: ["gray", "Cancelada"],
};

export function EmpresaDetalhe({ edit = false, onToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(null);
  const [storeForm, setStoreForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureAccess, setFeatureAccess] = useState(null);
  const [savingFeature, setSavingFeature] = useState("");
  const [adminPasswordForm, setAdminPasswordForm] = useState({ email: "", password: "" });
  const [savingAdminPassword, setSavingAdminPassword] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getCompany(id)
      .then((data) => {
        if (!alive) return;
        setCompany(data.company);
        setForm(data.company);
        setAdminPasswordForm({
          email: data.company?.admin_users?.[0]?.email || data.company?.responsible_email || "",
          password: "",
        });
      })
      .catch((error) => onToast?.(error.message, "err"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, onToast]);

  useEffect(() => {
    if (!edit) return undefined;
    let alive = true;
    api.getMasterCompanyStoreSettings(id)
      .then((data) => {
        if (!alive) return;
        setStoreForm(data.settings);
      })
      .catch((error) => onToast?.(error.message, "err"));
    return () => { alive = false; };
  }, [id, edit, onToast]);

  useEffect(() => {
    if (edit) return undefined;
    let alive = true;
    api.getCompanyFeatures(id)
      .then((data) => {
        if (!alive) return;
        setFeatureAccess(data.feature_access);
      })
      .catch(() => {
        if (alive) setFeatureAccess(null);
      });
    return () => { alive = false; };
  }, [id, edit]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        legal_name: form.legal_name,
        document_number: form.document_number,
        responsible_name: form.responsible_name,
        responsible_phone: form.responsible_phone,
        responsible_email: form.responsible_email,
        status: form.status,
        plan_status: form.plan_status,
        timezone: form.timezone,
        default_locale: form.default_locale,
      };
      const data = await api.updateCompany(id, { company: payload });
      if (storeForm) {
        await api.updateMasterCompanyStoreSettings(id, {
          settings: {
            store_name: storeForm.store_name,
            description: storeForm.description,
            phone: storeForm.phone,
            whatsapp: storeForm.whatsapp,
            logo_url: storeForm.logo_url,
            banner_url: storeForm.banner_url,
            cover_url: storeForm.cover_url,
            primary_color: storeForm.primary_color,
            secondary_color: storeForm.secondary_color,
            pix_key: storeForm.pix_key,
            pix_receiver_name: storeForm.pix_receiver_name,
            minimum_order_amount: storeForm.minimum_order_amount,
            estimated_delivery_minutes: storeForm.estimated_delivery_minutes,
            store_status: storeForm.store_status,
            pix_enabled: storeForm.pix_enabled,
          },
        });
      }
      setCompany(data.company);
      setForm(data.company);
      onToast?.("Empresa atualizada com sucesso", "ok");
      navigate(`/empresas/${id}`);
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const changeFeatureMode = async (featureKey, mode, expiresAt = null) => {
    setSavingFeature(featureKey);
    try {
      const data = await api.updateCompanyFeatures(id, [{ feature_key: featureKey, mode, expires_at: expiresAt || null }]);
      setFeatureAccess(data.feature_access);
      onToast?.("Recurso atualizado com sucesso", "ok");
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setSavingFeature("");
    }
  };

  const saveAdminPassword = async () => {
    const password = adminPasswordForm.password.trim();
    if (password.length < 8) {
      onToast?.("A senha deve ter pelo menos 8 caracteres", "err");
      return;
    }

    setSavingAdminPassword(true);
    try {
      await api.updateCompanyAdminPassword(id, {
        email: adminPasswordForm.email,
        password,
      });
      setAdminPasswordForm((current) => ({ ...current, password: "" }));
      onToast?.("Senha do admin da empresa atualizada com sucesso", "ok");
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setSavingAdminPassword(false);
    }
  };

  if (loading) return <div className="page"><div className="empty"><Icon name="LoaderCircle" className="spin" /> Carregando empresa...</div></div>;
  if (!company || !form) return <div className="page"><div className="empty"><div className="et">Empresa nao encontrada</div></div></div>;

  const status = STATUS_LABELS[company.status] || ["gray", company.status];

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <button className="link" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => navigate("/empresas")}><Icon name="ArrowLeft" size={15} /> Empresas</button>
          <div className="pt">{edit ? "Editar empresa" : company.name}</div>
          <div className="ps">{edit ? "Atualize os dados administrativos e o estado da conta." : "Visao administrativa da empresa no ecossistema Replymesh."}</div>
        </div>
        <div className="grow" />
        {edit ? <>
          <button className="btn btn-ghost" onClick={() => navigate(`/empresas/${id}`)}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}><Icon name="Save" size={16} /> {saving ? "Salvando..." : "Salvar alteracoes"}</button>
        </> : <button className="btn btn-primary" onClick={() => navigate(`/empresas/${id}/editar`)}><Icon name="Pencil" size={16} /> Editar empresa</button>}
      </div>

      {!edit && <div className="company-detail-hero card">
        <CoAvatar name={company.name} size={58} radius={13} />
        <div className="company-detail-main"><h2>{company.name}</h2><p>{company.primary_domain || `${company.slug}.replymesh.cloud`}</p></div>
        <Badge tone={status[0]}>{status[1]}</Badge>
      </div>}

      {edit ? <>
        <div className="card card-pad">
          <div className="form-grid">
            <Field label="Nome da empresa" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
            <Field label="Razao social" value={form.legal_name} onChange={(value) => setForm({ ...form, legal_name: value })} />
            <Field label="Documento" value={form.document_number} onChange={(value) => setForm({ ...form, document_number: value })} />
            <Field label="Responsavel" value={form.responsible_name} onChange={(value) => setForm({ ...form, responsible_name: value })} />
            <Field label="Email do responsavel" value={form.responsible_email} onChange={(value) => setForm({ ...form, responsible_email: value })} type="email" />
            <Field label="Telefone" value={form.responsible_phone} onChange={(value) => setForm({ ...form, responsible_phone: value })} />
            <div className="field"><label>Status da empresa</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Ativa</option><option value="inactive">Inativa</option><option value="trial">Em teste</option><option value="suspended">Suspensa</option><option value="canceled">Cancelada</option></select></div>
            <div className="field"><label>Status do plano</label><select value={form.plan_status} onChange={(event) => setForm({ ...form, plan_status: event.target.value })}><option value="trial">Trial</option><option value="active">Ativo</option><option value="overdue">Em atraso</option><option value="canceled">Cancelado</option><option value="suspended">Suspenso</option></select></div>
            <Field label="Fuso horario" value={form.timezone} onChange={(value) => setForm({ ...form, timezone: value })} />
            <Field label="Idioma padrao" value={form.default_locale} onChange={(value) => setForm({ ...form, default_locale: value })} />
          </div>
        </div>
        <div className="card card-pad">
          <div className="company-info-title"><Icon name="Palette" size={18} />Visual e loja publica</div>
          {!storeForm ? (
            <p className="muted" style={{ marginTop: 12 }}>Carregando configuracoes da loja...</p>
          ) : (
            <div className="form-grid" style={{ marginTop: 14 }}>
              <Field label="Nome publico da loja" value={storeForm.store_name} onChange={(value) => setStoreForm({ ...storeForm, store_name: value })} />
              <Field label="Descricao / chamada" value={storeForm.description} onChange={(value) => setStoreForm({ ...storeForm, description: value })} />
              <Field label="Telefone publico" value={storeForm.phone} onChange={(value) => setStoreForm({ ...storeForm, phone: value })} />
              <Field label="WhatsApp publico" value={storeForm.whatsapp} onChange={(value) => setStoreForm({ ...storeForm, whatsapp: value })} />
              <Field label="Logo URL" value={storeForm.logo_url} onChange={(value) => setStoreForm({ ...storeForm, logo_url: value })} />
              <Field label="Banner URL" value={storeForm.banner_url} onChange={(value) => setStoreForm({ ...storeForm, banner_url: value })} />
              <Field label="Capa URL" value={storeForm.cover_url} onChange={(value) => setStoreForm({ ...storeForm, cover_url: value })} />
              <Field label="Cor principal" value={storeForm.primary_color} onChange={(value) => setStoreForm({ ...storeForm, primary_color: value })} />
              <Field label="Cor secundaria" value={storeForm.secondary_color} onChange={(value) => setStoreForm({ ...storeForm, secondary_color: value })} />
              <Field label="Chave PIX" value={storeForm.pix_key} onChange={(value) => setStoreForm({ ...storeForm, pix_key: value })} />
              <Field label="Nome recebedor PIX" value={storeForm.pix_receiver_name} onChange={(value) => setStoreForm({ ...storeForm, pix_receiver_name: value })} />
              <Field label="Pedido minimo" value={storeForm.minimum_order_amount} onChange={(value) => setStoreForm({ ...storeForm, minimum_order_amount: value })} />
              <Field label="Tempo de entrega em minutos" value={storeForm.estimated_delivery_minutes} onChange={(value) => setStoreForm({ ...storeForm, estimated_delivery_minutes: value })} />
              <div className="field">
                <label>Status da loja</label>
                <select value={storeForm.store_status || "open"} onChange={(event) => setStoreForm({ ...storeForm, store_status: event.target.value })}>
                  <option value="open">Aberta</option>
                  <option value="closed">Fechada</option>
                  <option value="paused">Pausada</option>
                </select>
              </div>
              <div className="field">
                <label>PIX ativo</label>
                <select value={storeForm.pix_enabled ? "true" : "false"} onChange={(event) => setStoreForm({ ...storeForm, pix_enabled: event.target.value === "true" })}>
                  <option value="true">Sim</option>
                  <option value="false">Nao</option>
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="card card-pad">
          <div className="company-info-title"><Icon name="KeyRound" size={18} />Redefinir senha do admin da loja</div>
          <div className="form-grid" style={{ marginTop: 14 }}>
            <div className="field">
              <label>Admin da empresa</label>
              {company.admin_users?.length ? (
                <select value={adminPasswordForm.email} onChange={(event) => setAdminPasswordForm({ ...adminPasswordForm, email: event.target.value })}>
                  {company.admin_users.map((user) => <option key={user.id || user.email} value={user.email}>{user.name || user.email} - {user.email}</option>)}
                </select>
              ) : (
                <input type="email" value={adminPasswordForm.email} onChange={(event) => setAdminPasswordForm({ ...adminPasswordForm, email: event.target.value })} placeholder="admin@empresa.com" />
              )}
            </div>
            <Field label="Nova senha" type="password" value={adminPasswordForm.password} onChange={(value) => setAdminPasswordForm({ ...adminPasswordForm, password: value })} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={saveAdminPassword} disabled={savingAdminPassword || !adminPasswordForm.password}>
              <Icon name={savingAdminPassword ? "LoaderCircle" : "KeyRound"} size={16} className={savingAdminPassword ? "spin" : ""} />
              {savingAdminPassword ? "Atualizando..." : "Atualizar senha"}
            </button>
          </div>
        </div>
      </> : <div className="company-detail-grid">
        <InfoCard icon="Building2" title="Empresa" items={[["Razao social", company.legal_name], ["Documento", company.document_number], ["Slug", company.slug], ["Cadastro", formatDate(company.created_at)]]} />
        <InfoCard icon="UserRound" title="Responsavel" items={[["Nome", company.responsible_name], ["Email", company.responsible_email], ["Telefone", company.responsible_phone], ["Usuarios", company.users_count]]} />
        <InfoCard icon="CreditCard" title="Assinatura" items={[["Plano", company.plan], ["Status", company.subscription_status || company.plan_status], ["Valor", company.subscription_price_cents != null ? `R$ ${(company.subscription_price_cents / 100).toFixed(2).replace(".", ",")}` : "-"], ["Trial ate", formatDate(company.trial_ends_at)]]} />
        <InfoCard icon="Globe" title="Acesso" items={[["Dominio", company.primary_domain], ["Timezone", company.timezone], ["Idioma", company.default_locale], ["Atualizada", formatDate(company.updated_at)]]} />
        <FeatureCard featureAccess={featureAccess} savingFeature={savingFeature} onChange={changeFeatureMode} />
      </div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return <div className="field"><label>{label}</label><input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} /></div>;
}

function InfoCard({ icon, title, items }) {
  return <section className="card card-pad company-info-card"><div className="company-info-title"><Icon name={icon} size={18} />{title}</div>{items.map(([label, value]) => <div className="company-info-row" key={label}><span>{label}</span><strong>{value || "-"}</strong></div>)}</section>;
}

function FeatureCard({ featureAccess, savingFeature, onChange }) {
  if (!featureAccess) {
    return <section className="card card-pad company-info-card"><div className="company-info-title"><Icon name="Lock" size={18} />Recursos</div><p className="muted">Carregando recursos...</p></section>;
  }

  const features = featureAccess.features || [];
  const overrides = Object.fromEntries((featureAccess.overrides || []).map((item) => [item.feature_key, item]));
  const inherited = featureAccess.inherited?.length || 0;
  const manualAllowed = featureAccess.manual_allowed?.length || 0;
  const manualBlocked = featureAccess.manual_blocked?.length || 0;

  return (
    <section className="card card-pad company-info-card" style={{ gridColumn: "1 / -1" }}>
      <div className="company-info-title"><Icon name="Lock" size={18} />Plano e Recursos</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 8 }}>
        <div className="company-info-row"><span>Plano atual</span><strong>{featureAccess.plan?.name || "-"}</strong></div>
        <div className="company-info-row"><span>Status</span><strong>{featureAccess.subscription_status || "-"}</strong></div>
        <div className="company-info-row"><span>Herdados do plano</span><strong>{inherited}</strong></div>
        <div className="company-info-row"><span>Extras liberados</span><strong>{manualAllowed}</strong></div>
        <div className="company-info-row"><span>Bloqueados</span><strong>{manualBlocked}</strong></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 10, marginTop: 14 }}>
        {features.map((feature) => (
          <FeatureToggle
            key={feature.key}
            feature={feature}
            override={overrides[feature.key]}
            saving={savingFeature === feature.key}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

function FeatureToggle({ feature, override, saving, onChange }) {
  const mode = feature.source === "manual_allow" ? "allow" : feature.source === "manual_block" ? "block" : "default";
  const expiresAt = toInputDate(override?.expires_at);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 9, padding: 11, display: "grid", gap: 9 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div>
              <strong style={{ display: "block", fontSize: 13 }}>{feature.label}</strong>
          <span className="muted" style={{ fontSize: 12 }}>{feature.enabled ? statusLabel(feature.source) : `Exige plano ${feature.required_plan_label}`}</span>
        </div>
        <select
          value={mode}
          disabled={saving}
          onChange={(event) => onChange(feature.key, event.target.value, expiresAt)}
          style={{ height: 32, border: "1px solid var(--border)", borderRadius: 8, padding: "0 8px", background: "#fff" }}
        >
          <option value="default">Herdar plano</option>
          <option value="allow">Liberar manual</option>
          <option value="block">Bloquear manual</option>
        </select>
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Expira em</label>
        <input
          type="date"
          value={expiresAt}
          disabled={saving || mode === "block"}
          onChange={(event) => onChange(feature.key, mode === "default" ? "allow" : mode, event.target.value)}
        />
      </div>
      {override?.expired && <span className="status-chip red">Liberacao expirada</span>}
    </div>
  );
}

function statusLabel(source) {
  if (source === "manual_allow") return "Liberado manualmente";
  if (source === "manual_block") return "Bloqueado manualmente";
  return "Herdado do plano";
}

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
