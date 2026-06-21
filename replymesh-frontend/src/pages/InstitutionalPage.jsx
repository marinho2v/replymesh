import { Link } from "react-router-dom";
import { LandingLayout } from "../components/layout/LandingLayout.jsx";
import { Icon } from "../components/ui/Icon.jsx";
import "../styles/institutional.css";

const PAGES = {
  recursos: {
    eyebrow: "Produto",
    title: "Uma operação mais simples, do pedido à entrega.",
    description: "Centralize vendas, atendimento, equipe e gestão em uma plataforma preparada para a rotina do seu negócio.",
    icon: "Layers",
    highlights: [
      ["ShoppingBag", "Vendas conectadas", "Cardápio digital, pedidos online, PDV e atendimento no mesmo fluxo."],
      ["Truck", "Entrega organizada", "Áreas de entrega, motoboys e acompanhamento operacional em tempo real."],
      ["BarChart3", "Decisões melhores", "Indicadores claros para acompanhar vendas, produtos e desempenho."],
    ],
    details: ["Cardápio e produtos", "Pedidos e PDV", "Mesas e comandas", "Estoque", "Clientes", "Relatórios"],
  },
  funcionalidades: {
    eyebrow: "Produto",
    title: "Funcionalidades que trabalham juntas.",
    description: "Em vez de ferramentas isoladas, a Replymesh conecta os pontos mais importantes da operação.",
    icon: "Sparkles",
    highlights: [
      ["MessageCircle", "Automação de atendimento", "Mensagens, atualizações e recuperação de vendas pelo WhatsApp."],
      ["Store", "Salão e balcão", "Mesas, comandas, garçom e PDV integrados ao delivery."],
      ["Bot", "Inteligência aplicada", "Automação e IA para reduzir tarefas repetitivas no atendimento."],
    ],
    details: ["WhatsApp", "Aplicativo do motoboy", "Aplicativo do garçom", "Cupons", "Roleta", "Impressão automática"],
  },
  integracoes: {
    eyebrow: "Produto",
    title: "Integrações para uma operação sem retrabalho.",
    description: "Conecte pagamentos, comunicação e canais digitais preservando segurança e controle.",
    icon: "PlugZap",
    highlights: [
      ["MessageCircle", "WhatsApp", "Comunicação automatizada em etapas importantes do pedido."],
      ["CreditCard", "Mercado Pago", "Pix integrado e acompanhamento do pagamento dentro do fluxo."],
      ["Globe", "Domínio próprio", "Sua marca e seu endereço digital conectados à plataforma."],
    ],
    details: ["APIs seguras", "Webhooks", "Conexão por loja", "Auditoria", "Ambientes separados", "Suporte técnico"],
  },
  aplicativo: {
    eyebrow: "Produto",
    title: "Sua operação também cabe na palma da mão.",
    description: "Aplicativos para quem entrega, atende no salão e acompanha a marca de onde estiver.",
    icon: "Smartphone",
    highlights: [
      ["Truck", "App do motoboy", "Entregas, histórico e rotina do entregador em uma experiência direta."],
      ["Users", "App do garçom", "Pedidos de mesa e atendimento com acesso individual."],
      ["Palette", "Aplicativo da marca", "Uma presença digital personalizada para aproximar seus clientes."],
    ],
    details: ["Android", "Acesso individual", "Atualizações contínuas", "Identidade da marca", "Notificações", "Suporte"],
  },
  "sobre-nos": {
    eyebrow: "Empresa",
    title: "Tecnologia feita para a operação real.",
    description: "A Replymesh nasceu para transformar rotinas complexas em uma experiência simples, conectada e profissional.",
    icon: "Building2",
    highlights: [
      ["Store", "Próximos do negócio", "Desenvolvemos olhando para o dia a dia de deliverys e restaurantes."],
      ["Code2", "Produto em evolução", "Melhorias contínuas guiadas por operação, segurança e desempenho."],
      ["LifeBuoy", "Parceria de verdade", "Tecnologia acompanhada por implantação e suporte humano."],
    ],
    details: ["Produto brasileiro", "Visão de longo prazo", "Segurança", "Escalabilidade", "Atendimento humano", "Evolução contínua"],
  },
  clientes: {
    eyebrow: "Empresa",
    title: "Negócios que evoluem com a Replymesh.",
    description: "Cada operação tem sua identidade. A plataforma oferece uma base sólida para diferentes modelos de alimentação.",
    icon: "Users",
    highlights: [
      ["ShoppingBag", "Deliverys", "Venda online e operação organizada em uma única visão."],
      ["Store", "Restaurantes", "Salão, balcão, mesas e entrega trabalhando em conjunto."],
      ["TrendingUp", "Marcas em crescimento", "Estrutura para ganhar eficiência sem perder controle."],
    ],
    details: ["Hamburguerias", "Pizzarias", "Açaí", "Bebidas", "Marmitarias", "Restaurantes"],
  },
  blog: {
    eyebrow: "Empresa",
    title: "Conteúdo para vender melhor e operar com clareza.",
    description: "Estratégia, produto e boas práticas para negócios que querem crescer com organização.",
    icon: "ScrollText",
    highlights: [
      ["ShoppingBag", "Vendas digitais", "Como reduzir atrito e melhorar a jornada de compra."],
      ["Megaphone", "Marketing", "Relacionamento, campanhas e recuperação de clientes."],
      ["LayoutDashboard", "Gestão", "Indicadores e processos para decisões mais seguras."],
    ],
    details: ["Operação", "Delivery", "Atendimento", "Produto", "Tecnologia", "Crescimento"],
  },
  contato: {
    eyebrow: "Empresa",
    title: "Vamos conversar sobre a sua operação.",
    description: "Conte para nossa equipe o que seu negócio precisa e receba uma orientação objetiva.",
    icon: "MessageSquare",
    highlights: [
      ["MessageCircle", "WhatsApp", "Converse com um especialista sobre produto e implantação."],
      ["MailPlus", "E-mail", "Envie sua solicitação para contato@replymesh.com.br."],
      ["LifeBuoy", "Atendimento", "Direcionamos sua necessidade para a equipe certa."],
    ],
    details: ["Demonstração", "Implantação", "Comercial", "Parcerias", "Suporte", "Privacidade"],
    contact: true,
  },
  ajuda: {
    eyebrow: "Suporte",
    title: "Respostas para manter sua operação em movimento.",
    description: "Encontre orientação sobre acesso, configuração, pedidos, pagamentos e recursos da plataforma.",
    icon: "LifeBuoy",
    highlights: [
      ["LogIn", "Primeiros passos", "Acesso, configuração inicial e preparação da loja."],
      ["ShoppingBag", "Operação", "Pedidos, produtos, estoque, mesas e entregas."],
      ["Settings", "Configurações", "Domínio, usuários, pagamentos e integrações."],
    ],
    details: ["Conta e acesso", "Cardápio", "Pedidos", "WhatsApp", "Pagamentos", "Aplicativos"],
  },
  tutoriais: {
    eyebrow: "Suporte",
    title: "Aprenda no seu ritmo, com orientações diretas.",
    description: "Tutoriais organizados por etapa para sua equipe usar a Replymesh com confiança.",
    icon: "ScrollText",
    highlights: [
      ["ScrollText", "Começando", "Prepare os dados essenciais e publique sua operação."],
      ["ShoppingBag", "Vendendo", "Cadastre produtos, receba pedidos e organize o atendimento."],
      ["BarChart3", "Acompanhando", "Use relatórios e indicadores para evoluir a rotina."],
    ],
    details: ["Configuração inicial", "Produtos", "Pedidos", "Motoboys", "Marketing", "Relatórios"],
  },
  status: {
    eyebrow: "Suporte",
    title: "Transparência sobre a disponibilidade da plataforma.",
    description: "Acompanhe os principais componentes da Replymesh e os canais indicados para suporte.",
    icon: "Activity",
    highlights: [
      ["Globe", "Aplicação web", "Monitoramento contínuo dos acessos à plataforma."],
      ["Webhook", "APIs e integrações", "Acompanhamento dos serviços que conectam sua operação."],
      ["Radar", "Comunicação", "Análise de eventos que possam afetar notificações e automações."],
    ],
    details: ["Painel administrativo", "Lojas digitais", "APIs", "WhatsApp", "Pagamentos", "Aplicativos"],
    status: true,
  },
  suporte: {
    eyebrow: "Suporte",
    title: "Fale com quem entende da sua operação.",
    description: "Nossa equipe ajuda a direcionar dúvidas técnicas, operacionais e comerciais.",
    icon: "LifeBuoy",
    highlights: [
      ["LifeBuoy", "Suporte técnico", "Orientação sobre acesso, configuração e funcionamento."],
      ["MessageCircle", "Atendimento pelo WhatsApp", "Um canal direto para falar com a Replymesh."],
      ["MailPlus", "Atendimento por e-mail", "Registre sua solicitação com contexto e detalhes."],
    ],
    details: ["Dúvidas técnicas", "Acesso", "Configuração", "Incidentes", "Financeiro", "Comercial"],
    contact: true,
  },
};

export function InstitutionalPage({ page }) {
  const content = PAGES[page] || PAGES.recursos;

  return (
    <LandingLayout>
      <main className="institutional-page">
        <section className="institutional-hero">
          <div className="institutional-orb" />
          <div className="institutional-wrap">
            <span className="institutional-eyebrow">{content.eyebrow}</span>
            <span className="institutional-hero-icon"><Icon name={content.icon} size={24} /></span>
            <h1>{content.title}</h1>
            <p>{content.description}</p>
            <div className="institutional-actions">
              <Link className="btn btn-white" to="/login">Solicitar demonstração</Link>
              <a className="btn btn-ghost" href="https://wa.me/5511999999999" target="_blank" rel="noreferrer">Falar com especialista</a>
            </div>
          </div>
        </section>

        <section className="institutional-content">
          <div className="institutional-wrap">
            <div className="institutional-cards">
              {content.highlights.map(([icon, title, description]) => (
                <article className="institutional-card" key={title}>
                  <span><Icon name={icon} size={21} strokeWidth={1.7} /></span>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </article>
              ))}
            </div>

            <div className="institutional-detail-panel">
              <div>
                <span className="institutional-eyebrow">Visão completa</span>
                <h2>Estrutura profissional para o dia a dia.</h2>
              </div>
              <div className="institutional-tags">
                {content.details.map((detail) => <span key={detail}><Icon name="Check" size={14} /> {detail}</span>)}
              </div>
            </div>

            {content.status && (
              <div className="institutional-status">
                <i />
                <div><strong>Monitoramento ativo</strong><p>Se precisar confirmar uma ocorrência, fale com nosso suporte.</p></div>
                <Link to="/fale-conosco">Abrir atendimento</Link>
              </div>
            )}

            {content.contact && (
              <div className="institutional-contact">
                <div><span className="institutional-eyebrow">Contato direto</span><h2>Escolha o melhor canal.</h2></div>
                <a href="mailto:contato@replymesh.com.br"><Icon name="MailPlus" size={18} /> contato@replymesh.com.br</a>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"><Icon name="MessageCircle" size={18} /> Falar no WhatsApp</a>
              </div>
            )}
          </div>
        </section>
      </main>
    </LandingLayout>
  );
}
