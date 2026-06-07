import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Switch } from "../../components/ui/Switch.jsx";
import { api } from "../../services/api.js";

const EMPTY = {
  title: "",
  short_description: "",
  content: "",
  version: "",
  update_type: "improvement",
  status: "draft",
  audience_type: "all",
  company_id: "",
  plan_key: "",
  is_featured: false,
  published_at: "",
  icon: "Sparkles",
  color: "#8b5cf6",
  link_url: "",
  image_url: "",
};

const TYPE_LABELS = {
  news: "Novidade",
  improvement: "Melhoria",
  fix: "Correcao",
  warning: "Aviso",
  maintenance: "Manutencao",
};

export function SystemUpdates({ onToast }) {
  const [updates, setUpdates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [updatesResponse, companiesResponse, plansResponse] = await Promise.all([
        api.getSystemUpdates(),
        api.getCompanies(),
        api.getPlans(),
      ]);
      setUpdates(updatesResponse.system_updates || []);
      setCompanies(companiesResponse.companies || []);
      setPlans(plansResponse.plans || []);
    } catch (error) {
      onToast?.(error.message || "Nao foi possivel carregar atualizacoes", "err");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(() => ({
    total: updates.length,
    published: updates.filter((item) => item.status === "published").length,
    drafts: updates.filter((item) => item.status === "draft").length,
    featured: updates.filter((item) => item.is_featured).length,
  }), [updates]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({
      ...EMPTY,
      ...item,
      company_id: item.company_id || "",
      plan_key: item.plan_key || "",
      published_at: item.published_at ? item.published_at.slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        company_id: form.audience_type === "company" ? form.company_id : null,
        plan_key: form.audience_type === "plan" ? form.plan_key : null,
        published_at: form.published_at || null,
      };
      if (editingId) await api.updateSystemUpdate(editingId, payload);
      else await api.createSystemUpdate(payload);
      onToast?.(editingId ? "Atualizacao salva" : "Atualizacao criada", "ok");
      reset();
      await load();
    } catch (error) {
      onToast?.(error.message || "Nao foi possivel salvar", "err");
    } finally {
      setSaving(false);
    }
  };

  const action = async (item, kind) => {
    try {
      if (kind === "publish") await api.publishSystemUpdate(item.id);
      if (kind === "unpublish") await api.unpublishSystemUpdate(item.id);
      if (kind === "delete" && window.confirm(`Excluir "${item.title}"?`)) await api.deleteSystemUpdate(item.id);
      onToast?.("Atualizacao alterada", "ok");
      await load();
    } catch (error) {
      onToast?.(error.message || "Nao foi possivel alterar", "err");
    }
  };

  return (
    <div className="page system-updates-master">
      <div className="page-head">
        <div>
          <p className="eyebrow">Configuracoes</p>
          <h1>Atualizacoes do sistema</h1>
          <p className="muted">Publique novidades e avisos para todas as empresas ou para um publico especifico.</p>
        </div>
        <button className="btn" onClick={reset}><Icon name="Plus" size={16} /> Nova atualizacao</button>
      </div>

      <div className="update-stat-grid">
        {Object.entries(stats).map(([key, value]) => (
          <div className="update-stat" key={key}>
            <span>{key === "total" ? "Total" : key === "published" ? "Publicadas" : key === "drafts" ? "Rascunhos" : "Destaques"}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section className="card update-editor">
        <div className="section-head">
          <div><h2>{editingId ? "Editar atualizacao" : "Nova atualizacao"}</h2><p>Preencha um resumo claro para aparecer no sino e na central da loja.</p></div>
        </div>
        <div className="update-form-grid">
          <label className="field span-2"><span>Titulo</span><input value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label>
          <label className="field"><span>Versao</span><input placeholder="v1.5.14" value={form.version} onChange={(event) => updateField("version", event.target.value)} /></label>
          <label className="field"><span>Tipo</span><select value={form.update_type} onChange={(event) => updateField("update_type", event.target.value)}>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field span-2"><span>Descricao curta</span><input value={form.short_description} onChange={(event) => updateField("short_description", event.target.value)} /></label>
          <label className="field span-2"><span>Conteudo completo</span><textarea rows="6" value={form.content} onChange={(event) => updateField("content", event.target.value)} /></label>
          <label className="field"><span>Publico</span><select value={form.audience_type} onChange={(event) => updateField("audience_type", event.target.value)}><option value="all">Todas as empresas</option><option value="plan">Plano especifico</option><option value="company">Empresa especifica</option></select></label>
          {form.audience_type === "company" && <label className="field"><span>Empresa</span><select value={form.company_id} onChange={(event) => updateField("company_id", event.target.value)}><option value="">Selecione</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>}
          {form.audience_type === "plan" && <label className="field"><span>Plano</span><select value={form.plan_key} onChange={(event) => updateField("plan_key", event.target.value)}><option value="">Selecione</option>{plans.map((plan) => <option key={plan.id} value={plan.slug}>{plan.name}</option>)}</select></label>}
          <label className="field"><span>Status</span><select value={form.status} onChange={(event) => updateField("status", event.target.value)}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label>
          <label className="field"><span>Data de publicacao</span><input type="datetime-local" value={form.published_at} onChange={(event) => updateField("published_at", event.target.value)} /></label>
          <label className="field"><span>Cor</span><input type="color" value={form.color} onChange={(event) => updateField("color", event.target.value)} /></label>
          <label className="field"><span>Link opcional</span><input value={form.link_url} onChange={(event) => updateField("link_url", event.target.value)} /></label>
          <label className="field span-2"><span>Imagem opcional</span><input value={form.image_url} onChange={(event) => updateField("image_url", event.target.value)} /></label>
          <div className="field span-2 switch-field"><span>Marcar como destaque</span><Switch on={form.is_featured} onClick={() => updateField("is_featured", !form.is_featured)} /></div>
        </div>
        <div className="form-actions"><button className="btn" onClick={reset}>Cancelar</button><button className="btn primary" disabled={saving} onClick={save}><Icon name="Save" size={16} />{saving ? "Salvando..." : "Salvar atualizacao"}</button></div>
      </section>

      <section className="card">
        <div className="section-head"><div><h2>Historico de publicacoes</h2><p>{loading ? "Carregando..." : `${updates.length} atualizacoes cadastradas`}</p></div></div>
        <div className="update-master-list">
          {updates.map((item) => (
            <article className="update-master-row" key={item.id}>
              <span className="update-color" style={{ background: item.color || "#8b5cf6" }} />
              <div className="update-master-copy">
                <div><strong>{item.title}</strong><span className={`status-chip ${item.status}`}>{item.status === "published" ? "Publicado" : "Rascunho"}</span>{item.is_featured && <span className="status-chip featured">Destaque</span>}</div>
                <p>{item.short_description}</p>
                <small>{item.version} · {TYPE_LABELS[item.update_type]} · {item.audience_type === "all" ? "Todas as empresas" : item.company_name || item.plan_key}</small>
              </div>
              <div className="update-row-actions">
                <button className="icon-btn" title="Editar" onClick={() => edit(item)}><Icon name="Pencil" size={16} /></button>
                <button className="icon-btn" title={item.status === "published" ? "Despublicar" : "Publicar"} onClick={() => action(item, item.status === "published" ? "unpublish" : "publish")}><Icon name={item.status === "published" ? "EyeOff" : "Send"} size={16} /></button>
                <button className="icon-btn danger" title="Excluir" onClick={() => action(item, "delete")}><Icon name="Trash2" size={16} /></button>
              </div>
            </article>
          ))}
          {!loading && updates.length === 0 && <div className="empty-update"><Icon name="Megaphone" size={28} /><p>Nenhuma atualizacao cadastrada.</p></div>}
        </div>
      </section>
    </div>
  );
}
