export const COMPANIES = [
  { name: "Pizzaria do João", domain: "pizzariadojoao.replymesh.cloud", plan: "Profissional", status: "ativa", orders: 156, revenue: 5680, users: 4, created: "Hoje, 10:45", since: "12/03/2025" },
  { name: "Burger House", domain: "burgerhouse.replymesh.cloud", plan: "Profissional", status: "ativa", orders: 132, revenue: 4230, users: 3, created: "Hoje, 09:30", since: "28/02/2025" },
  { name: "Lanches do Zé", domain: "lanchesdoze.replymesh.cloud", plan: "Básico", status: "ativa", orders: 98, revenue: 2980, users: 2, created: "Ontem, 16:20", since: "15/01/2025" },
  { name: "Restaurante Sabor", domain: "restaurantesabor.replymesh.cloud", plan: "Profissional", status: "ativa", orders: 87, revenue: 3450, users: 5, created: "Ontem, 14:15", since: "03/01/2025" },
  { name: "Adega do Paulo", domain: "adegadopaulo.replymesh.cloud", plan: "Básico", status: "ativa", orders: 64, revenue: 1890, users: 2, created: "17 Mai, 11:30", since: "22/12/2024" },
  { name: "Açaí da Praia", domain: "acaidapraia.replymesh.cloud", plan: "Profissional", status: "teste", orders: 41, revenue: 0, users: 1, created: "16 Mai, 08:10", since: "16/05/2025" },
  { name: "Sushi Yamato", domain: "sushiyamato.replymesh.cloud", plan: "Enterprise", status: "ativa", orders: 203, revenue: 9120, users: 8, created: "15 Mai, 19:42", since: "01/11/2024" },
  { name: "Padaria Estrela", domain: "padariaestrela.replymesh.cloud", plan: "Básico", status: "inativa", orders: 0, revenue: 0, users: 1, created: "10 Mai, 12:00", since: "08/09/2024" },
  { name: "Cantina Bella", domain: "cantinabella.replymesh.cloud", plan: "Profissional", status: "teste", orders: 28, revenue: 0, users: 2, created: "09 Mai, 15:25", since: "09/05/2025" },
  { name: "Tacos México", domain: "tacosmexico.replymesh.cloud", plan: "Básico", status: "inativa", orders: 0, revenue: 0, users: 1, created: "02 Mai, 09:18", since: "14/07/2024" },
  { name: "Doce Mania", domain: "docemania.replymesh.cloud", plan: "Profissional", status: "ativa", orders: 119, revenue: 3980, users: 4, created: "28 Abr, 10:05", since: "20/03/2025" },
  { name: "Espetinho do Bairro", domain: "espetinhobairro.replymesh.cloud", plan: "Básico", status: "ativa", orders: 73, revenue: 2110, users: 2, created: "21 Abr, 18:50", since: "11/02/2025" },
];

export const WA_INSTANCES = [
  { name: "Pizzaria do João", number: "+55 11 98765-4321", status: "conectada", battery: 82, msgs: 1240, session: "Há 2 dias" },
  { name: "Burger House", number: "+55 11 97654-3210", status: "conectada", battery: 64, msgs: 980, session: "Há 5 dias" },
  { name: "Lanches do Zé", number: "+55 21 96543-2109", status: "conectada", battery: 91, msgs: 612, session: "Há 1 dia" },
  { name: "Restaurante Sabor", number: "+55 31 95432-1098", status: "desconectada", battery: 0, msgs: 0, session: "-" },
  { name: "Adega do Paulo", number: "+55 11 94321-0987", status: "conectada", battery: 47, msgs: 433, session: "Há 8 horas" },
  { name: "Sushi Yamato", number: "+55 11 93210-9876", status: "expirada", battery: 0, msgs: 0, session: "Há 14 dias" },
  { name: "Açaí da Praia", number: "-", status: "pendente", battery: 0, msgs: 0, session: "-" },
];

export const WA_TEMPLATES = [
  { name: "Confirmação de Pedido", category: "Transacional", status: "aprovado", lang: "pt_BR", uses: 4821, body: "Olá {{1}}! Seu pedido número {{2}} foi confirmado e já está em preparo." },
  { name: "Pedido a Caminho", category: "Transacional", status: "aprovado", lang: "pt_BR", uses: 3940, body: "{{1}}, seu pedido saiu para entrega! Previsão: {{2}} minutos." },
  { name: "Cupom de Boas-Vindas", category: "Marketing", status: "aprovado", lang: "pt_BR", uses: 1210, body: "Bem-vindo(a)! Use o cupom {{1}} e ganhe 15% no primeiro pedido." },
  { name: "Recuperação de Carrinho", category: "Marketing", status: "pendente", lang: "pt_BR", uses: 0, body: "{{1}}, você esqueceu alguns itens no carrinho. Finalize agora!" },
  { name: "Pesquisa de Satisfação", category: "Utilidade", status: "aprovado", lang: "pt_BR", uses: 880, body: "Como foi sua experiência com o pedido número {{1}}? Avalie de 1 a 5." },
  { name: "Promoção de Fim de Semana", category: "Marketing", status: "reprovado", lang: "pt_BR", uses: 0, body: "Fim de semana é dia de {{1}}! Confira nossas ofertas especiais." },
];

export const WA_LOGS = [
  { ts: "16:42:18", lv: "ok", inst: "Pizzaria do João", msg: "Mensagem entregue para +55 11 9****-1234 (template: confirmacao_pedido)" },
  { ts: "16:41:55", lv: "info", inst: "Burger House", msg: "Sessão sincronizada - 3 novas conversas recebidas" },
  { ts: "16:40:12", lv: "ok", inst: "Lanches do Zé", msg: "Mensagem entregue para +55 21 9****-9876" },
  { ts: "16:38:47", lv: "warn", inst: "Adega do Paulo", msg: "Bateria do dispositivo baixa (47%) - risco de desconexão" },
  { ts: "16:35:02", lv: "err", inst: "Restaurante Sabor", msg: "Falha ao enviar - instância desconectada (code 428)" },
  { ts: "16:33:21", lv: "info", inst: "Sushi Yamato", msg: "QR Code expirado - nova leitura necessária" },
  { ts: "16:30:09", lv: "ok", inst: "Pizzaria do João", msg: "Webhook recebido - status update: read" },
  { ts: "16:28:44", lv: "warn", inst: "Doce Mania", msg: "Rate limit próximo do limite (180/200 msgs/min)" },
  { ts: "16:25:17", lv: "ok", inst: "Espetinho do Bairro", msg: "Mensagem entregue para +55 11 9****-4567" },
  { ts: "16:22:50", lv: "info", inst: "Burger House", msg: "Template 'cupom_boas_vindas' enviado em massa (240 destinatários)" },
];

export const REVENUE_7D = [
  { l: "12 Mai", v: 17200 },
  { l: "13 Mai", v: 22400 },
  { l: "14 Mai", v: 26800 },
  { l: "15 Mai", v: 24100 },
  { l: "16 Mai", v: 28540 },
  { l: "17 Mai", v: 31200 },
  { l: "18 Mai", v: 37800 },
];

export const ACTIVITIES = [
  { icon: "Building2", t: 'Nova empresa "Pizzaria do João" criada', s: "Admin Master", time: "Hoje, 10:45" },
  { icon: "MessageCircle", t: "Instância WhatsApp conectada", s: "Burger House", time: "Hoje, 09:30" },
  { icon: "Crown", t: 'Plano "Profissional" atribuído', s: "Lanches do Zé", time: "Ontem, 16:20" },
  { icon: "Globe", t: "Domínio configurado", s: "Restaurante Sabor", time: "Ontem, 14:15" },
  { icon: "UserPlus", t: "Novo usuário administrador", s: "Adega do Paulo", time: "17 Mai, 11:30" },
];

export const ALERTS = [
  { tone: "amber", icon: "TriangleAlert", t: "2 instâncias WhatsApp desconectadas", s: "Ação necessária" },
  { tone: "blue", icon: "Info", t: "Backup automático concluído", s: "18 Mai, 03:00" },
];

export const PLAN_BADGE = { Básico: "gray", Profissional: "blue", Enterprise: "amber" };
export const STATUS_BADGE = { ativa: ["green", "Ativa"], inativa: ["gray", "Inativa"], teste: ["amber", "Em teste"] };
export const WA_STATUS = {
  conectada: ["green", "Conectada"],
  desconectada: ["red", "Desconectada"],
  expirada: ["gray", "Expirada"],
  pendente: ["amber", "Pendente"],
};
