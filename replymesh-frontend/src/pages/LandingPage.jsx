import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
import { Icon } from "../components/ui/Icon.jsx";
import "../styles/landing.css";

/* --- dados estaticos --- */

const AVATARS = [
  "1494790108377-be9c29b29330",
  "1438761681033-6461ffad8d80",
  "1500648767791-00dcc994a43e",
  "1507003211169-0a1dd7228f2d",
];

const DEFAULT_BRANDING = {
  platform_name: "Replymesh",
  landing_logo_url: "/mark.png",
  landing_hero_image_url: "/mockup.png",
  support_whatsapp: "5511999999999",
  support_email: "contato@replymesh.com.br",
  support_location: "Rio de Janeiro - RJ",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  landing_clients: [
    { name: "Lanche do 2R", type: "Hamburgueria", logo_url: "/clients/lanche-do-2r.png", site_url: "https://lanchesdo2r.com.br" },
    { name: "Petisco da Paty", type: "Delivery", logo_url: "/clients/petisco-da-paty.png", site_url: "" },
    { name: "Pizza Show", type: "Pizzaria", logo_url: "/clients/pizza-show.png", site_url: "" },
  ],
};

const CATS = [
  { key: "burger",  label: "Hamburguerias",             path: <><path d="M4 10a8 8 0 0 1 16 0z"/><path d="M3 14h18M5 14c0 2 1.5 3 3 3h8c1.5 0 3-1 3-3"/><circle cx="9" cy="7" r=".4"/><circle cx="13" cy="6.5" r=".4"/><circle cx="16" cy="7.5" r=".4"/></> },
  { key: "pizza",   label: "Pizzarias",                  path: <><path d="M12 3l9 16a20 20 0 0 1-18 0L12 3z"/><circle cx="10" cy="11" r="1"/><circle cx="14" cy="13" r="1"/><circle cx="11" cy="16" r="1"/></> },
  { key: "cake",    label: "Docerias",                   path: <><path d="M4 21h16v-7H4zM6 14v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M12 9V6M12 6l1.5-1.5"/></> },
  { key: "acai",    label: "Açaiterias",                 path: <><path d="M5 11h14a7 7 0 0 1-14 0z"/><path d="M9 8l1-2M12 7l.5-2.5M15 8l1.5-2"/></> },
  { key: "bottle",  label: "Distribuidoras de bebidas",  path: <><path d="M9 2h2v3l1 2v13a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7l1-2z"/><path d="M14 4h2v3l1 2v11h-3"/></> },
  { key: "snack",   label: "Lanchonetes",                path: <><path d="M4 11a8 8 0 0 1 16 0z"/><path d="M3 14h18M6 14c0 2 1 3 2 3h8c1 0 2-1 2-3"/><path d="M15 8l2-2"/></> },
  { key: "box",     label: "Marmitarias",                path: <><path d="M3 8l9-4 9 4v8l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v8"/></> },
  { key: "bag",     label: "Delivery em geral",          path: <><path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/></> },
];

const CAPABILITIES = [
  { title: "Cardápio Online Profissional", icon: "ShoppingBag" },
  { title: "Pedidos por WhatsApp", icon: "MessageCircle" },
  { title: "Marketing Automático", icon: "Megaphone" },
  { title: "Recuperação de Vendas", icon: "RefreshCw" },
  { title: "IA para Atendimento", icon: "Bot" },
  { title: "Aplicativo do Motoboy", icon: "Truck" },
  { title: "Aplicativo do Garçom", icon: "Smartphone" },
  { title: "PDV e Balcão", icon: "Store" },
  { title: "Gestão de Mesas", icon: "QrCode" },
  { title: "Impressão Automática", icon: "Receipt" },
  { title: "Mercado Pago Integrado", icon: "CreditCard" },
  { title: "Pix Automático", icon: "DollarSign" },
  { title: "Relatórios Avançados", icon: "BarChart3" },
  { title: "Dashboard em Tempo Real", icon: "LayoutDashboard" },
  { title: "Domínio Próprio", icon: "Globe" },
  { title: "Multiempresa", icon: "Building2" },
  { title: "Controle de Usuários", icon: "Users" },
  { title: "Banner Promocional", icon: "Image" },
  { title: "Sistema de Promoções e Roleta", icon: "Sparkles" },
  { title: "Controle de Produtos e Categorias", icon: "Archive" },
];

const formatPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value || "";
};

/* --- componente principal --- */

export function LandingPage() {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getPublicPlatformBranding()
      .then((data) => {
        if (!alive) return;
        setBranding({ ...DEFAULT_BRANDING, ...(data.branding || {}) });
      })
      .catch(() => {
        if (alive) setBranding(DEFAULT_BRANDING);
      });
    return () => { alive = false; };
  }, []);

  const platformName = branding.platform_name || DEFAULT_BRANDING.platform_name;
  const landingLogo = branding.landing_logo_url || branding.light_logo_url || DEFAULT_BRANDING.landing_logo_url;
  const heroImage = branding.landing_hero_image_url || DEFAULT_BRANDING.landing_hero_image_url;
  const supportWhatsapp = (branding.support_whatsapp || DEFAULT_BRANDING.support_whatsapp).replace(/\D/g, "");
  const supportPhone = formatPhone(branding.support_whatsapp || DEFAULT_BRANDING.support_whatsapp);
  const supportEmail = branding.support_email || DEFAULT_BRANDING.support_email;
  const supportLocation = branding.support_location || DEFAULT_BRANDING.support_location;
  const landingClients = useMemo(() => {
    const clients = Array.isArray(branding.landing_clients) ? branding.landing_clients : [];
    return clients.filter((client) => client?.name).length ? clients.filter((client) => client?.name) : DEFAULT_BRANDING.landing_clients;
  }, [branding.landing_clients]);
  const scrollClients = landingClients.length > 5;
  const visibleClients = scrollClients ? [...landingClients, ...landingClients] : landingClients;

  return (
    <div className="lp">

      {/* -- NAV -- */}
      <header className="lp-nav">
        <div className="wrap nav-in">
          <Link className="logo" to="/">
            <span className="mark"><img src={landingLogo} alt={platformName} /></span>
            {platformName}
          </Link>
          <nav className={`nav-links${menuOpen ? " is-open" : ""}`}>
            <a href="#" className="active">Início</a>
            <a href="#recursos">Recursos</a>
            <Link to="/funcionalidades">Soluções
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{width:13,height:13,opacity:.7}}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </Link>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#clientes">Clientes</a>
            <Link to="/central-de-ajuda">Suporte</Link>
          </nav>
          <div className="nav-right">
            <Link to="/login" className="enter">Entrar</Link>
            <Link to="/login" className="btn btn-white">Testar grátis</Link>
          </div>
          <button className="menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* -- HERO -- */}
      <section className="hero">
        <div className="wrap hero-grid">

          {/* -- left -- */}
          <div className="hero-left">
            <h1>Venda mais.<br/>Automatize mais.<br/>Cresça mais.</h1>
            <p className="lead">
              Cardápio digital, pedidos online, WhatsApp automático, estoque, motoboy, impressão automática e relatórios em uma única plataforma.
            </p>
            <div className="hero-cta">
              <Link to="/login" className="btn btn-white">
                Testar grátis
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
              <a href="#recursos" className="btn btn-ghost">
                Ver demonstração
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/></svg>
              </a>
            </div>
            <div className="social-proof">
              <div className="avatars">
                {AVATARS.map((id) => (
                  <span key={id} style={{ backgroundImage:`url('https://images.unsplash.com/photo-${id}?w=120')` }}/>
                ))}
              </div>
              <div>
                <b>+ de 500 negócios</b>
                <small>já utilizam a {platformName}</small>
              </div>
            </div>
          </div>

          {/* -- mockup -- */}
          <div className="mockup">

            {/* imagem do produto */}
            <img
              src={heroImage}
              alt={`Plataforma ${platformName} - laptop e smartphone`}
              className="mockup-img"
            />

            {/* floating cards */}
            <div className="float-cards">
              {[
                { bg:"#e8f0fe", color:"#3b82f6", title:"Pedido recebido",    sub:"Novo pedido #1005",           icon:<><path d="M3 13h11l3-4h2l3 4v3h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></> },
                { bg:"#e6f7f4", color:"#10b3a3", title:"Impressão enviada",  sub:"Pedido enviado para cozinha", icon:<><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M18.4 5.6l-2 2M7.6 16.4l-2 2"/></> },
                { bg:"#eceef2", color:"#3a3f4b", title:"Entrega iniciada",   sub:"Motoboy a caminho",           icon:<><circle cx="12" cy="6" r="2"/><path d="M10 22l2-7 3 2 2 5M12 15l-2-4 4-1 3 3"/></> },
                { bg:"#e7f8ec", color:"#22c55e", title:"Mensagem enviada",   sub:"Cliente notificado",          icon:<><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></> },
                { bg:"#e7f8ec", color:"#16a34a", title:"Pagamento aprovado", sub:"Pedido #1005 pago via Pix",   icon:<><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="8" cy="14.5" r="1.4"/></> },
              ].map(({ bg, color, title, sub, icon }) => (
                <div className="fcard" key={title}>
                  <div className="fi" style={{background:bg, color}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
                  </div>
                  <div><b>{title}</b><small>{sub}</small></div>
                </div>
              ))}
            </div>

          </div>{/* /mockup */}
        </div>{/* /hero-grid */}
      </section>

      {/* -- CATEGORIES -- */}
      <section className="cats-sec" id="recursos">
        <div className="wrap">
          <p className="eyebrow">Para todos os tipos de negócios</p>
          <div className="cat-grid">
            {CATS.map(({ key, label, path }) => (
              <div className="cat-card" key={key}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">{path}</svg>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- CAPABILITIES -- */}
      <section className="capabilities-sec" id="funcionalidades">
        <div className="wrap">
          <div className="capabilities-heading">
            <p className="eyebrow">Ecossistema Replymesh</p>
            <h2>Tudo que seu delivery precisa em um só lugar</h2>
            <p>Automatize pedidos, vendas, atendimento e gestão em uma única plataforma.</p>
          </div>

          <div className="capabilities-showcase">
            <div className="capabilities-product-copy">
              <span className="capabilities-kicker">Sua operação, conectada</span>
              <h3>Do primeiro pedido à entrega, tudo conversa.</h3>
              <p>Uma visão central para acompanhar vendas, equipe e clientes sem trocar de sistema.</p>
              <div className="capabilities-proof">
                <span><Icon name="CircleCheck" size={15} /> Implantação assistida</span>
                <span><Icon name="CircleCheck" size={15} /> Suporte especializado</span>
              </div>
            </div>
            <div className="capabilities-visual" aria-label="Painel administrativo e aplicativos Replymesh">
              <div className="capabilities-glow" />
              <img src={branding.landing_hero_image_url || "/mockup.png"} alt="Dashboard administrativo Replymesh em computador e celular" />
              <div className="delivery-status-card">
                <span className="delivery-status-icon"><Icon name="Truck" size={17} /></span>
                <span><strong>Entrega em andamento</strong><small>Pedido #1048 · 12 min</small></span>
                <i />
              </div>
            </div>
          </div>

          <div className="capabilities-grid">
            {CAPABILITIES.map((capability) => (
              <article className="capability-card" key={capability.title}>
                <span className="capability-icon" aria-hidden="true">
                  <Icon name={capability.icon} size={19} strokeWidth={1.65} />
                </span>
                <h3>{capability.title}</h3>
              </article>
            ))}
          </div>

          <div className="capabilities-cta">
            <div>
              <span className="capabilities-price">Preço sob consulta</span>
              <p>Soluções personalizadas para cada negócio</p>
            </div>
            <div className="capabilities-actions">
              <Link to="/login" className="btn btn-white">Solicitar Demonstração</Link>
              <a href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost">Falar no WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* -- CLIENTS -- */}
      <section className="test-sec" id="clientes">
        <div className="wrap">
          <p className="eyebrow">Empresas que estão com a gente</p>
          <h2 className="clients-title">Clientes e parceiros que usam {platformName}</h2>
          <div className={`client-logo-grid ${scrollClients ? "is-scrolling" : ""}`}>
            <div className="client-logo-track">
            {visibleClients.map((client, index) => {
              const card = (
                <>
                  <span className="client-logo-media">
                    {client.logo_url ? <img src={client.logo_url} alt={client.name} /> : <span>{client.name.slice(0, 2).toUpperCase()}</span>}
                  </span>
                  <strong>{client.name}</strong>
                  <small>{client.type || "Cliente"}</small>
                </>
              );

              return client.site_url ? (
                <a className="client-logo-card" href={client.site_url} target="_blank" rel="noreferrer" key={`${client.name}-${index}`} aria-hidden={scrollClients && index >= landingClients.length ? "true" : undefined}>
                  {card}
                </a>
              ) : (
                <div className="client-logo-card" key={`${client.name}-${index}`} aria-hidden={scrollClients && index >= landingClients.length ? "true" : undefined}>
                  {card}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section className="cta-sec">
        <div className="wrap">
          <div className="cta-box">
            <div className="cta-left">
              <h2>Seu delivery <span className="g">merece</span><br/>uma plataforma profissional.</h2>
              <p>Controle pedidos, entregas, estoque, atendimento e aumente suas vendas com a {platformName}.</p>
              <div className="cta-actions">
                <Link to="/login" className="btn btn-white">Testar grátis agora</Link>
                <a href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost">Plano empresarial</a>
              </div>
            </div>
            <img className="cta-bag" src="/bag.png" alt="Bolsa de entrega Replymesh"/>
          </div>
        </div>
      </section>

      {/* -- FOOTER -- */}
      <footer className="foot">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Link className="logo" to="/">
                <span className="mark"><img src={landingLogo} alt={platformName}/></span>
                {platformName}
              </Link>
              <p className="foot-about">A plataforma completa para deliverys e negócios de alimentação que querem vender mais e ter uma operação profissional.</p>
              <div className="socials">
                <a href={branding.instagram_url || undefined} target={branding.instagram_url ? "_blank" : undefined} rel="noreferrer" aria-label="Instagram" aria-disabled={!branding.instagram_url}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
                <a href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.7 12.3l-.3.4.6 2.2-2.3-.6-.4.2A8 8 0 1 1 12 4zm-3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.3l-1.5-.7c-.2-.1-.4-.1-.5.1l-.6.8c-.1.1-.2.2-.4.1-.6-.2-1.5-.6-2.4-1.5-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.3.1-.4l.4-.5c.1-.2.1-.3.2-.5 0-.1 0-.3-.1-.4l-.7-1.7c-.2-.4-.4-.5-.6-.5z"/></svg></a>
                <a href={branding.facebook_url || undefined} target={branding.facebook_url ? "_blank" : undefined} rel="noreferrer" aria-label="Facebook" aria-disabled={!branding.facebook_url}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V7c0-.6.4-1 1-1h2V3h-3a4 4 0 0 0-4 4v2H8v3h2v9h3v-9h2.5l.5-3H13z"/></svg></a>
                <a href={branding.youtube_url || undefined} target={branding.youtube_url ? "_blank" : undefined} rel="noreferrer" aria-label="YouTube" aria-disabled={!branding.youtube_url}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 8a3 3 0 0 0-2-2c-1.8-.5-8-.5-8-.5s-6.2 0-8 .5a3 3 0 0 0-2 2 31 31 0 0 0 0 8 3 3 0 0 0 2 2c1.8.5 8 .5 8 .5s6.2 0 8-.5a3 3 0 0 0 2-2 31 31 0 0 0 0-8zM10 15V9l5 3-5 3z"/></svg></a>
              </div>
            </div>
            <div className="foot-col"><h5>Produto</h5><Link to="/recursos">Recursos</Link><Link to="/funcionalidades">Funcionalidades</Link><Link to="/integracoes">Integrações</Link><Link to="/aplicativo">Aplicativo</Link></div>
            <div className="foot-col"><h5>Empresa</h5><Link to="/sobre-nos">Sobre nós</Link><Link to="/clientes">Clientes</Link><Link to="/blog">Blog</Link><Link to="/contato">Contato</Link></div>
            <div className="foot-col"><h5>Suporte</h5><Link to="/central-de-ajuda">Central de Ajuda</Link><Link to="/tutoriais">Tutoriais</Link><Link to="/status">Status do Sistema</Link><Link to="/fale-conosco">Fale Conosco</Link></div>
            <div className="foot-col">
              <h5>Fale com a gente</h5>
              <a className="contact-row" href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>{supportPhone}</a>
              <a className="contact-row" href={`mailto:${supportEmail}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>{supportEmail}</a>
              <div className="contact-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>{supportLocation}</div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 {platformName}. Todos os direitos reservados.</span>
            <Link to="/termos-de-uso">Termos de Uso</Link>
            <Link to="/politica-de-privacidade">Política de Privacidade</Link>
          </div>
        </div>
      </footer>

      {/* -- WHATSAPP -- */}
      <a className="wa-btn" href={`https://wa.me/${supportWhatsapp || DEFAULT_BRANDING.support_whatsapp}`} target="_blank" rel="noreferrer">
        Falar no WhatsApp
        <span className="wi">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2zm-3 6c.2 0 .4.1.6.5l.7 1.7c.1.1.1.3 0 .4l-.4.5c-.1.1-.2.2-.1.4.2.2.6 1 1.3 1.6.9.9 1.8 1.3 2.4 1.5.2.1.3 0 .4-.1l.6-.8c.1-.2.3-.2.5-.1l1.5.7c.3.1.5.2.6.3.1.1.1.6-.1 1.2-.2.6-1.2 1.1-1.7 1.2-.5.1-.9.2-3-.6-2.6-1-4.2-3.6-4.3-3.8-.1-.2-1-1.4-1-2.6s.6-1.8.9-2.1c.2-.3.5-.4.7-.4z"/></svg>
        </span>
      </a>

    </div>
  );
}
