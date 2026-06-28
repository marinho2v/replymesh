import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const EMPTY = {
  enabled: false,
  host: "smtp.hostinger.com",
  port: 465,
  authentication: "login",
  ssl: true,
  enable_starttls_auto: false,
  username: "",
  password: "",
  password_configured: false,
  from_email: "",
  from_name: "Replymesh",
  reply_to: "",
  test_recipient: "",
  configured: false,
  last_tested_at: null,
  last_test_status: null,
  last_test_message: null,
};

export function SmtpSettings({ onToast }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let active = true;
    api.getSmtpSettings()
      .then((data) => {
        if (active) setForm({ ...EMPTY, ...(data.smtp_settings || {}), password: "" });
      })
      .catch((error) => {
        if (active) onToast?.(error.message, "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onToast]);

  const status = useMemo(() => {
    if (form.configured) return { label: "SMTP configurado", tone: "online", detail: "Pronto para enviar códigos do Programa Fundadores." };
    if (form.enabled) return { label: "Configuração incompleta", tone: "paused", detail: "Preencha usuário, senha e remetente antes de ativar cadastros." };
    return { label: "SMTP desativado", tone: "offline", detail: "O cadastro público não consegue enviar código enquanto o SMTP estiver desativado." };
  }, [form]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        enabled: form.enabled,
        host: form.host,
        port: Number(form.port),
        authentication: form.authentication,
        ssl: form.ssl,
        enable_starttls_auto: form.enable_starttls_auto,
        username: form.username,
        from_email: form.from_email,
        from_name: form.from_name,
        reply_to: form.reply_to,
        test_recipient: form.test_recipient,
      };
      if (form.password?.trim()) payload.password = form.password;

      const data = await api.updateSmtpSettings(payload);
      setForm({ ...EMPTY, ...(data.smtp_settings || {}), password: "" });
      onToast?.("Configuração SMTP salva.", "success");
    } catch (error) {
      onToast?.(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const data = await api.testSmtpSettings(form.test_recipient);
      setForm({ ...EMPTY, ...(data.smtp_settings || {}), password: "" });
      onToast?.(data.message || "E-mail de teste enviado.", "success");
    } catch (error) {
      const nextSettings = error.data?.smtp_settings;
      if (nextSettings) setForm({ ...EMPTY, ...nextSettings, password: "" });
      onToast?.(error.data?.message || error.message, "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="route-loader">Carregando SMTP...</div>;

  return (
    <div className="page smtp-admin-page">
      <div className="page-header founder-admin-hero">
        <div>
          <span className="founder-admin-kicker">Infraestrutura</span>
          <h1>SMTP e e-mails</h1>
          <p>Configure o envio de códigos do Programa Fundadores e outros e-mails transacionais da Replymesh.</p>
        </div>
        <div className="smtp-actions">
          <button className="btn btn-ghost" type="button" onClick={test} disabled={testing || saving}>
            <Icon name={testing ? "LoaderCircle" : "Send"} size={16} />
            {testing ? "Testando..." : "Enviar teste"}
          </button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={saving || testing}>
            <Icon name="Save" size={16} />
            {saving ? "Salvando..." : "Salvar SMTP"}
          </button>
        </div>
      </div>

      <section className="founder-admin-status card">
        <div>
          <span className={`status-dot ${status.tone}`} />
          <strong>{status.label}</strong>
          <small>{status.detail}</small>
        </div>
        <div className="smtp-secret-badge">
          <Icon name="KeyRound" size={16} />
          Senha {form.password_configured ? "configurada" : "não configurada"}
        </div>
      </section>

      <section className="card card-pad founder-admin-card">
        <div className="founder-section-head">
          <div>
            <h2>Conexão SMTP</h2>
            <p>Para Hostinger, normalmente use smtp.hostinger.com, porta 465 e SSL ativo.</p>
          </div>
        </div>

        <label className={`founder-toggle ${form.enabled ? "active" : ""}`}>
          <input type="checkbox" checked={form.enabled} onChange={(event) => update("enabled", event.target.checked)} />
          <span><Icon name={form.enabled ? "Check" : "Circle"} size={16} /></span>
          <div>
            <strong>Ativar envio de e-mail pelo SMTP</strong>
            <small>Quando ativo e completo, o Programa Fundadores envia código de confirmação por e-mail.</small>
          </div>
        </label>

        <div className="form-grid founder-admin-form">
          <div className="field">
            <label>Servidor SMTP</label>
            <input value={form.host} onChange={(event) => update("host", event.target.value)} placeholder="smtp.hostinger.com" />
          </div>
          <div className="field">
            <label>Porta</label>
            <input type="number" min="1" max="65535" value={form.port} onChange={(event) => update("port", event.target.value)} />
          </div>
          <div className="field">
            <label>Autenticação</label>
            <select value={form.authentication} onChange={(event) => update("authentication", event.target.value)}>
              <option value="login">login</option>
              <option value="plain">plain</option>
              <option value="cram_md5">cram_md5</option>
            </select>
          </div>
          <div className="field">
            <label>Usuário SMTP / e-mail</label>
            <input value={form.username || ""} onChange={(event) => update("username", event.target.value)} placeholder="contato@replymesh.cloud" autoComplete="off" />
          </div>
          <div className="field">
            <label>Senha SMTP</label>
            <input type="password" value={form.password || ""} onChange={(event) => update("password", event.target.value)} placeholder={form.password_configured ? "Senha já configurada. Digite para trocar." : "Senha do e-mail"} autoComplete="new-password" />
          </div>
          <div className="field">
            <label>E-mail remetente</label>
            <input value={form.from_email || ""} onChange={(event) => update("from_email", event.target.value)} placeholder="contato@replymesh.cloud" />
          </div>
          <div className="field">
            <label>Nome remetente</label>
            <input value={form.from_name || ""} onChange={(event) => update("from_name", event.target.value)} placeholder="Replymesh" />
          </div>
          <div className="field">
            <label>Responder para opcional</label>
            <input value={form.reply_to || ""} onChange={(event) => update("reply_to", event.target.value)} placeholder="suporte@replymesh.cloud" />
          </div>
          <div className="field">
            <label>E-mail para teste</label>
            <input value={form.test_recipient || ""} onChange={(event) => update("test_recipient", event.target.value)} placeholder="seuemail@gmail.com" />
          </div>
        </div>

        <div className="smtp-checks">
          <label><input type="checkbox" checked={form.ssl} onChange={(event) => update("ssl", event.target.checked)} /> Usar SSL</label>
          <label><input type="checkbox" checked={form.enable_starttls_auto} onChange={(event) => update("enable_starttls_auto", event.target.checked)} /> STARTTLS automático</label>
        </div>
      </section>

      <section className="card card-pad founder-admin-card">
        <div className="founder-section-head">
          <div>
            <h2>Modelo do e-mail de confirmação</h2>
            <p>Prévia do que o cliente recebe para confirmar o cadastro.</p>
          </div>
        </div>
        <div className="smtp-mail-preview">
          <div className="smtp-mail-top">
            <span>Replymesh</span>
            <strong>Confirme seu cadastro</strong>
          </div>
          <div className="smtp-mail-body">
            <p>Olá, Pedro.</p>
            <p>Use o código abaixo para confirmar seu e-mail e criar sua loja no Programa Fundadores.</p>
            <div className="smtp-code">482913</div>
            <p>Este código expira em <strong>15 minutos</strong>.</p>
            <small>Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.</small>
          </div>
        </div>
        {form.last_tested_at && (
          <p className={`smtp-last-test ${form.last_test_status === "success" ? "ok" : "bad"}`}>
            Último teste: {form.last_test_message || form.last_test_status} — {new Date(form.last_tested_at).toLocaleString("pt-BR")}
          </p>
        )}
      </section>
    </div>
  );
}
