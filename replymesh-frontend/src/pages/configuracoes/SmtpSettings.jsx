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
  email_template_brand_name: "Replymesh",
  email_template_logo_url: "",
  email_template_primary_color: "#090a0d",
  email_template_footer_text: "Equipe Replymesh",
  confirmation_email_subject: "Seu código de confirmação Replymesh",
  confirmation_email_title: "Confirme seu cadastro",
  confirmation_email_intro: "Use o código abaixo para confirmar seu e-mail e criar sua loja no Programa Fundadores.",
  password_reset_email_subject: "Código para redefinir sua senha Replymesh",
  password_reset_email_title: "Redefinir senha",
  password_reset_email_intro: "Recebemos uma solicitação para redefinir a senha do painel da loja.",
};

const TEMPLATE_FIELDS = [
  "email_template_brand_name",
  "email_template_logo_url",
  "email_template_primary_color",
  "email_template_footer_text",
  "confirmation_email_subject",
  "confirmation_email_title",
  "confirmation_email_intro",
  "password_reset_email_subject",
  "password_reset_email_title",
  "password_reset_email_intro",
];

export function SmtpSettings({ onToast }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [previewType, setPreviewType] = useState("confirmation");

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
    if (form.configured) return { label: "SMTP configurado", tone: "online", detail: "Pronto para enviar códigos do Programa Fundadores e recuperação de senha." };
    if (form.enabled) return { label: "Configuração incompleta", tone: "paused", detail: "Preencha usuário, senha e remetente antes de ativar os envios." };
    return { label: "SMTP desativado", tone: "offline", detail: "Cadastros e recuperação de senha não enviam e-mail enquanto o SMTP estiver desativado." };
  }, [form]);

  const preview = useMemo(() => {
    if (previewType === "password") {
      return {
        subject: form.password_reset_email_subject,
        title: form.password_reset_email_title,
        greeting: "Olá, Wesley.",
        intro: `${form.password_reset_email_intro} Teste Rotas Global.`,
        label: "Código de recuperação",
        code: "623483",
        expires: "Este código expira em 15 minutos.",
        note: "Se você não solicitou a troca de senha, ignore este e-mail com segurança.",
      };
    }

    return {
      subject: form.confirmation_email_subject,
      title: form.confirmation_email_title,
      greeting: "Olá, Pedro.",
      intro: form.confirmation_email_intro,
      label: "Código de confirmação",
      code: "482913",
      expires: "Este código expira em 15 minutos.",
      note: "Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.",
    };
  }, [form, previewType]);

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
      TEMPLATE_FIELDS.forEach((field) => {
        payload[field] = form[field] || "";
      });
      if (form.password?.trim()) payload.password = form.password;

      const data = await api.updateSmtpSettings(payload);
      setForm({ ...EMPTY, ...(data.smtp_settings || {}), password: "" });
      onToast?.("Configuração de SMTP e template salva.", "success");
    } catch (error) {
      onToast?.(error.data?.errors?.join(", ") || error.message, "error");
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
          <h1>SMTP e templates de e-mail</h1>
          <p>Configure o envio e personalize o visual dos e-mails transacionais da Replymesh.</p>
        </div>
        <div className="smtp-actions">
          <button className="btn btn-ghost" type="button" onClick={test} disabled={testing || saving}>
            <Icon name={testing ? "LoaderCircle" : "Send"} size={16} />
            {testing ? "Testando..." : "Enviar teste"}
          </button>
          <button className="btn btn-primary" type="button" onClick={save} disabled={saving || testing}>
            <Icon name="Save" size={16} />
            {saving ? "Salvando..." : "Salvar tudo"}
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
            <small>Quando ativo e completo, códigos de cadastro e recuperação de senha são enviados por e-mail.</small>
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
            <h2>Template visual dos e-mails</h2>
            <p>Personalize marca, cor, logo, assunto e textos. O preview mostra como o cliente vai receber.</p>
          </div>
          <span className="founder-admin-pill">Preview ao vivo</span>
        </div>

        <div className="smtp-template-grid">
          <div className="smtp-template-fields">
            <div className="form-grid founder-admin-form">
              <div className="field">
                <label>Nome da marca no e-mail</label>
                <input value={form.email_template_brand_name || ""} onChange={(event) => update("email_template_brand_name", event.target.value)} placeholder="Replymesh" />
              </div>
              <div className="field">
                <label>Cor principal</label>
                <input type="color" value={form.email_template_primary_color || "#090a0d"} onChange={(event) => update("email_template_primary_color", event.target.value)} />
              </div>
              <div className="field field-wide">
                <label>URL da logo</label>
                <input value={form.email_template_logo_url || ""} onChange={(event) => update("email_template_logo_url", event.target.value)} placeholder="https://replymesh.cloud/logo.png" />
                <small>Use uma URL pública HTTPS. Se ficar vazio, aparece o nome da marca.</small>
              </div>
              <div className="field field-wide">
                <label>Rodapé</label>
                <input value={form.email_template_footer_text || ""} onChange={(event) => update("email_template_footer_text", event.target.value)} placeholder="Equipe Replymesh" />
              </div>

              <div className="smtp-template-subtitle field-wide">Cadastro / Programa Fundadores</div>
              <div className="field">
                <label>Assunto</label>
                <input value={form.confirmation_email_subject || ""} onChange={(event) => update("confirmation_email_subject", event.target.value)} />
              </div>
              <div className="field">
                <label>Título</label>
                <input value={form.confirmation_email_title || ""} onChange={(event) => update("confirmation_email_title", event.target.value)} />
              </div>
              <div className="field field-wide">
                <label>Texto principal</label>
                <textarea rows={3} value={form.confirmation_email_intro || ""} onChange={(event) => update("confirmation_email_intro", event.target.value)} />
              </div>

              <div className="smtp-template-subtitle field-wide">Recuperação de senha</div>
              <div className="field">
                <label>Assunto</label>
                <input value={form.password_reset_email_subject || ""} onChange={(event) => update("password_reset_email_subject", event.target.value)} />
              </div>
              <div className="field">
                <label>Título</label>
                <input value={form.password_reset_email_title || ""} onChange={(event) => update("password_reset_email_title", event.target.value)} />
              </div>
              <div className="field field-wide">
                <label>Texto principal</label>
                <textarea rows={3} value={form.password_reset_email_intro || ""} onChange={(event) => update("password_reset_email_intro", event.target.value)} />
              </div>
            </div>
          </div>

          <div className="smtp-preview-panel">
            <div className="smtp-preview-tabs">
              <button type="button" className={previewType === "confirmation" ? "active" : ""} onClick={() => setPreviewType("confirmation")}>Confirmação</button>
              <button type="button" className={previewType === "password" ? "active" : ""} onClick={() => setPreviewType("password")}>Recuperação</button>
            </div>
            <div className="smtp-preview-subject">
              <span>Assunto</span>
              <strong>{preview.subject}</strong>
            </div>
            <div className="smtp-mail-preview">
              <div className="smtp-mail-top" style={{ background: form.email_template_primary_color || "#090a0d" }}>
                {form.email_template_logo_url ? (
                  <img src={form.email_template_logo_url} alt={form.email_template_brand_name || "Replymesh"} />
                ) : (
                  <span>{form.email_template_brand_name || "Replymesh"}</span>
                )}
                <strong>{preview.title}</strong>
              </div>
              <div className="smtp-mail-body">
                <p>{preview.greeting}</p>
                <p>{preview.intro}</p>
                <div className="smtp-code">
                  <small>{preview.label}</small>
                  {preview.code}
                </div>
                <p>{preview.expires}</p>
                <small>{preview.note}</small>
              </div>
              <div className="smtp-mail-footer">{form.email_template_footer_text || "Equipe Replymesh"}</div>
            </div>
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
