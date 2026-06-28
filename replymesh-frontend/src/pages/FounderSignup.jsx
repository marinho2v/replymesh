import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import "../styles/founder-signup.css";

const EMPTY = {
  responsible_name: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
  company_name: "",
  business_type: "",
  city: "",
  state: "",
  slug: "",
  accepted_terms: false,
  website: "",
};

const normalizeSlug = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const maskPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");

function PasswordInput({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <div className="founder-password">
        <input
          required
          minLength="10"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={onChange}
        />
        <button type="button" onClick={() => setVisible((current) => !current)}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </label>
  );
}

export function FounderSignup() {
  const [form, setForm] = useState(EMPTY);
  const [program, setProgram] = useState(null);
  const [step, setStep] = useState("form");
  const [signupId, setSignupId] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null);

  useEffect(() => {
    api.getFounderProgramStatus()
      .then((data) => setProgram(data.program))
      .catch(() => setProgram({ enabled: false }));
  }, []);

  const available = program?.enabled;
  const slugPreview = useMemo(() => normalizeSlug(form.slug || form.company_name), [form.slug, form.company_name]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!slugPreview || slugPreview.length < 3) {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      if (active) setSlugStatus({ slug: slugPreview, checking: true });
      api.checkFounderSlug(slugPreview, form.company_name)
        .then((data) => { if (active) setSlugStatus({ ...data, checking: false }); })
        .catch(() => { if (active) setSlugStatus(null); })
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [slugPreview, form.company_name]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const data = await api.startFounderSignup({ ...form, phone: onlyDigits(form.phone), slug: slugPreview });
      setSignupId(data.signup_id);
      setMaskedEmail(data.email);
      setStep("verify");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const data = await api.verifyFounderSignup(signupId, code);
      setResult(data);
      setStep("success");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError("");
    try {
      await api.resendFounderSignup(signupId);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const useSuggestion = () => update("slug", slugStatus?.suggestion || slugPreview);
  const canCheckSlug = slugPreview.length >= 3;
  const isCheckingSlug = Boolean(canCheckSlug && slugStatus?.checking && slugStatus.slug === slugPreview);
  const currentSlugStatus = slugStatus?.slug === slugPreview ? slugStatus : null;
  const slugUnavailable = Boolean(canCheckSlug && currentSlugStatus && !currentSlugStatus.checking && !currentSlugStatus.available);

  return (
    <main className="founder-page">
      <header className="founder-nav">
        <a href="https://replymesh.cloud/" className="founder-brand"><img src="/mark.png" alt="" /> Replymesh</a>
        <Link to="/entrar">Ja tenho acesso</Link>
      </header>

      <section className="founder-shell">
        <aside className="founder-intro">
          <span className="founder-kicker">PROGRAMA FUNDADORES</span>
          <h1>Delivery completo, grátis para fundadores.</h1>
          <p>Cadastre sua loja e comece com uma estrutura profissional para vender online, automatizar o WhatsApp e organizar sua operação.</p>
          <ul className="founder-feature-list">
            <li>Cardápio online com endereço exclusivo .replymesh.cloud</li>
            <li>Pedidos online, delivery, áreas de entrega e relatórios</li>
            <li>WhatsApp automático com templates e mensagens prontas</li>
            <li>Marketing, cupons, recuperação de vendas e banners</li>
            <li>IA para atendimento, estoque, clientes e gestão da loja</li>
            <li>Aplicativo do motoboy e atualizações contínuas inclusas</li>
          </ul>
          {program && <div className="founder-vacancies">{program.remaining} de {program.limit} vagas disponíveis</div>}
        </aside>

        <div className="founder-card">
          {!available && program && (
            <div className="founder-state">
              <h2>Inscrições pausadas</h2>
              <p>As vagas foram preenchidas ou o programa está temporariamente fechado. Fale com nossa equipe para entrar na lista de espera.</p>
              <Link className="founder-primary" to="/contato">Falar com a Replymesh</Link>
            </div>
          )}

          {available && step === "form" && (
            <form onSubmit={submit}>
              <h2>Crie sua conta fundadora</h2>
              <p className="founder-muted">Leva poucos minutos. Confirme seu e-mail para ativar a loja.</p>

              <h3>Seus dados</h3>
              <div className="founder-grid">
                <label>Nome completo<input required value={form.responsible_name} onChange={(e) => update("responsible_name", e.target.value)} /></label>
                <label>E-mail<input required type="email" autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
                <label>WhatsApp<input required inputMode="tel" placeholder="(21) 99999-9999" value={form.phone} onChange={(e) => update("phone", maskPhone(e.target.value))} /></label>
                <span />
                <PasswordInput label="Senha" value={form.password} onChange={(e) => update("password", e.target.value)} />
                <PasswordInput label="Confirmar senha" value={form.password_confirmation} onChange={(e) => update("password_confirmation", e.target.value)} />
              </div>

              <h3>Sua empresa</h3>
              <div className="founder-grid">
                <label>Nome da loja<input required value={form.company_name} onChange={(e) => update("company_name", e.target.value)} /></label>
                <label>Tipo de negócio<select required value={form.business_type} onChange={(e) => update("business_type", e.target.value)}><option value="">Selecione</option><option>Hamburgueria</option><option>Pizzaria</option><option>Restaurante</option><option>Açaí</option><option>Bebidas</option><option>Outro</option></select></label>
                <label>Cidade<input required value={form.city} onChange={(e) => update("city", e.target.value)} /></label>
                <label>Estado<input required maxLength="2" placeholder="RJ" value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} /></label>
              </div>
              <label>
                Endereço da loja
                <div className="founder-domain">
                  <input required value={form.slug || slugPreview} onChange={(e) => update("slug", normalizeSlug(e.target.value))} />
                  <span>.replymesh.cloud</span>
                </div>
              </label>

              {canCheckSlug && (
                <div className={`founder-slug-status ${slugStatus?.available ? "ok" : "warn"}`}>
                  {isCheckingSlug && "Verificando endereço..."}
                  {!isCheckingSlug && currentSlugStatus?.available && <>Endereço disponível: <strong>{slugPreview}.replymesh.cloud</strong></>}
                  {!isCheckingSlug && currentSlugStatus && !currentSlugStatus.available && (
                    <>
                      <span>Esse endereço não está disponível.</span>
                      <button type="button" onClick={useSuggestion}>Usar {currentSlugStatus.suggestion}.replymesh.cloud</button>
                    </>
                  )}
                </div>
              )}

              <input className="founder-hp" tabIndex="-1" autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
              <label className="founder-check"><input required type="checkbox" checked={form.accepted_terms} onChange={(e) => update("accepted_terms", e.target.checked)} /> Aceito os <Link to="/termos-de-uso">Termos de Uso</Link> e a política do Programa Fundadores.</label>
              {error && <p className="founder-error">{error}</p>}
              <button className="founder-primary" disabled={busy || isCheckingSlug || slugUnavailable}>{busy ? "Enviando..." : "Receber código de confirmação"}</button>
            </form>
          )}

          {available && step === "verify" && (
            <form onSubmit={verify} className="founder-state">
              <h2>Confirme seu e-mail</h2>
              <p>Enviamos um código de 6 dígitos para <strong>{maskedEmail}</strong>.</p>
              <input className="founder-code" required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              {error && <p className="founder-error">{error}</p>}
              <button className="founder-primary" disabled={busy}>Confirmar e criar minha loja</button>
              <button className="founder-link" type="button" disabled={busy} onClick={resend}>Reenviar código</button>
            </form>
          )}

          {step === "success" && (
            <div className="founder-state">
              <span className="founder-success">✓</span>
              <h2>Sua loja foi criada com sucesso.</h2>
              <p>Seu acesso fundador está ativo. Agora você já pode configurar o cardápio e começar.</p>
              <a className="founder-primary" href={result.panel_url}>Acessar painel</a>
              <a className="founder-secondary" href={result.store_url}>Ver minha loja</a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
