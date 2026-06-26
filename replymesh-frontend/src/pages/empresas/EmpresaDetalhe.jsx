import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import {
  COMPANY_MODULE_PRESETS,
  CORE_MODULE_KEYS,
  MODULE_GROUP_LABELS,
  MODULE_PRESET_LABELS,
} from "../../config/companyModules.js";
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
  const [storeAiForm, setStoreAiForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureAccess, setFeatureAccess] = useState(null);
  const [moduleAccess, setModuleAccess] = useState(null);
  const [moduleCatalog, setModuleCatalog] = useState([]);
  const [savingModules, setSavingModules] = useState(false);
  const [savingFeature, setSavingFeature] = useState("");
  const [savingWhatsappMode, setSavingWhatsappMode] = useState(false);
  const [savingStoreAi, setSavingStoreAi] = useState(false);
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
    let alive = true;
    api.getMasterCompanyStoreSettings(id)
      .then((data) => {
        if (!alive) return;
        setStoreForm(data.settings);
      })
      .catch((error) => onToast?.(error.message, "err"));
    return () => { alive = false; };
  }, [id, onToast]);

  useEffect(() => {
    let alive = true;
    api.getMasterCompanyStoreAiSettings(id)
      .then((data) => {
        if (!alive) return;
        setStoreAiForm(data.settings);
      })
      .catch((error) => onToast?.(error.message, "err"));
    return () => { alive = false; };
  }, [id, onToast]);

  useEffect(() => {
    if (edit) return undefined;
    let alive = true;
    api.getCompanyFeatures(id)
      .then((data) => {
        if (!alive) return;
        setFeatureAccess(data.feature_access);
        setModuleAccess(data.module_access);
        setModuleCatalog(data.module_catalog || []);
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
        monthly_price_cents: form.monthly_price_cents,
        free_period_days: form.free_period_days,
        internal_note: form.internal_note,
        contract_type: form.contract_type,
      };
      const data = await api.updateCompany(id, { company: payload });
      if (storeForm) {
        await api.updateMasterCompanyStoreSettings(id, {
          settings: {
            store_name: storeForm.store_name,
            description: storeForm.description,
            phone: storeForm.phone,
            whatsapp: storeForm.whatsapp,
            whatsapp_mode: storeForm.whatsapp_mode || "automatic",
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

  const saveModules = async (moduleKeys, planBase, monthlyPriceCents, internalNote) => {
    setSavingModules(true);
    try {
      const updatedCompany = await api.updateCompany(id, {
        company: {
          monthly_price_cents: monthlyPriceCents,
          internal_note: internalNote,
        },
      });
      const data = await api.updateCompanyModules(id, {
        module_keys: moduleKeys,
        module_preset: planBase === "custom" ? null : planBase,
        internal_note: internalNote,
      });
      setCompany(updatedCompany.company);
      setForm((current) => ({
        ...current,
        monthly_price_cents: monthlyPriceCents,
        internal_note: internalNote,
      }));
      setFeatureAccess(data.feature_access);
      setModuleAccess(data.module_access);
      onToast?.("Módulos da empresa atualizados", "ok");
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setSavingModules(false);
    }
  };

  const changeWhatsappMode = async (mode) => {
    if (!storeForm) return;
    setSavingWhatsappMode(true);
    try {
      const data = await api.updateMasterCompanyStoreSettings(id, {
        settings: {
          ...storeForm,
          whatsapp_mode: mode,
        },
      });
      setStoreForm(data.settings);
      onToast?.("Modo WhatsApp atualizado com sucesso", "ok");
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setSavingWhatsappMode(false);
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

  const saveStoreAiSettings = async () => {
    if (!storeAiForm) return;

    setSavingStoreAi(true);
    try {
      const data = await api.updateMasterCompanyStoreAiSettings(id, {
        settings: {
          enabled: storeAiForm.enabled,
          ai_auto_reply_enabled: storeAiForm.ai_auto_reply_enabled,
          ai_provider: storeAiForm.ai_provider || "",
          ai_model: storeAiForm.ai_model || "",
          ai_mode: storeAiForm.ai_mode || "answers",
          ai_daily_message_limit: storeAiForm.ai_daily_message_limit,
          ai_monthly_message_limit: storeAiForm.ai_monthly_message_limit,
          ai_monthly_token_limit: storeAiForm.ai_monthly_token_limit,
        },
      });
      setStoreAiForm(data.settings);
      onToast?.("IA da loja atualizada com sucesso", "ok");
    } catch (error) {
      onToast?.(error.message || "Nao foi possivel salvar IA da loja", "err");
    } finally {
      setSavingStoreAi(false);
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
        <CoAvatar name={company.name} imageUrl={company.logo_url || company.store_settings?.logo_url} size={58} radius={13} />
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
            <Field label="Valor mensal em centavos" type="number" value={form.monthly_price_cents} onChange={(value) => setForm({ ...form, monthly_price_cents: value === "" ? null : Number(value) })} />
            <Field label="Período gratuito (dias)" type="number" value={form.free_period_days} onChange={(value) => setForm({ ...form, free_period_days: Number(value || 0) })} />
            <div className="field"><label>Tipo de contrato</label><select value={form.contract_type || "monthly"} onChange={(event) => setForm({ ...form, contract_type: event.target.value })}><option value="monthly">Mensal</option><option value="quarterly">Trimestral</option><option value="semiannual">Semestral</option><option value="annual">Anual</option><option value="custom">Personalizado</option></select></div>
            <div className="field full"><label>Observação interna</label><textarea value={form.internal_note || ""} onChange={(event) => setForm({ ...form, internal_note: event.target.value })} /></div>
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
              <div className="field">
                <label>Modo de envio WhatsApp</label>
                <select
                  value={storeForm.whatsapp_mode || "automatic"}
                  onChange={(event) => setStoreForm({ ...storeForm, whatsapp_mode: event.target.value })}
                >
                  <option value="automatic">Automatico com Replymesh Connect</option>
                  <option value="manual">Manual pelo WhatsApp Web/App</option>
                  <option value="disabled">WhatsApp desativado</option>
                </select>
                <span className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                  {(storeForm.whatsapp_mode || "automatic") === "manual"
                    ? "O atendente confere e envia as mensagens prontas manualmente."
                    : (storeForm.whatsapp_mode || "automatic") === "disabled"
                      ? "Nenhum envio WhatsApp sera preparado para esta empresa."
                      : "Mensagens, webhooks e conexao seguem pelo Replymesh Connect."}
                </span>
              </div>
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
        <div className="card card-pad">
          <div className="company-info-title"><Icon name="Bot" size={18} />IA da loja</div>
          {!storeAiForm ? (
            <p className="muted" style={{ marginTop: 12 }}>Carregando IA da loja...</p>
          ) : (
            <>
              <div className="form-grid" style={{ marginTop: 14 }}>
                <div className="field">
                  <label>IA ativa nesta empresa</label>
                  <select value={storeAiForm.enabled ? "true" : "false"} onChange={(event) => setStoreAiForm({ ...storeAiForm, enabled: event.target.value === "true" })}>
                    <option value="true">Ativa</option>
                    <option value="false">Desativada</option>
                  </select>
                </div>
                <div className="field">
                  <label>Responder automaticamente no WhatsApp</label>
                  <select value={storeAiForm.ai_auto_reply_enabled ? "true" : "false"} onChange={(event) => setStoreAiForm({ ...storeAiForm, ai_auto_reply_enabled: event.target.value === "true" })}>
                    <option value="true">Sim</option>
                    <option value="false">Nao</option>
                  </select>
                </div>
                <div className="field">
                  <label>Provider desta empresa</label>
                  <select value={storeAiForm.ai_provider || ""} onChange={(event) => setStoreAiForm({ ...storeAiForm, ai_provider: event.target.value })}>
                    <option value="">Usar padrao global ({providerLabel(storeAiForm.global?.provider)})</option>
                    <option value="groq">Groq</option>
                    <option value="anthropic">Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="disabled">Disabled</option>
                  </select>
                  <span className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    {storeAiForm.inherits_global_provider ? "Herdando provider global." : "Override ativo somente nesta empresa."}
                  </span>
                </div>
                <Field
                  label={`Modelo desta empresa${storeAiForm.inherits_global_model ? ` (global: ${storeAiForm.global?.model || "-"})` : ""}`}
                  value={storeAiForm.ai_model}
                  onChange={(value) => setStoreAiForm({ ...storeAiForm, ai_model: value })}
                />
                <div className="field">
                  <label>Nivel de automacao</label>
                  <select value={storeAiForm.ai_mode || "answers"} onChange={(event) => setStoreAiForm({ ...storeAiForm, ai_mode: event.target.value })}>
                    <option value="answers">Informacoes</option>
                    <option value="sales_assistant">Vendas Assistidas</option>
                    <option value="auto_seller">Vendas Automaticas (Beta)</option>
                  </select>
                </div>
                <Field label="Mensagens por dia" type="number" value={storeAiForm.ai_daily_message_limit} onChange={(value) => setStoreAiForm({ ...storeAiForm, ai_daily_message_limit: Number(value || 1) })} />
                <Field label="Mensagens por mes" type="number" value={storeAiForm.ai_monthly_message_limit} onChange={(value) => setStoreAiForm({ ...storeAiForm, ai_monthly_message_limit: Number(value || 1) })} />
                <Field label="Tokens por mes" type="number" value={storeAiForm.ai_monthly_token_limit} onChange={(value) => setStoreAiForm({ ...storeAiForm, ai_monthly_token_limit: Number(value || 1) })} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12, flexWrap: "wrap" }}>
                <p className="muted" style={{ margin: 0, fontSize: 12 }}>Chaves de API continuam somente em Configuracoes &gt; IA. A loja nunca visualiza provider/modelo.</p>
                <button className="btn btn-primary" type="button" onClick={saveStoreAiSettings} disabled={savingStoreAi}>
                  <Icon name={savingStoreAi ? "LoaderCircle" : "Save"} size={16} className={savingStoreAi ? "spin" : ""} />
                  {savingStoreAi ? "Salvando..." : "Salvar IA da loja"}
                </button>
              </div>
            </>
          )}
        </div>
      </> : <div className="company-detail-grid">
        <InfoCard icon="Building2" title="Empresa" items={[["Razao social", company.legal_name], ["Documento", company.document_number], ["Slug", company.slug], ["Cadastro", formatDate(company.created_at)]]} />
        <InfoCard icon="UserRound" title="Responsavel" items={[["Nome", company.responsible_name], ["Email", company.responsible_email], ["Telefone", company.responsible_phone], ["Usuarios", company.users_count]]} />
        <InfoCard icon="CreditCard" title="Assinatura" items={[["Plano", company.plan], ["Status", company.subscription_status || company.plan_status], ["Valor", company.monthly_price_cents != null ? `R$ ${(company.monthly_price_cents / 100).toFixed(2).replace(".", ",")}` : company.subscription_price_cents != null ? `R$ ${(company.subscription_price_cents / 100).toFixed(2).replace(".", ",")}` : "-"], ["Contrato", company.contract_type], ["Gratuidade", `${company.free_period_days || 0} dias`], ["Trial ate", formatDate(company.trial_ends_at)]]} />
        <InfoCard icon="Globe" title="Acesso" items={[["Dominio", company.primary_domain], ["Timezone", company.timezone], ["Idioma", company.default_locale], ["Atualizada", formatDate(company.updated_at)]]} />
        <WhatsappModeCard storeForm={storeForm} saving={savingWhatsappMode} onChange={changeWhatsappMode} />
        <ModuleCard
          moduleAccess={moduleAccess}
          catalog={moduleCatalog}
          saving={savingModules}
          monthlyPriceCents={form.monthly_price_cents}
          internalNote={form.internal_note}
          onSave={saveModules}
        />
        <FeatureCard featureAccess={featureAccess} savingFeature={savingFeature} onChange={changeFeatureMode} />
      </div>}
    </div>
  );
}

function ModuleCard({ moduleAccess, catalog, saving, monthlyPriceCents, internalNote, onSave }) {
  const [draft, setDraft] = useState(moduleAccess?.enabled || []);
  const [planBase, setPlanBase] = useState(moduleAccess?.preset || "custom");
  const [price, setPrice] = useState(monthlyPriceCents || 0);
  const [note, setNote] = useState(internalNote || "");

  useEffect(() => {
    setDraft(moduleAccess?.enabled || []);
    setPlanBase(moduleAccess?.preset || "custom");
  }, [moduleAccess]);
  useEffect(() => setPrice(monthlyPriceCents || 0), [monthlyPriceCents]);
  useEffect(() => setNote(internalNote || ""), [internalNote]);

  if (!moduleAccess) {
    return <section className="card card-pad company-info-card modules-panel"><div className="company-info-title"><Icon name="Blocks" size={18} />Plano e módulos</div><p className="muted">Carregando módulos...</p></section>;
  }

  const byKey = Object.fromEntries((catalog || []).map((item) => [item.key, item]));
  const groups = (catalog || []).reduce((result, item) => {
    result[item.group] ||= [];
    result[item.group].push(item);
    return result;
  }, {});
  const addWithDependencies = (key, current) => {
    const result = new Set(current);
    const visit = (moduleKey) => {
      result.add(moduleKey);
      (byKey[moduleKey]?.dependencies || []).forEach(visit);
    };
    visit(key);
    CORE_MODULE_KEYS.forEach((core) => result.add(core));
    return [...result];
  };
  const toggle = (item) => {
    if (item.core || item.essential) return;
    if (!draft.includes(item.key)) {
      setDraft(addWithDependencies(item.key, draft));
      setPlanBase("custom");
      return;
    }
    const dependents = (item.dependents || []).filter((key) => draft.includes(key));
    if (dependents.length) {
      const names = dependents.map((key) => byKey[key]?.label || key).join(", ");
      if (!window.confirm(`Este módulo é usado por: ${names}. Deseja desativar também esses recursos?`)) return;
    }
    setDraft(draft.filter((key) => key !== item.key && !dependents.includes(key)));
    setPlanBase("custom");
  };
  const applyPreset = (preset) => {
    setDraft(preset === "complete" ? (catalog || []).map((item) => item.key) : COMPANY_MODULE_PRESETS[preset]);
    setPlanBase(preset);
  };

  return (
    <section className="card card-pad company-info-card modules-panel">
      <div className="modules-head">
        <div><div className="company-info-title"><Icon name="Blocks" size={18} />Plano e módulos da empresa</div><p className="muted">Escolha uma base e personalize os recursos contratados por este cliente.</p></div>
        <span className={`module-plan-badge ${planBase}`}>{MODULE_PRESET_LABELS[planBase] || "Personalizado"}</span>
      </div>
      <div className="module-commercial-grid">
        <div className="field"><label>Plano base</label><select value={planBase} onChange={(event) => event.target.value === "custom" ? setPlanBase("custom") : applyPreset(event.target.value)}><option value="basic">Básico</option><option value="operation">Operação</option><option value="complete">Completo</option><option value="custom">Personalizado</option></select></div>
        <div className="field"><label>Valor mensal combinado</label><div className="money-input"><span>R$</span><input type="number" min="0" step="0.01" value={(Number(price || 0) / 100).toFixed(2)} onChange={(event) => setPrice(Math.round(Number(event.target.value || 0) * 100))} /></div></div>
        <div className="field module-note"><label>Observação interna</label><textarea rows="2" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Condições comerciais ou observações deste cliente." /></div>
      </div>
      <div className="module-quick-actions">
        <button className="btn btn-ghost" type="button" onClick={() => applyPreset("basic")}>Aplicar Básico</button>
        <button className="btn btn-ghost" type="button" onClick={() => applyPreset("operation")}>Aplicar Operação</button>
        <button className="btn btn-ghost" type="button" onClick={() => applyPreset("complete")}>Aplicar Completo</button>
        <button className="btn btn-ghost" type="button" onClick={() => { setDraft([...CORE_MODULE_KEYS]); setPlanBase("custom"); }}>Limpar opcionais</button>
        <span className="muted">{draft.length} módulos selecionados</span>
      </div>
      <div className="core-explanation"><Icon name="ShieldCheck" size={17} /><span>Dashboard, Produtos, Categorias, Pedidos e Checkout são obrigatórios para o funcionamento básico da loja.</span></div>
      <div className="module-groups">
        {Object.entries(groups).map(([group, items]) => <div className="module-group" key={group}>
          <h4>{MODULE_GROUP_LABELS[group] || group}</h4>
          <div className="module-grid">{items.map((item) => {
            const checked = draft.includes(item.key) || item.core;
            const dependencies = (item.dependencies || []).map((key) => byKey[key]?.label).filter(Boolean);
            return <label className={`module-option ${checked ? "active" : ""} ${item.core ? "core" : ""}`} key={item.key}>
              <input type="checkbox" checked={checked} disabled={saving || item.core} onChange={() => toggle(item)} />
              <span className="module-check"><Icon name={checked ? "Check" : "Plus"} size={14} /></span>
              <span className="module-copy"><strong>{item.label}</strong><small>{item.description}</small>{dependencies.length > 0 && <em>Depende de: {dependencies.join(", ")}</em>}</span>
              {item.core && <span className="module-core-badge">Obrigatório</span>}
            </label>;
          })}</div>
        </div>)}
      </div>
      <div className="module-save-row"><span className="muted">Alterações só entram em vigor ao salvar.</span><button className="btn btn-primary" type="button" disabled={saving} onClick={() => onSave(draft, planBase, price, note)}><Icon name={saving ? "LoaderCircle" : "Save"} size={16} className={saving ? "spin" : ""} />{saving ? "Salvando..." : "Salvar plano e módulos"}</button></div>
    </section>
  );
}

function WhatsappModeCard({ storeForm, saving, onChange }) {
  const mode = storeForm?.whatsapp_mode || "automatic";
  const modeText = mode === "manual"
    ? "Manual pelo WhatsApp Web/App"
    : mode === "disabled"
      ? "WhatsApp desativado"
      : "Automatico com Replymesh Connect";
  const description = mode === "manual"
    ? "A loja usa templates, mas o atendente confere e envia cada mensagem manualmente."
    : mode === "disabled"
      ? "A empresa nao prepara nem envia mensagens WhatsApp."
      : "A loja usa instancia/QR Code e envios automaticos pelo Replymesh Connect.";

  return (
    <section className="card card-pad company-info-card" style={{ gridColumn: "1 / -1" }}>
      <div className="company-info-title"><Icon name="MessageCircle" size={18} />WhatsApp da empresa</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(220px,320px)", gap: 12, alignItems: "end", marginTop: 10 }}>
        <div>
          <div className="company-info-row"><span>Modo atual</span><strong>{modeText}</strong></div>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>{description}</p>
          <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            O bloqueio em "WhatsApp basico" controla acesso ao modulo. Este seletor controla se a empresa usa automatico, manual ou desativado.
          </p>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Modo operacional</label>
          <select value={mode} disabled={!storeForm || saving} onChange={(event) => onChange(event.target.value)}>
            <option value="automatic">Automatico com Replymesh Connect</option>
            <option value="manual">Manual pelo WhatsApp Web/App</option>
            <option value="disabled">WhatsApp desativado</option>
          </select>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return <div className="field"><label>{label}</label><input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} /></div>;
}

function InfoCard({ icon, title, items }) {
  return <section className="card card-pad company-info-card"><div className="company-info-title"><Icon name={icon} size={18} />{title}</div>{items.map(([label, value]) => <div className="company-info-row" key={label}><span>{label}</span><strong>{value || "-"}</strong></div>)}</section>;
}

function FeatureCard({ featureAccess, savingFeature, onChange }) {
  const [open, setOpen] = useState(false);
  if (!featureAccess) {
    return <section className="card card-pad company-info-card"><div className="company-info-title"><Icon name="Lock" size={18} />Recursos</div><p className="muted">Carregando recursos...</p></section>;
  }

  const features = featureAccess.features || [];
  const overrides = Object.fromEntries((featureAccess.overrides || []).map((item) => [item.feature_key, item]));
  const inherited = featureAccess.inherited?.length || 0;
  const manualAllowed = featureAccess.manual_allowed?.length || 0;
  const manualBlocked = featureAccess.manual_blocked?.length || 0;

  return (
    <section className="card card-pad company-info-card advanced-access">
      <button className="advanced-access-trigger" type="button" onClick={() => setOpen((current) => !current)}>
        <span><span className="company-info-title"><Icon name="SlidersHorizontal" size={18} />Configurações avançadas de acesso</span><small>Ajustes finos para liberar, bloquear ou herdar recursos específicos. Use apenas quando precisar sobrescrever o plano da empresa.</small></span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={20} />
      </button>
      {open && <>
        <div className="advanced-summary">
          <span>Plano <strong>{featureAccess.plan?.name || "-"}</strong></span>
          <span>Herdados <strong>{inherited}</strong></span>
          <span>Liberados manualmente <strong>{manualAllowed}</strong></span>
          <span>Bloqueados manualmente <strong>{manualBlocked}</strong></span>
        </div>
        <div className="advanced-feature-grid">
          {features.map((feature) => <FeatureToggle key={feature.key} feature={feature} override={overrides[feature.key]} saving={savingFeature === feature.key} onChange={onChange} />)}
        </div>
      </>}
    </section>
  );
}

function FeatureToggle({ feature, override, saving, onChange }) {
  const mode = feature.source === "manual_allow" ? "allow" : feature.source === "manual_block" ? "block" : "default";
  const expiresAt = toInputDate(override?.expires_at);
  const core = CORE_MODULE_KEYS.includes(feature.key);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 9, padding: 11, display: "grid", gap: 9 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <strong style={{ display: "block", fontSize: 13 }}>{feature.label} {core && <span className="module-core-badge">Obrigatório</span>}</strong>
          <span className="muted" style={{ fontSize: 12 }}>{feature.enabled ? statusLabel(feature.source) : `Exige plano ${feature.required_plan_label}`}</span>
        </div>
        <select
          value={mode}
          disabled={saving || core}
          onChange={(event) => onChange(feature.key, event.target.value, expiresAt)}
          style={{ height: 32, border: "1px solid var(--border)", borderRadius: 8, padding: "0 8px", background: "#fff" }}
        >
          <option value="default">Herdar plano</option>
          <option value="allow">Liberar manual</option>
          {!core && <option value="block">Bloquear manual</option>}
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

function providerLabel(value) {
  return {
    groq: "Groq",
    anthropic: "Claude",
    claude: "Claude",
    openai: "OpenAI",
    disabled: "Disabled",
  }[value] || "-";
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
