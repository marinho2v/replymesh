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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getCompany(id)
      .then((data) => {
        if (!alive) return;
        setCompany(data.company);
        setForm(data.company);
      })
      .catch((error) => onToast?.(error.message, "err"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, onToast]);

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

      {edit ? <div className="card card-pad">
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
      </div> : <div className="company-detail-grid">
        <InfoCard icon="Building2" title="Empresa" items={[["Razao social", company.legal_name], ["Documento", company.document_number], ["Slug", company.slug], ["Cadastro", formatDate(company.created_at)]]} />
        <InfoCard icon="UserRound" title="Responsavel" items={[["Nome", company.responsible_name], ["Email", company.responsible_email], ["Telefone", company.responsible_phone], ["Usuarios", company.users_count]]} />
        <InfoCard icon="CreditCard" title="Assinatura" items={[["Plano", company.plan], ["Status", company.subscription_status || company.plan_status], ["Valor", company.subscription_price_cents != null ? `R$ ${(company.subscription_price_cents / 100).toFixed(2).replace(".", ",")}` : "-"], ["Trial ate", formatDate(company.trial_ends_at)]]} />
        <InfoCard icon="Globe" title="Acesso" items={[["Dominio", company.primary_domain], ["Timezone", company.timezone], ["Idioma", company.default_locale], ["Atualizada", formatDate(company.updated_at)]]} />
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

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
