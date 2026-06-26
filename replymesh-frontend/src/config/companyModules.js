export const CORE_MODULE_KEYS = ["dashboard", "products", "categories", "orders", "checkout"];

export const COMPANY_MODULES = [
  { key: "dashboard", label: "Dashboard", group: "Essenciais", description: "Visão geral da operação.", essential: true, dependencies: [] },
  { key: "products", label: "Produtos", group: "Essenciais", description: "Cadastro e organização de produtos.", essential: true, dependencies: [] },
  { key: "categories", label: "Categorias", group: "Essenciais", description: "Categorias do cardápio.", essential: true, dependencies: [] },
  { key: "orders", label: "Pedidos Online", group: "Essenciais", description: "Gestão e acompanhamento de pedidos.", essential: true, dependencies: ["products", "categories"] },
  { key: "checkout", label: "Checkout", group: "Essenciais", description: "Finalização segura de pedidos online.", essential: true, dependencies: ["orders", "products", "categories"] },
  { key: "reports", label: "Relatórios básicos", group: "Essenciais", description: "Indicadores essenciais da operação.", essential: false, dependencies: ["orders"] },
  { key: "delivery_zones", label: "Áreas de entrega", group: "Operação", description: "Bairros, áreas e taxas de entrega.", essential: false, dependencies: ["orders"] },
  { key: "delivery", label: "Delivery", group: "Operação", description: "Fluxo de entrega da loja.", essential: false, dependencies: ["orders", "products", "categories", "checkout", "delivery_zones"] },
  { key: "pos", label: "PDV / Balcão", group: "Operação", description: "Venda presencial e balcão.", essential: false, dependencies: ["products", "categories"] },
  { key: "tables", label: "Mesas", group: "Operação", description: "Mesas, QR Code e pedidos por mesa.", essential: false, dependencies: ["orders", "products", "categories"] },
  { key: "waiter", label: "Garçom", group: "Operação", description: "Atendimento, comandas e histórico por garçom.", essential: false, dependencies: ["tables"] },
  { key: "motoboy", label: "Motoboy", group: "Operação", description: "Cadastro e painel web do motoboy.", essential: false, dependencies: ["delivery"] },
  { key: "finance", label: "Financeiro", group: "Operação", description: "Caixa e controles financeiros.", essential: false, dependencies: ["orders"] },
  { key: "inventory", label: "Estoque", group: "Operação", description: "Itens e movimentações de estoque.", essential: false, dependencies: ["products"] },
  { key: "whatsapp_manual", label: "WhatsApp manual", group: "Comunicação", description: "Mensagens preparadas para envio pelo atendente.", essential: false, dependencies: ["orders"] },
  { key: "whatsapp_automatic", label: "WhatsApp automático", group: "Comunicação", description: "Conexão, templates e envios automáticos.", essential: false, dependencies: ["whatsapp_manual", "orders"] },
  { key: "whatsapp_templates", label: "Templates WhatsApp", group: "Comunicação", description: "Edição de mensagens automáticas.", essential: false, dependencies: ["whatsapp_manual"] },
  { key: "coupons", label: "Cupons", group: "Marketing", description: "Cupons e descontos.", essential: false, dependencies: ["orders", "checkout"] },
  { key: "promotions", label: "Promoções", group: "Marketing", description: "Campanhas e promoções públicas.", essential: false, dependencies: ["products"] },
  { key: "roulette", label: "Roleta premiada", group: "Marketing", description: "Roleta de prêmios e fidelização.", essential: false, dependencies: ["orders", "coupons"] },
  { key: "banners", label: "Banners", group: "Marketing", description: "Banners promocionais.", essential: false, dependencies: ["products"] },
  { key: "whatsapp_marketing", label: "Marketing via WhatsApp", group: "Marketing", description: "Campanhas via WhatsApp.", essential: false, dependencies: ["whatsapp_manual"] },
  { key: "abandoned_cart", label: "Recuperador de vendas", group: "Marketing", description: "Recuperação de clientes e vendas.", essential: false, dependencies: ["orders", "whatsapp_manual"] },
  { key: "mercado_pago", label: "Mercado Pago", group: "Pagamentos", description: "Integração com Mercado Pago.", essential: false, dependencies: ["orders", "checkout"] },
  { key: "pix", label: "PIX", group: "Pagamentos", description: "Pagamento PIX no checkout.", essential: false, dependencies: ["orders", "checkout"] },
  { key: "store_ai", label: "Inteligência Artificial", group: "Inteligência", description: "Atendimento inteligente da loja.", essential: false, dependencies: ["orders", "products", "categories"] },
  { key: "advanced_pizza", label: "Pizzaria avançada", group: "Segmentos", description: "Sabores, tamanhos e regras avançadas de pizza.", essential: false, dependencies: ["products", "categories"] },
  { key: "motoboy_app", label: "Aplicativo motoboy", group: "Aplicativos", description: "Aplicativo Android do motoboy.", essential: false, dependencies: ["motoboy"] },
  { key: "waiter_app", label: "Aplicativo garçom", group: "Aplicativos", description: "Aplicativo e fluxo operacional do garçom.", essential: false, dependencies: ["waiter"] },
  { key: "custom_domain", label: "Domínio próprio", group: "Domínio", description: "Uso de domínio personalizado.", essential: false, dependencies: [] },
];

export const COMPANY_MODULE_PRESETS = {
  basic: [...CORE_MODULE_KEYS, "reports", "whatsapp_manual"],
  operation: [...CORE_MODULE_KEYS, "reports", "whatsapp_manual", "delivery", "pos", "motoboy"],
  complete: COMPANY_MODULES.map((module) => module.key),
};

export const MODULE_PRESET_LABELS = {
  basic: "Básico",
  operation: "Operação",
  complete: "Completo",
  custom: "Personalizado",
};

export const MODULE_GROUP_LABELS = {
  essenciais: "Essenciais",
  operacao: "Operação",
  comunicacao: "Comunicação",
  marketing: "Marketing",
  pagamentos: "Pagamentos",
  inteligencia: "Inteligência",
  segmentos: "Segmentos",
  aplicativos: "Aplicativos",
  dominio: "Domínio",
};

export const groupedCompanyModules = COMPANY_MODULES.reduce((groups, module) => {
  const label = module.group || "Outros";
  groups[label] ||= [];
  groups[label].push(module);
  return groups;
}, {});
