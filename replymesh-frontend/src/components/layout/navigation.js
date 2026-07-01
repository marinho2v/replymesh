export const NAV = [
  { type: "item", id: "dashboard", label: "Visão Geral", icon: "LayoutDashboard", path: "/dashboard" },
  { type: "section", label: "Master" },
  { type: "item", id: "performance", label: "Performance", icon: "Activity", path: "/performance" },
  {
    type: "group",
    id: "empresas",
    label: "Empresas",
    icon: "Building2",
    children: [
      { id: "empresas:todas", label: "Todas as Empresas", path: "/empresas" },
      { id: "empresas:nova", label: "Nova Empresa", path: "/empresas/nova" },
      { id: "empresas:ativas", label: "Empresas Ativas", path: "/empresas?tab=ativas" },
      { id: "empresas:inativas", label: "Empresas Inativas", path: "/empresas?tab=inativas" },
      { id: "empresas:teste", label: "Empresas em Teste", path: "/empresas?tab=teste" },
    ],
  },
  {
    type: "group",
    id: "assinaturas",
    label: "Assinaturas",
    icon: "CreditCard",
    children: [
      { id: "assinaturas:visao", label: "Visão Geral", path: "/assinaturas" },
      { id: "assinaturas:faturas", label: "Faturas", path: "/assinaturas/faturas" },
      { id: "assinaturas:inadimplencia", label: "Inadimplência", path: "/assinaturas/inadimplencia" },
    ],
  },
  {
    type: "group",
    id: "whatsapp",
    label: "WhatsApp",
    icon: "MessageCircle",
    children: [
      { id: "whatsapp:instancias", label: "Instâncias", path: "/whatsapp" },
      { id: "whatsapp:qrcode", label: "QR Code", path: "/whatsapp/qrcode" },
      { id: "whatsapp:templates", label: "Templates", path: "/whatsapp/templates" },
      { id: "whatsapp:logs", label: "Logs", path: "/whatsapp/logs" },
    ],
  },
  {
    type: "group",
    id: "dominios",
    label: "Domínios",
    icon: "Globe",
    children: [
      { id: "dominios:todos", label: "Todos os Domínios", path: "/dominios" },
      { id: "dominios:dns", label: "Configuração DNS", path: "/dominios/dns" },
      { id: "dominios:ssl", label: "Certificados SSL", path: "/dominios/ssl" },
    ],
  },
  {
    type: "group",
    id: "financeiro",
    label: "Financeiro",
    icon: "Wallet",
    children: [
      { id: "financeiro:receita", label: "Receita", path: "/financeiro" },
      { id: "financeiro:repasses", label: "Repasses", path: "/financeiro/repasses" },
      { id: "financeiro:cobrancas", label: "Cobranças", path: "/financeiro/cobrancas" },
    ],
  },
  {
    type: "group",
    id: "usuarios",
    label: "Usuários Master",
    icon: "Users",
    children: [
      { id: "usuarios:todos", label: "Todos os Usuários", path: "/usuarios-master" },
      { id: "usuarios:funcoes", label: "Funções", path: "/usuarios-master/funcoes" },
      { id: "usuarios:convites", label: "Convites", path: "/usuarios-master/convites" },
    ],
  },
  {
    type: "group",
    id: "logs",
    label: "Logs",
    icon: "ScrollText",
    children: [
      { id: "logs:geral", label: "Geral", path: "/logs" },
      { id: "logs:auditoria", label: "Auditoria Master", path: "/logs/auditoria" },
      { id: "logs:atividades", label: "Atividades", path: "/logs/atividades" },
      { id: "logs:erros", label: "Erros", path: "/logs/erros" },
      { id: "logs:webhooks", label: "Webhooks", path: "/logs/webhooks" },
      { id: "logs:evolution", label: "WhatsApp", path: "/logs/evolution" },
      { id: "logs:automacoes", label: "Automacoes", path: "/logs/automacoes" },
    ],
  },
  { type: "section", label: "Suporte" },
  { type: "item", id: "android-apps", label: "Aplicativos Android", icon: "Smartphone", path: "/aplicativos-android" },
  {
    type: "group",
    id: "tickets",
    label: "Tickets",
    icon: "LifeBuoy",
    children: [
      { id: "tickets:abertos", label: "Abertos", path: "/tickets" },
      { id: "tickets:andamento", label: "Em andamento", path: "/tickets/andamento" },
      { id: "tickets:resolvidos", label: "Resolvidos", path: "/tickets/resolvidos" },
    ],
  },
  { type: "section", label: "Configurações" },
  { type: "item", id: "planos", label: "Planos", icon: "Layers", path: "/assinaturas/planos" },
  {
    type: "group",
    id: "configuracoes",
    label: "Configuracoes",
    icon: "Settings",
    children: [
      { id: "config:geral", label: "Geral", path: "/configuracoes/geral" },
      { id: "config:fundadores", label: "Programa Fundadores", path: "/configuracoes/programa-fundadores" },
      { id: "config:smtp", label: "SMTP / E-mail", path: "/configuracoes/smtp" },
      { id: "config:identidade", label: "Identidade Visual", path: "/configuracoes/identidade-visual" },
      { id: "config:redes", label: "Redes Sociais", path: "/configuracoes/redes-sociais" },
      { id: "config:entrega", label: "Entrega", path: "/configuracoes/entrega" },
      { id: "config:pix", label: "PIX", path: "/configuracoes/pix" },
      { id: "config:horarios", label: "Horarios", path: "/configuracoes/horarios" },
      { id: "config:whatsapp", label: "WhatsApp", path: "/configuracoes/whatsapp" },
      { id: "config:infra", label: "Infraestrutura / Dominios", path: "/configuracoes/infraestrutura" },
      { id: "config:ia", label: "IA", path: "/configuracoes/ia" },
      { id: "config:aparencia", label: "Aparencia / Marca", path: "/configuracoes/aparencia" },
      { id: "config:atualizacoes", label: "Atualizacoes", path: "/configuracoes/atualizacoes" },
    ],
  },
];

export const GROUP_IDS = ["performance", "empresas", "whatsapp", "assinaturas", "dominios", "financeiro", "usuarios", "tickets", "configuracoes"];

export function groupFromPath(pathname) {
  if (pathname.startsWith("/performance")) return "performance";
  if (pathname.startsWith("/empresas")) return "empresas";
  if (pathname.startsWith("/whatsapp")) return "whatsapp";
  if (pathname.startsWith("/assinaturas")) return "assinaturas";
  if (pathname.startsWith("/dominios")) return "dominios";
  if (pathname.startsWith("/financeiro")) return "financeiro";
  if (pathname.startsWith("/usuarios-master")) return "usuarios";
  if (pathname.startsWith("/tickets")) return "tickets";
  if (pathname.startsWith("/configuracoes")) return "configuracoes";
  return GROUP_IDS.includes(pathname.replace("/", "")) ? pathname.replace("/", "") : "empresas";
}
