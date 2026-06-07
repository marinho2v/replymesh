import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { BRL, slugify } from "../../lib/utils.js";
import { api } from "../../services/api.js";

const EMPTY_FORM = {
  id: null,
  name: "",
  slug: "",
  price: "",
  billing_cycle: "monthly",
  description: "",
  features: "",
  status: "active",
};

function money(cents) {
  return BRL((cents || 0) / 100);
}

function formFromPlan(plan) {
  return {
    id: plan.id,
    name: plan.name || "",
    slug: plan.slug || "",
    price: String((plan.price_cents || 0) / 100),
    billing_cycle: plan.billing_cycle || "monthly",
    description: plan.description || "",
    features: (plan.features_json || []).join("\n"),
    status: plan.status || "active",
  };
}

function payloadFromForm(form) {
  const price = Number(String(form.price).replace(",", "."));
  return {
    plan: {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      price_cents: Math.round((Number.isFinite(price) ? price : 0) * 100),
      billing_cycle: form.billing_cycle,
      description: form.description.trim(),
      features_json: form.features.split("\n").map((item) => item.trim()).filter(Boolean),
      status: form.status,
    },
  };
}

export function Planos({ onToast }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    let active = true;

    api.getPlans()
      .then((data) => {
        if (active) setPlans(data.plans || []);
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

  const totals = useMemo(() => ({
    active: plans.filter((plan) => plan.status === "active").length,
    mrr: plans.reduce((sum, plan) => sum + (plan.mrr_cents || 0), 0),
    linked: plans.reduce((sum, plan) => sum + (plan.subscriptions_count || 0), 0),
  }), [plans]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      onToast?.("Informe o nome do plano", "err");
      return;
    }

    setSaving(true);

    try {
      const payload = payloadFromForm(form);
      const data = form.id ? await api.updatePlan(form.id, payload) : await api.createPlan(payload);
      setPlans((current) => {
        if (form.id) return current.map((plan) => (plan.id === form.id ? data.plan : plan));
        return [...current, data.plan].sort((a, b) => a.price_cents - b.price_cents);
      });
      setForm(EMPTY_FORM);
      onToast?.(`Plano "${data.plan.name}" salvo com sucesso`, "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">Planos</div>
          <div className="ps">Crie, edite e acompanhe os planos vendidos no Painel Master</div>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="card stat"><div className="top"><div className="si"><Icon name="Layers" size={19} /></div><div className="lab">Planos ativos</div></div><div className="val">{totals.active}</div><div className="delta flat">catalogo atual</div></div>
        <div className="card stat"><div className="top"><div className="si"><Icon name="Building2" size={19} /></div><div className="lab">Empresas vinculadas</div></div><div className="val">{totals.linked}</div><div className="delta flat">assinaturas totais</div></div>
        <div className="card stat"><div className="top"><div className="si"><Icon name="Wallet" size={19} /></div><div className="lab">MRR por planos</div></div><div className="val">{money(totals.mrr)}</div><div className="delta up">somente assinaturas ativas</div></div>
      </div>

      <div className="plans-layout">
        <div className="card">
          <div className="card-head">
            <div className="ct">Planos cadastrados</div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Plano</th><th>Valor</th><th>Status</th><th>Empresas</th><th>MRR</th><th style={{ textAlign: "right" }}>Acoes</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="6"><Empty icon="LoaderCircle" title="Carregando planos" spin /></td></tr>}
                {!loading && error && <tr><td colSpan="6"><Empty icon="CircleAlert" title={error} /></td></tr>}
                {!loading && !error && plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <div className="t">{plan.name}</div>
                      <div className="s mono">{plan.slug}</div>
                    </td>
                    <td className="mono">{plan.price_cents > 0 ? money(plan.price_cents) : "Sob consulta"}</td>
                    <td><Badge tone={plan.status === "active" ? "green" : "gray"}>{plan.status === "active" ? "Ativo" : "Inativo"}</Badge></td>
                    <td className="mono">{plan.subscriptions_count || 0}</td>
                    <td className="mono">{money(plan.mrr_cents)}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="ra" title="Editar" onClick={() => setForm(formFromPlan(plan))}><Icon name="Pencil" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && !error && plans.length === 0 && <tr><td colSpan="6"><Empty icon="Layers" title="Nenhum plano cadastrado" /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card card-pad plan-form-card">
          <div className="form-section-t">{form.id ? "Editar plano" : "Novo plano"}</div>
          <div className="form-section-s">Valores em reais, salvos no banco em centavos</div>

          <div className="field" style={{ marginTop: 14 }}>
            <label>Nome</label>
            <input value={form.name} onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({ ...current, name: value, slug: current.id ? current.slug : slugify(value) }));
            }} placeholder="Ex.: Profissional" />
          </div>
          <div className="field">
            <label>Slug</label>
            <input value={form.slug} onChange={(event) => set("slug", slugify(event.target.value))} placeholder="profissional" />
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label>Valor mensal</label>
              <input value={form.price} onChange={(event) => set("price", event.target.value)} placeholder="500" />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(event) => set("status", event.target.value)}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Descricao</label>
            <textarea value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Resumo do plano..." />
          </div>
          <div className="field">
            <label>Recursos <span className="hint">um por linha</span></label>
            <textarea value={form.features} onChange={(event) => set("features", event.target.value)} placeholder={"WhatsApp integrado\nCardapio digital\nSuporte"} />
          </div>

          <button className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} disabled={saving} onClick={save}>
            {saving ? <><Icon name="LoaderCircle" size={16} className="spin" /> Salvando...</> : <><Icon name="Save" size={17} /> Salvar plano</>}
          </button>
          {form.id && <button className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setForm(EMPTY_FORM)}>Novo plano</button>}
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
