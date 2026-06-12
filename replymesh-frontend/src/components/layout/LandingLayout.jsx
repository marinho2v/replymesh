import { Link } from "react-router-dom";
import "../../styles/landing.css";

export function LandingLayout({ children }) {
  return (
    <div className="lp">

      {/* NAV */}
      <header className="lp-nav">
        <div className="wrap nav-in">
          <Link className="logo" to="/">
            <span className="mark"><img src="/mark.png" alt="Replymesh" /></span>
            Replymesh
          </Link>
          <nav className="nav-links">
            <a href="/#">Início</a>
            <a href="/#recursos">Recursos</a>
            <a href="/#planos">Planos</a>
            <a href="/#clientes">Clientes</a>
            <a href="#">Suporte</a>
          </nav>
          <div className="nav-right">
            <Link to="/login" className="enter">Entrar</Link>
            <Link to="/login" className="btn btn-white">Testar grátis</Link>
          </div>
          <button className="menu-btn" aria-label="Menu">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div style={{ minHeight: "calc(100vh - 340px)", background: "#fff" }}>
        {children}
      </div>

      {/* FOOTER */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Link className="logo" to="/">
                <span className="mark"><img src="/mark.png" alt="Replymesh"/></span>
                Replymesh
              </Link>
              <p className="foot-about">A plataforma completa para deliverys e negócios de alimentação que querem vender mais e ter uma operação profissional.</p>
              <div className="socials">
                <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
                <a href="#" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.7 12.3l-.3.4.6 2.2-2.3-.6-.4.2A8 8 0 1 1 12 4zm-3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.3l-1.5-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.1-.2.2-.4.1-.6-.2-1.5-.6-2.4-1.5-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.3.1-.4l.4-.5c.1-.2.1-.3.2-.5 0-.1 0-.3-.1-.4l-.7-1.7c-.2-.4-.4-.5-.6-.5z"/></svg></a>
                <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V7c0-.6.4-1 1-1h2V3h-3a4 4 0 0 0-4 4v2H8v3h2v9h3v-9h2.5l.5-3H13z"/></svg></a>
                <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 8a3 3 0 0 0-2-2c-1.8-.5-8-.5-8-.5s-6.2 0-8 .5a3 3 0 0 0-2 2 31 31 0 0 0 0 8 3 3 0 0 0 2 2c1.8.5 8 .5 8 .5s6.2 0 8-.5a3 3 0 0 0 2-2 31 31 0 0 0 0-8zM10 15V9l5 3-5 3z"/></svg></a>
              </div>
            </div>
            <div className="foot-col"><h5>Produto</h5><a href="/#recursos">Recursos</a><a href="/#planos">Planos</a><a href="#">Integrações</a><a href="#">Aplicativo</a></div>
            <div className="foot-col"><h5>Empresa</h5><a href="#">Sobre nós</a><a href="/#clientes">Clientes</a><a href="#">Blog</a><a href="#">Contato</a></div>
            <div className="foot-col"><h5>Suporte</h5><a href="#">Central de Ajuda</a><a href="#">Tutoriais</a><a href="#">Status do Sistema</a><a href="#">Fale Conosco</a></div>
            <div className="foot-col">
              <h5>Fale com a gente</h5>
              <div className="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>(11) 99999-9999</div>
              <div className="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>contato@replymesh.com.br</div>
              <div className="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>Rio de Janeiro - RJ</div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 Replymesh. Todos os direitos reservados.</span>
            <Link to="/termos-de-uso">Termos de Uso</Link>
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          </div>
        </div>
      </footer>

      <a className="wa-btn" href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">
        Falar no WhatsApp
        <span className="wi">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm-3 6c.2 0 .4.1.6.5l.7 1.7c.1.1.1.3 0 .4l-.4.5c-.1.1-.2.2-.1.4.2.2.6 1 1.3 1.6.9.9 1.8 1.3 2.4 1.5.2.1.3 0 .4-.1l.6-.8c.1-.2.3-.2.5-.1l1.5.7c.3.1.5.2.6.3.1.1.1.6-.1 1.2-.2.6-1.2 1.1-1.7 1.2-.5.1-.9.2-3-.6-2.6-1-4.2-3.6-4.3-3.8-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.3.5-.4.7-.4z"/></svg>
        </span>
      </a>
    </div>
  );
}
