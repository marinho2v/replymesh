export const COMPANY_MODULES = [
  { key: "menu", label: "Cardápio Digital", group: "Essenciais", essential: true },
  { key: "orders", label: "Pedidos Online", group: "Essenciais", essential: true },
  { key: "checkout", label: "Checkout", group: "Essenciais", essential: true },
  { key: "reports", label: "Relatórios", group: "Essenciais" },
  { key: "dashboard", label: "Dashboard", group: "Essenciais" },
  { key: "pos", label: "PDV / Balcão", group: "Operação" },
  { key: "tables", label: "Mesas", group: "Operação" },
  { key: "waiter", label: "Garçom", group: "Operação" },
  { key: "delivery", label: "Delivery", group: "Operação" },
  { key: "motoboy", label: "Motoboy", group: "Operação" },
  { key: "finance", label: "Financeiro", group: "Operação" },
  { key: "inventory", label: "Estoque", group: "Operação" },
  { key: "whatsapp_manual", label: "WhatsApp Manual", group: "WhatsApp" },
  { key: "whatsapp_automatic", label: "WhatsApp Automático", group: "WhatsApp" },
  { key: "coupons", label: "Cupons", group: "Marketing" },
  { key: "promotions", label: "Promoções", group: "Marketing" },
  { key: "roulette", label: "Roleta Premiada", group: "Marketing" },
  { key: "banners", label: "Banners", group: "Marketing" },
  { key: "whatsapp_marketing", label: "Marketing via WhatsApp", group: "Marketing" },
  { key: "abandoned_cart", label: "Recuperador de Vendas", group: "Marketing" },
  { key: "store_ai", label: "Inteligência Artificial", group: "IA" },
  { key: "mercado_pago", label: "Mercado Pago", group: "Pagamentos" },
  { key: "pix", label: "PIX", group: "Pagamentos" },
  { key: "advanced_pizza", label: "Pizzaria Avançada", group: "Segmentos" },
  { key: "motoboy_app", label: "Aplicativo Motoboy", group: "Aplicativos" },
  { key: "waiter_app", label: "Aplicativo Garçom", group: "Aplicativos" },
  { key: "custom_domain", label: "Domínio Próprio", group: "Domínio" },
];

export const COMPANY_MODULE_PRESETS = {
  basic: ["menu", "orders", "checkout", "reports", "whatsapp_manual"],
  operation: ["menu", "orders", "checkout", "reports", "dashboard", "pos", "delivery", "motoboy", "finance", "inventory", "whatsapp_manual"],
  complete: COMPANY_MODULES.map((item) => item.key),
};

export const groupedCompanyModules = COMPANY_MODULES.reduce((groups, item) => {
  groups[item.group] ||= [];
  groups[item.group].push(item);
  return groups;
}, {});
