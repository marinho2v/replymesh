import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { Switch } from "../../components/ui/Switch.jsx";
import { api } from "../../services/api.js";

const STORE_AI_DEFAULTS = {
  enabled: false,
  provider: "groq",
  model: "llama-3.1-8b-instant",
  groq_api_key: "",
  claude_api_key: "",
  openai_api_key: "",
  groq_api_key_configured: false,
  groq_api_key_masked: "",
  claude_api_key_configured: false,
  claude_api_key_masked: "",
  openai_api_key_configured: false,
  openai_api_key_masked: "",
  daily_message_limit: 100,
  monthly_message_limit: 3000,
  monthly_token_limit: 300000,
  timeout_seconds: 30,
  max_context_products: 8,
  handoff_attempts: 2,
};

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
  store_ai: STORE_AI_DEFAULTS,
};

const STORE_PROVIDERS = [
  ["groq", "Groq"],
  ["anthropic", "Claude"],
  ["openai", "OpenAI"],
  ["disabled", "Disabled"],
];

export function AiSettings({ onToast }) {
  const [form, setForm] = useState(EMPTY);
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");
  const [testAnswer, setTestAnswer] = useState("");
  const [usage, setUsage] = useState(null);
  const [activeTab, setActiveTab] = useState("store_ai");

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
        setForm(normalizeSettings(settings));
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
  const updateStoreAi = (key, value) => {
    setForm((current) => ({
      ...current,
      store_ai: { ...current.store_ai, [key]: value },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = buildPayload(form);
      const response = await api.updateAiSettings(payload);
      const settings = response.settings || {};
      setForm(normalizeSettings(settings));
      setApiKeyMasked(settings.api_key_masked || "");
      setApiKeyConfigured(!!settings.api_key_configured);
      onToast?.("Configuracoes de IA salvas", "ok");
    } catch (error) {
      onToast?.(error.message || "Nao foi possivel salvar IA", "err");
    } finally {
      setSaving(false);
    }
  };

  const testCarina = async () => {
    setTesting("carina");
    setTestAnswer("");
    try {
      const response = await api.testAiConnection("Como cadastro um produto?");
      setTestAnswer(response.answer || "Conexao OK");
      onToast?.("Teste da Carina concluido", "ok");
    } catch (error) {
      setTestAnswer(error.message || "Nao foi possivel testar a IA");
      onToast?.(error.message || "Nao foi possivel testar a IA", "err");
    } finally {
      setTesting("");
    }
  };

  const testStoreProvider = async (provider = null) => {
    const key = provider || "store_ai";
    setTesting(key);
    setTestAnswer("");
    try {
      const response = provider
        ? await api.testAiProvider(provider, "Teste seguro da IA das lojas.")
        : await api.testStoreAiConnection("Teste seguro da IA das lojas.");
      setTestAnswer(`${providerLabel(response.provider || form.store_ai.provider)} OK em ${response.latency_ms || 0} ms: ${response.answer || "Conexao OK"}`);
      onToast?.("Teste da IA das lojas concluido", "ok");
    } catch (error) {
      setTestAnswer(error.message || "Nao foi possivel testar a IA das lojas");
      onToast?.(error.message || "Nao foi possivel testar a IA das lojas", "err");
    } finally {
      setTesting("");
    }
  };

  const copyGapDraft = async (draft) => {
    try {
      await navigator.clipboard.writeText(draft);
      onToast?.("Rascunho copiado para revisao", "ok");
    } catch {
      onToast?.("Nao foi possivel copiar o rascunho", "err");
    }
  };

  if (loading) return <div className="page-stub">Carregando IA...</div>;

  const storeAi = form.store_ai || STORE_AI_DEFAULTS;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Configuracoes</p>
          <h1>IA Replymesh</h1>
          <p className="muted">Controle separado da Carina interna e da IA comercial usada pelas lojas.</p>
        </div>
        <button className="btn primary" onClick={save} disabled={saving}>
          <Icon name="Save" size={16} />
          {saving ? "Salvando..." : "Salvar IA"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button className={`btn ${activeTab === "store_ai" ? "primary" : ""}`} type="button" onClick={() => setActiveTab("store_ai")}>
          <Icon name="Store" size={16} />
          IA das Lojas
        </button>
        <button className={`btn ${activeTab === "carina" ? "primary" : ""}`} type="button" onClick={() => setActiveTab("carina")}>
          <Icon name="Bot" size={16} />
          Carina
        </button>
        <button className={`btn ${activeTab === "usage" ? "primary" : ""}`} type="button" onClick={() => setActiveTab("usage")}>
          <Icon name="BarChart3" size={16} />
          Uso e lacunas
        </button>
      </div>

      {activeTab === "store_ai" && (
        <>
          <section className="panel">
            <div className="panel-title">
              <Icon name="Store" size={18} />
              IA das Lojas
            </div>
            <p className="muted">Configuracao global usada por padrao em todas as empresas. Overrides especificos ficam no cadastro da empresa.</p>

            <div className="form-grid">
              <label className="field switch-row full">
                <span>
                  <b>Ativar IA das lojas globalmente</b>
                  <small>Quando desligado, nenhuma loja usa o assistente virtual mesmo que esteja ativa individualmente.</small>
                </span>
                <Switch on={!!storeAi.enabled} onClick={() => updateStoreAi("enabled", !storeAi.enabled)} />
              </label>

              <label className="field">
                <span>Provider padrao</span>
                <select value={storeAi.provider || "groq"} onChange={(event) => updateStoreAi("provider", event.target.value)}>
                  {STORE_PROVIDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="field">
                <span>Modelo padrao</span>
                <input value={storeAi.model || ""} onChange={(event) => updateStoreAi("model", event.target.value)} placeholder="llama-3.1-8b-instant" />
              </label>

              <ProviderKeyField provider="groq" label="Groq API Key" storeAi={storeAi} onChange={updateStoreAi} />
              <ProviderKeyField provider="claude" label="Claude API Key" storeAi={storeAi} onChange={updateStoreAi} />
              <ProviderKeyField provider="openai" label="OpenAI API Key" storeAi={storeAi} onChange={updateStoreAi} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <Icon name="Gauge" size={18} />
              Limites e seguranca
            </div>
            <div className="form-grid">
              <NumberField label="Mensagens por dia" value={storeAi.daily_message_limit} onChange={(value) => updateStoreAi("daily_message_limit", value)} />
              <NumberField label="Mensagens por mes" value={storeAi.monthly_message_limit} onChange={(value) => updateStoreAi("monthly_message_limit", value)} />
              <NumberField label="Tokens por mes" value={storeAi.monthly_token_limit} onChange={(value) => updateStoreAi("monthly_token_limit", value)} />
              <NumberField label="Timeout em segundos" value={storeAi.timeout_seconds} onChange={(value) => updateStoreAi("timeout_seconds", value)} />
              <NumberField label="Produtos no contexto" value={storeAi.max_context_products} onChange={(value) => updateStoreAi("max_context_products", value)} />
              <NumberField label="Tentativas antes de atendente" value={storeAi.handoff_attempts} onChange={(value) => updateStoreAi("handoff_attempts", value)} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">Testes seguros da IA das Lojas</div>
            <p className="muted">Testa conectividade sem expor chaves no frontend e sem usar dados reais de cliente.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={() => testStoreProvider("groq")} disabled={!!testing}>
                <Icon name={testing === "groq" ? "LoaderCircle" : "Zap"} size={16} className={testing === "groq" ? "spin" : ""} />
                Testar Groq
              </button>
              <button className="btn" type="button" onClick={() => testStoreProvider("anthropic")} disabled={!!testing}>
                <Icon name={testing === "anthropic" ? "LoaderCircle" : "Bot"} size={16} className={testing === "anthropic" ? "spin" : ""} />
                Testar Claude
              </button>
              <button className="btn" type="button" onClick={() => testStoreProvider("openai")} disabled={!!testing}>
                <Icon name={testing === "openai" ? "LoaderCircle" : "Sparkles"} size={16} className={testing === "openai" ? "spin" : ""} />
                Testar OpenAI
              </button>
              <button className="btn primary" type="button" onClick={() => testStoreProvider()} disabled={!!testing}>
                <Icon name={testing === "store_ai" ? "LoaderCircle" : "Send"} size={16} className={testing === "store_ai" ? "spin" : ""} />
                Testar IA das Lojas
              </button>
            </div>
            {testAnswer && <div className="notice info">{testAnswer}</div>}
          </section>
        </>
      )}

      {activeTab === "carina" && (
        <>
          <div className="grid-2">
            <section className="panel">
              <div className="panel-title">
                <Icon name="Bot" size={18} />
                Carina interna
              </div>

              <div className="form-grid">
                <label className="field switch-row">
                  <span>
                    <b>Carina ativa globalmente</b>
                    <small>Quando ativa, o botao da Carina aparece nos paineis das lojas.</small>
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

                <NumberField label="Limite diario por loja" value={form.daily_company_limit} onChange={(value) => update("daily_company_limit", value)} />
                <NumberField label="Limite por usuario/minuto" value={form.per_minute_user_limit} onChange={(value) => update("per_minute_user_limit", value)} />
              </div>
            </section>

            <section className="panel">
              <div className="panel-title">
                <Icon name="Sparkles" size={18} />
                Aparencia da Carina
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
            <div className="panel-title">Prompt base da Carina</div>
            <label className="field">
              <textarea rows="7" value={form.base_prompt || ""} onChange={(event) => update("base_prompt", event.target.value)} />
            </label>
          </section>

          <section className="panel">
            <div className="panel-title">Teste de conexao da Carina</div>
            <p className="muted">Testa a chamada do backend para o Claude sem expor a chave no frontend.</p>
            <button className="btn" onClick={testCarina} disabled={!!testing}>
              <Icon name={testing === "carina" ? "LoaderCircle" : "Send"} size={16} className={testing === "carina" ? "spin" : ""} />
              {testing === "carina" ? "Testando..." : "Testar Carina"}
            </button>
            {testAnswer && <div className="notice info">{testAnswer}</div>}
          </section>
        </>
      )}

      {activeTab === "usage" && (
        <>
          <section className="panel">
            <div className="panel-title">
              <Icon name="BookOpenCheck" size={18} />
              Lacunas da base da Carina
            </div>
            <p className="muted">
              Perguntas sem cobertura ficam aqui para revisao humana. Copie o rascunho, valide o fluxo real e publique na base por revisao de codigo.
            </p>
            <div className="ai-ranking">
              {(usage?.knowledge_gaps || []).map((gap) => (
                <div key={gap.id}>
                  <span>
                    <strong>{gap.probable_module}</strong>
                    <small>{gap.company_name} - {gap.question}</small>
                  </span>
                  <button className="btn" type="button" onClick={() => copyGapDraft(gap.article_draft)}>
                    <Icon name="Copy" size={15} />
                    Copiar rascunho
                  </button>
                </div>
              ))}
              {!usage?.knowledge_gaps?.length && <p className="muted">Nenhuma lacuna pendente.</p>}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <Icon name="BarChart3" size={18} />
              Metricas globais da IA
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
        </>
      )}
    </div>
  );
}

function ProviderKeyField({ provider, label, storeAi, onChange }) {
  const valueKey = `${provider}_api_key`;
  const configured = storeAi[`${provider}_api_key_configured`];
  const masked = storeAi[`${provider}_api_key_masked`];

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="password"
        value={storeAi[valueKey] || ""}
        onChange={(event) => onChange(valueKey, event.target.value)}
        placeholder={configured ? masked : "Cole a chave aqui"}
      />
      <small>{configured ? `Configurada: ${masked}` : "Chave vazia. Pode usar ENV da VPS se configurado."}</small>
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" min="1" value={value ?? ""} onChange={(event) => onChange(Number(event.target.value || 0))} />
    </label>
  );
}

function normalizeSettings(settings) {
  return {
    ...EMPTY,
    ...settings,
    api_key: "",
    store_ai: {
      ...STORE_AI_DEFAULTS,
      ...(settings.store_ai || {}),
      groq_api_key: "",
      claude_api_key: "",
      openai_api_key: "",
    },
  };
}

function buildPayload(form) {
  const storeAi = form.store_ai || STORE_AI_DEFAULTS;
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
    store_ai_enabled: storeAi.enabled,
    store_ai_provider: storeAi.provider,
    store_ai_model: storeAi.model,
    store_ai_groq_api_key: storeAi.groq_api_key,
    store_ai_claude_api_key: storeAi.claude_api_key,
    store_ai_openai_api_key: storeAi.openai_api_key,
    store_ai_daily_message_limit: storeAi.daily_message_limit,
    store_ai_monthly_message_limit: storeAi.monthly_message_limit,
    store_ai_monthly_token_limit: storeAi.monthly_token_limit,
    store_ai_timeout_seconds: storeAi.timeout_seconds,
    store_ai_max_context_products: storeAi.max_context_products,
    store_ai_handoff_attempts: storeAi.handoff_attempts,
  };

  if (!payload.api_key?.trim()) delete payload.api_key;
  if (!payload.store_ai_groq_api_key?.trim()) delete payload.store_ai_groq_api_key;
  if (!payload.store_ai_claude_api_key?.trim()) delete payload.store_ai_claude_api_key;
  if (!payload.store_ai_openai_api_key?.trim()) delete payload.store_ai_openai_api_key;
  return payload;
}

function providerLabel(value) {
  return Object.fromEntries(STORE_PROVIDERS)[value] || value || "Provider";
}
