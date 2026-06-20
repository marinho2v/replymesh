import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";
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

const FEATS = [
  { key: "menu",    title: "Cardápio Online",           desc: "Tenha um cardápio moderno e receba pedidos pelo seu próprio site.",           path: <><rect x="4" y="3" width="16" height="13" rx="2"/><path d="M2 20h20M8 8h8M8 11h5"/></> },
  { key: "orders",  title: "Gestão de Pedidos",         desc: "Gerencie todos os pedidos em tempo real de forma simples e eficiente.",       path: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></> },
  { key: "wa",      title: "WhatsApp Automático",       desc: "Mensagens e atualizações enviadas automaticamente para seus clientes.",       path: <path d="M12 3a9 9 0 0 0-7.9 13.3L3 21l4.8-1.2A9 9 0 1 0 12 3z"/> },
  { key: "moto",    title: "Gestão de Motoboys",        desc: "Acompanhe entregas, atribua pedidos e gerencie seus motoboys.",              path: <><circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M8.5 17h7l-2-6h-3M13 11l1-3h2"/></> },
  { key: "report",  title: "Relatórios Inteligentes",   desc: "Relatórios completos de vendas, produtos, entregas e performance.",          path: <path d="M4 20V10M9 20V4M14 20v-7M19 20V8"/> },
  { key: "stock",   title: "Controle de Estoque",       desc: "Controle seus produtos, estoque mínimo, entradas e saídas.",                 path: <><path d="M3 8l9-4 9 4v8l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v8"/></> },
  { key: "gift",    title: "Promoções e Fidelização",   desc: "Roleta de prêmios, cupons, promoções e programa de fidelidade.",             path: <><rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 13h18M12 9v11M12 9c-1-3-5-3-5-1s4 1 5 1zM12 9c1-3 5-3 5-1s-4 1-5 1z"/></> },
  { key: "print",   title: "Impressão Automática",      desc: "Pedidos impressos automaticamente para cozinha.",                            path: <><rect x="6" y="3" width="12" height="6"/><path d="M6 14H4a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></> },
  { key: "multi",   title: "Multiunidades",             desc: "Gerencie várias unidades e funcionários em um único painel.",                path: <path d="M4 21V8l6-4v17M10 21V11l8-3v13M4 21h16M7 11h0M7 14h0M14 13h0M14 16h0"/> },
  { key: "bell",    title: "Notificações Inteligentes", desc: "Avisos e alertas importantes para você e sua equipe.",                       path: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 0 0 4 0"/></> },
  { key: "panel",   title: "Painel Administrativo",     desc: "Tudo o que você precisa em um painel completo e intuitivo.",                 path: <><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 20h18M7 9h4M7 13h7"/><circle cx="16" cy="9" r="1.5"/></> },
  { key: "support", title: "Suporte Especializado",     desc: "Suporte rápido e humanizado sempre que você precisar.",                      path: <path d="M5 12a7 7 0 0 1 14 0M3 14a2 2 0 0 1 2-2h1v5H5a2 2 0 0 1-2-2zM21 14a2 2 0 0 0-2-2h-1v5h1a2 2 0 0 0 2-2z"/> },
];

const SHOWCASE = [
  { title: "Gestão de Pedidos",    desc: "Acompanhe todos os pedidos em tempo real",           type: "orders" },
  { title: "Produtos e Cardápio",  desc: "Organize produtos, categorias e adicionais",         type: "food"   },
  { title: "Estoque Inteligente",  desc: "Controle entradas, saídas e estoque mínimo",         type: "table"  },
  { title: "Área do Motoboy",      desc: "Acompanhe entregas em tempo real",                   type: "map"    },
  { title: "Relatórios Completos", desc: "Gráficos e indicadores para decisões inteligentes",  type: "chart"  },
];

const FOOD_IMGS = [
  "1513104890138-7c749659a591",
  "1568901346375-23c9450c58cd",
  "1571091718767-18b5b1457add",
  "1565299624946-b28f40a0ae38",
];

const formatPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value || "";
};

/* --- showcase screens --- */

function ShowcaseScreen({ type }) {
  const ScTop = () => (
    <div className="sc-top"><i /><i /><i /></div>
  );

  if (type === "orders") return (
    <div className="show-screen">
      <ScTop />
      <div style={{ height: "calc(100% - 20px)", padding: 8 }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 4px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ width:18, height:18, borderRadius:5, background:"#1c2230", flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ height:5, width:"60%", background:"#2a3040", borderRadius:3, marginBottom:4 }} />
              <div style={{ height:4, width:"35%", background:"#1a1f2b", borderRadius:3 }} />
            </div>
            <div style={{ width:28, height:9, borderRadius:4, background: i%4===2 ? "#3a1f24":"#16331f" }} />
          </div>
        ))}
      </div>
    </div>
  );

  if (type === "food") return (
    <div className="show-screen">
      <ScTop />
      <div style={{ height: "calc(100% - 20px)", padding: 8 }}>
        {FOOD_IMGS.map((u) => (
          <div key={u} style={{ display:"flex", gap:7, alignItems:"center", padding:"6px 4px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ width:24, height:24, borderRadius:5, backgroundImage:`url('https://images.unsplash.com/photo-${u}?w=80')`, backgroundSize:"cover", flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ height:5, width:"55%", background:"#2a3040", borderRadius:3, marginBottom:4 }} />
              <div style={{ height:4, width:"30%", background:"#1a1f2b", borderRadius:3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (type === "table") return (
    <div className="show-screen">
      <ScTop />
      <div style={{ height: "calc(100% - 20px)", padding: 10 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ display:"flex", gap:8, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
            {Array.from({ length: 4 }, (__, j) => (
              <div key={j} style={{ height:5, flex:1, background:"#222836", borderRadius:3 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (type === "map") return (
    <div className="show-screen">
      <ScTop />
      <div style={{ height:"calc(100% - 20px)", background:"linear-gradient(135deg,#1a2530,#0e1620)", position:"relative" }}>
        <svg width="100%" height="100%" style={{ position:"absolute", inset:0 }}>
          <path d="M10 90 Q60 60 110 80 T210 50" fill="none" stroke="#f5b50a" strokeWidth="2" strokeDasharray="4 3"/>
          <circle cx="10" cy="90" r="5" fill="#3b82f6"/>
          <circle cx="195" cy="52" r="6" fill="#ef4444"/>
        </svg>
      </div>
    </div>
  );

  const bars = [40,70,30,85,55,75,45];
  return (
    <div className="show-screen">
      <ScTop />
      <div style={{ height:"calc(100% - 20px)", padding:14, display:"flex", alignItems:"flex-end", gap:5 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex:1, height:`${h}%`, background:"linear-gradient(180deg,#3b82f6,#1d4ed8)", borderRadius:"3px 3px 0 0" }} />
        ))}
      </div>
    </div>
  );
}

/* --- componente principal --- */

export function LandingPage() {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

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
          <nav className="nav-links">
            <a href="#" className="active">Início</a>
            <a href="#recursos">Recursos</a>
            <a href="#">Soluções
              <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{width:13,height:13,opacity:.7}}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </a>
            <a href="#planos">Planos</a>
            <a href="#clientes">Clientes</a>
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

      {/* -- FEATURES -- */}
      <section className="feat-sec">
        <div className="wrap">
          <div className="feat-panel">
            <div className="feat-grid">
              <div className="feat-title">
                Muito mais que<br/>um cardápio digital
                <div className="ln"/>
              </div>
              {FEATS.map(({ key, title, desc, path }) => (
                <div className="feat" key={key}>
                  <div className="fic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">{path}</svg>
                  </div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- SHOWCASE -- */}
      <section className="show-sec">
        <div className="wrap">
          <p className="eyebrow">Conheça a Replymesh por dentro</p>
          <div className="show-grid">
            {SHOWCASE.map(({ title, desc, type }) => (
              <div className="show-card" key={type}>
                <ShowcaseScreen type={type}/>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- PRICING -- */}
      <section className="price-sec" id="planos">
        <div className="wrap">
          <p className="eyebrow">Planos que cabem no seu negócio</p>
          <div className="price-grid">

            {/* -- START -- */}
            <div className="price-card">
              <div className="pname">START</div>
              <div className="psub">Para delivery, hamburguerias, pizzarias,<br/>açaiterias e pequenos negócios.</div>
              <div className="price-amt"><span className="cur">R$ </span><span className="num">299</span><span className="per">/mês</span></div>
              <Link to="/login" className="btn btn-ghost" style={{width:"100%", justifyContent:"center", marginBottom:20}}>Começar agora</Link>

              <div className="plan-section">
                <div className="plan-sec-title">Vendas</div>
                <ul className="plist">
                  {["Cardápio Digital","Pedidos Online","Pedidos Balcão (PDV)","Produtos e Categorias","Clientes"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Entrega</div>
                <ul className="plist">
                  {["Áreas de Entrega","Cadastro de Motoboys","Painel Web do Motoboy"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">WhatsApp</div>
                <ul className="plist">
                  {["Conexão com WhatsApp","Pedido Recebido Automático","Pedido Aceito Automático","Pedido Saiu para Entrega","Pedido Entregue"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Gestão</div>
                <ul className="plist">
                  {["Caixa","Relatórios Básicos","Usuários"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Suporte</div>
                <ul className="plist">
                  {["Atualizações","Suporte Básico"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* -- PRO -- */}
            <div className="price-card pop">
              <span className="pop-tag">MAIS ESCOLHIDO</span>
              <div className="pname">PRO</div>
              <div className="psub">Para quem quer crescer com IA,<br/>fidelização e gestão completa.</div>
              <div className="price-amt"><span className="cur">R$ </span><span className="num">499</span><span className="per">/mês</span></div>
              <div className="price-note">Tudo do START +</div>
              <Link to="/login" className="btn btn-white" style={{width:"100%", justifyContent:"center", marginBottom:20}}>Começar agora</Link>

              <div className="plan-section">
                <div className="plan-sec-title">IA e Automação</div>
                <ul className="plist">
                  {["IA da Loja no WhatsApp","Atendimento Automático 24h","Templates WhatsApp","Marketing WhatsApp","Recuperador de Vendas"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Fidelização</div>
                <ul className="plist">
                  {["Cupons","Roleta Premiada"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Estoque</div>
                <ul className="plist">
                  {["Controle de Estoque","Movimentações de Estoque"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Aplicativos</div>
                <ul className="plist">
                  {["Aplicativo Android do Motoboy"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Restaurante e Salão</div>
                <ul className="plist">
                  {["Gestão de Mesas","QR Code por Mesa","Cardápio Digital por Mesa","Pedido Direto da Mesa","Aplicativo do Garçom","Login Individual por Garçom","Comandas","Histórico por Garçom","Controle de Atendimento","Fluxo Completo Salão + Delivery"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-section">
                <div className="plan-sec-title">Gestão Avançada</div>
                <ul className="plist">
                  {["Relatórios Avançados","Suporte Prioritário"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* -- ENTERPRISE -- */}
            <div className="price-card">
              <div className="pname">Enterprise</div>
              <div className="psub">Para grandes operações e redes</div>
              <div className="price-amt"><span className="num" style={{fontSize:32}}>Sob consulta</span></div>
              <a href={`https://wa.me/${supportWhatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{width:"100%", justifyContent:"center", marginBottom:20}}>Falar com especialista</a>
              <div className="plan-section">
                <div className="plan-sec-title">Tudo do PRO +</div>
                <ul className="plist">
                  {["Multiunidades","App Android Personalizado","Integrações Exclusivas","Domínio Próprio","Treinamento Presencial","Gerente de Conta","Suporte Dedicado 24h"].map((i) => (
                    <li key={i}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 6L9 17l-5-5"/></svg>{i}</li>
                  ))}
                </ul>
              </div>
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
            <div className="foot-col"><h5>Produto</h5><a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="#">Integrações</a><a href="#">Aplicativo</a></div>
            <div className="foot-col"><h5>Empresa</h5><a href="#">Sobre nós</a><a href="#clientes">Clientes</a><a href="#">Blog</a><a href="#">Contato</a></div>
            <div className="foot-col"><h5>Suporte</h5><a href="#">Central de Ajuda</a><a href="#">Tutoriais</a><a href="#">Status do Sistema</a><a href="#">Fale Conosco</a></div>
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
