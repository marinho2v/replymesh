import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import "../styles/founder-signup.css";

const EMPTY = {
  responsible_name: "", email: "", phone: "", password: "", password_confirmation: "",
  company_name: "", business_type: "", city: "", state: "", slug: "",
  accepted_terms: false, website: "",
};

const normalizeSlug = (value) => value
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

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

  useEffect(() => {
    api.getFounderProgramStatus().then((data) => setProgram(data.program)).catch(() => setProgram({ enabled: false }));
  }, []);

  const available = program?.enabled;
  const slugPreview = useMemo(() => normalizeSlug(form.slug || form.company_name), [form.slug, form.company_name]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await api.startFounderSignup({ ...form, slug: slugPreview });
      setSignupId(data.signup_id);
      setMaskedEmail(data.email);
      setStep("verify");
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const verify = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await api.verifyFounderSignup(signupId, code);
      setResult(data);
      setStep("success");
    } catch (e) {
      setError(e.message);
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setBusy(true); setError("");
    try { await api.resendFounderSignup(signupId); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="founder-page">
      <header className="founder-nav">
        <Link to="/" className="founder-brand"><img src="/mark.png" alt="" /> Replymesh</Link>
        <Link to="/login">Já tenho acesso</Link>
      </header>
      <section className="founder-shell">
        <aside className="founder-intro">
          <span className="founder-kicker">PROGRAMA FUNDADORES</span>
          <h1>Comece sua operação digital com a Replymesh.</h1>
          <p>Crie seu cardápio, receba pedidos e organize sua loja em uma plataforma feita para delivery.</p>
          <ul>
            <li>Seu endereço exclusivo .replymesh.cloud</li>
            <li>Cardápio, pedidos, delivery e relatórios</li>
            <li>WhatsApp manual incluído</li>
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
                <label>WhatsApp<input required inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
                <span />
                <label>Senha<input required minLength="10" type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} /></label>
                <label>Confirmar senha<input required minLength="10" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(e) => update("password_confirmation", e.target.value)} /></label>
              </div>
              <h3>Sua empresa</h3>
              <div className="founder-grid">
                <label>Nome da loja<input required value={form.company_name} onChange={(e) => update("company_name", e.target.value)} /></label>
                <label>Tipo de negócio<select required value={form.business_type} onChange={(e) => update("business_type", e.target.value)}><option value="">Selecione</option><option>Hamburgueria</option><option>Pizzaria</option><option>Restaurante</option><option>Açaí</option><option>Bebidas</option><option>Outro</option></select></label>
                <label>Cidade<input required value={form.city} onChange={(e) => update("city", e.target.value)} /></label>
                <label>Estado<input required maxLength="2" placeholder="RJ" value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} /></label>
              </div>
              <label>Endereço da loja<div className="founder-domain"><input required value={form.slug || slugPreview} onChange={(e) => update("slug", normalizeSlug(e.target.value))} /><span>.replymesh.cloud</span></div></label>
              <input className="founder-hp" tabIndex="-1" autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
              <label className="founder-check"><input required type="checkbox" checked={form.accepted_terms} onChange={(e) => update("accepted_terms", e.target.checked)} /> Aceito os <Link to="/termos-de-uso">Termos de Uso</Link> e a política do Programa Fundadores.</label>
              {error && <p className="founder-error">{error}</p>}
              <button className="founder-primary" disabled={busy}>{busy ? "Enviando..." : "Receber código de confirmação"}</button>
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
