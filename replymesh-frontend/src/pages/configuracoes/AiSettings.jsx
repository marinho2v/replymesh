import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Switch } from "../../components/ui/Switch.jsx";
import { api } from "../../services/api.js";

const EMPTY = {
  enabled: false,
  provider: "claude",
  model: "claude-haiku-4-5-20251001",
  api_key: "",
  assistant_name: "Carina",
  assistant_avatar_url: "",
  initial_message: "Oi! Eu sou a Carina, assistente da Replymesh. Posso ajudar voce a usar o sistema.",
  base_prompt: "",
  assistant_tone: "simpatico, objetivo e didatico",
  daily_company_limit: 100,
  per_minute_user_limit: 8,
};

export function AiSettings({ onToast }) {
  const [form, setForm] = useState(EMPTY);
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testAnswer, setTestAnswer] = useState("");
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const [response, usageResponse] = await Promise.all([
          api.getAiSettings(),
          api.getAiUsage(),
        ]);
        const settings = response.settings || {};
        if (!alive) return;
        setForm({
          ...EMPTY,
          ...settings,
          api_key: "",
        });
        setApiKeyMasked(settings.api_key_masked || "");
        setApiKeyConfigured(!!settings.api_key_configured);
        setUsage(usageResponse.usage || null);
      } catch (error) {
        if (alive) onToast?.(error.message || "Nao foi possivel carregar IA", "err");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [onToast]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled: form.enabled,
        provider: form.provider,
        model: form.model,
        api_key: form.api_key,
        assistant_name: form.assistant_name,
        assistant_avatar_url: form.assistant_avatar_url,
        initial_message: form.initial_message,
        base_prompt: form.base_prompt,
        assistant_tone: form.assistant_tone,
        daily_company_limit: form.daily_company_limit,
        per_minute_user_limit: form.per_minute_user_limit,
      };
      if (!payload.api_key.trim()) delete payload.api_key;
      const response = await api.updateAiSettings(payload);
      const settings = response.settings || {};
      setForm({ ...EMPTY, ...settings, api_key: "" });
      setApiKeyMasked(settings.api_key_masked || "");
      setApiKeyConfigured(!!settings.api_key_configured);
      onToast?.("Configuracoes de IA salvas", "ok");
    } catch (error) {
      onToast?.(error.message || "Nao foi possivel salvar IA", "err");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestAnswer("");
    try {
      const response = await api.testAiConnection("Como cadastro um produto?");
      setTestAnswer(response.answer || "Conexao OK");
      onToast?.("Teste Claude concluido", "ok");
    } catch (error) {
      setTestAnswer(error.message || "Nao foi possivel testar a IA");
      onToast?.(error.message || "Nao foi possivel testar a IA", "err");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="page-stub">Carregando IA...</div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Configurações</p>
          <h1>IA / Carina</h1>
          <p className="muted">Assistente oficial da Replymesh para orientar donos, administradores e atendentes.</p>
        </div>
        <button className="btn primary" onClick={save} disabled={saving}>
          <Icon name="Save" size={16} />
          {saving ? "Salvando..." : "Salvar IA"}
        </button>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-title">
            <Icon name="Bot" size={18} />
            Configuração global
          </div>

          <div className="form-grid">
            <label className="field switch-row">
              <span>
                <b>IA ativa globalmente</b>
                <small>Quando ativa, o botão da Carina aparece automaticamente nos painéis das lojas.</small>
              </span>
              <Switch on={form.enabled} onClick={() => update("enabled", !form.enabled)} />
            </label>

            <label className="field">
              <span>Provider</span>
              <select value={form.provider} onChange={(event) => update("provider", event.target.value)}>
                <option value="claude">Claude</option>
              </select>
            </label>

            <label className="field">
              <span>Modelo Claude</span>
              <input value={form.model} onChange={(event) => update("model", event.target.value)} />
            </label>

            <label className="field">
              <span>Claude API Key</span>
              <input
                type="password"
                value={form.api_key}
                onChange={(event) => update("api_key", event.target.value)}
                placeholder={apiKeyConfigured ? apiKeyMasked : "Cole a chave aqui"}
              />
              <small>{apiKeyConfigured ? `Configurada: ${apiKeyMasked}` : "A chave fica somente no backend."}</small>
            </label>

            <label className="field">
              <span>Limite diario por loja</span>
              <input type="number" min="1" value={form.daily_company_limit} onChange={(event) => update("daily_company_limit", Number(event.target.value))} />
            </label>

            <label className="field">
              <span>Limite por usuario/minuto</span>
              <input type="number" min="1" value={form.per_minute_user_limit} onChange={(event) => update("per_minute_user_limit", Number(event.target.value))} />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <Icon name="Sparkles" size={18} />
            Aparência da Carina
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Nome da assistente</span>
              <input value={form.assistant_name} onChange={(event) => update("assistant_name", event.target.value)} />
            </label>

            <label className="field">
              <span>Avatar URL</span>
              <input value={form.assistant_avatar_url || ""} onChange={(event) => update("assistant_avatar_url", event.target.value)} />
            </label>

            <label className="field full">
              <span>Mensagem inicial</span>
              <textarea rows="3" value={form.initial_message} onChange={(event) => update("initial_message", event.target.value)} />
            </label>

            <label className="field full">
              <span>Tom da assistente</span>
              <input value={form.assistant_tone || ""} onChange={(event) => update("assistant_tone", event.target.value)} />
            </label>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-title">Prompt base</div>
        <label className="field">
          <textarea rows="7" value={form.base_prompt || ""} onChange={(event) => update("base_prompt", event.target.value)} />
        </label>
      </section>

      <section className="panel">
        <div className="panel-title">
          <Icon name="BarChart3" size={18} />
          Metricas Globais da IA
        </div>
        <p className="muted">Dados tecnicos visiveis somente para o Painel Master.</p>

        <div className="ai-usage-columns">
          {[
            ["Carina", usage?.carina],
            ["IA das Lojas", usage?.store_ai],
          ].map(([title, metrics]) => (
            <div className="ai-usage-group" key={title}>
              <h3>{title}</h3>
              <div className="ai-usage-grid">
                <span>Mensagens hoje <strong>{metrics?.messages_today || 0}</strong></span>
                <span>Mensagens mes <strong>{metrics?.messages_month || 0}</strong></span>
                <span>Tokens hoje <strong>{metrics?.tokens_today || 0}</strong></span>
                <span>Tokens mes <strong>{metrics?.tokens_month || 0}</strong></span>
                <span>Custo hoje <strong>US$ {Number(metrics?.cost_today || 0).toFixed(4)}</strong></span>
                <span>Custo mes <strong>US$ {Number(metrics?.cost_month || 0).toFixed(4)}</strong></span>
                <span>Tempo medio <strong>{metrics?.average_response_time_ms || 0} ms</strong></span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          <div className="ai-ranking">
            <h3>Empresas com maior uso</h3>
            {(usage?.top_companies || []).map((company) => (
              <div key={company.company_id}><span>{company.company_name}</span><strong>{company.messages}</strong></div>
            ))}
            {!usage?.top_companies?.length && <p className="muted">Sem uso registrado.</p>}
          </div>
          <div className="ai-ranking">
            <h3>Top usuarios</h3>
            {(usage?.top_users || []).map((user) => (
              <div key={user.user_id}><span>{user.user_name}</span><strong>{user.messages}</strong></div>
            ))}
            {!usage?.top_users?.length && <p className="muted">Sem uso registrado.</p>}
          </div>
        </div>

        <div className="ai-ranking">
          <h3>Modelos utilizados</h3>
          {(usage?.models || []).map((item) => (
            <div key={`${item.assistant_type}-${item.model}`}>
              <span>{item.assistant_type === "carina" ? "Carina" : "IA das Lojas"} - {item.model || "modelo padrao"}</span>
              <strong>{item.messages}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">Teste de conexão</div>
        <p className="muted">Testa a chamada do backend para o Claude sem expor a chave no frontend.</p>
        <button className="btn" onClick={test} disabled={testing}>
          <Icon name="Send" size={16} />
          {testing ? "Testando..." : "Testar Claude"}
        </button>
        {testAnswer && <div className="notice info">{testAnswer}</div>}
      </section>
    </div>
  );
}
