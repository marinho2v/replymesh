class FeatureCatalog
  Feature = Struct.new(:key, :label, :group, :minimum_plan, :description, keyword_init: true)

  START = %w[
    dashboard orders products categories customers delivery_zones motoboys
    motoboy_panel cashier basic_reports users whatsapp_basic support updates
  ].freeze

  PRO = %w[
    store_ai whatsapp_templates marketing_whatsapp sales_recovery coupons roulette
    inventory inventory_movements motoboy_app tables table_qr table_menu table_orders
    waiter_app waiter_accounts waiter_history waiter_commands advanced_reports
    priority_support
  ].freeze

  DEFINITIONS = [
    ["dashboard", "Dashboard", "start", "core", "Visao geral da operacao."],
    ["orders", "Pedidos", "start", "vendas", "Pedidos online e pedidos de balcao."],
    ["products", "Produtos", "start", "vendas", "Cadastro de produtos."],
    ["categories", "Categorias", "start", "vendas", "Cadastro de categorias."],
    ["customers", "Clientes", "start", "vendas", "Base de clientes."],
    ["delivery_zones", "Areas de entrega", "start", "entrega", "Zonas e taxas de entrega."],
    ["motoboys", "Cadastro de motoboys", "start", "entrega", "Cadastro e gestao de motoboys."],
    ["motoboy_panel", "Painel web do motoboy", "start", "entrega", "Painel web para entregadores."],
    ["cashier", "Caixa", "start", "gestao", "Abertura, fechamento e movimentos de caixa."],
    ["basic_reports", "Relatorios basicos", "start", "gestao", "Indicadores essenciais da loja."],
    ["users", "Usuarios", "start", "gestao", "Usuarios da loja."],
    ["whatsapp_basic", "WhatsApp basico", "start", "whatsapp", "Conexao e mensagens automaticas basicas de pedido."],
    ["support", "Suporte basico", "start", "suporte", "Suporte padrao."],
    ["updates", "Atualizacoes", "start", "suporte", "Comunicados e atualizacoes do sistema."],
    ["store_ai", "IA da Loja", "pro", "ia_automacao", "Atendimento automatico da loja no WhatsApp."],
    ["whatsapp_templates", "Templates WhatsApp", "pro", "ia_automacao", "Edicao de templates de mensagens."],
    ["marketing_whatsapp", "Marketing WhatsApp", "pro", "ia_automacao", "Campanhas de WhatsApp."],
    ["sales_recovery", "Recuperador de vendas", "pro", "ia_automacao", "Recuperacao de clientes inativos."],
    ["coupons", "Cupons", "pro", "fidelizacao", "Cupons e descontos."],
    ["roulette", "Roleta premiada", "pro", "fidelizacao", "Roleta de premios."],
    ["inventory", "Controle de estoque", "pro", "estoque", "Itens e saldo de estoque."],
    ["inventory_movements", "Movimentacoes de estoque", "pro", "estoque", "Historico e ajustes de estoque."],
    ["motoboy_app", "Aplicativo Android do motoboy", "pro", "aplicativos", "Solicitacao de app Android para motoboy."],
    ["tables", "Gestao de mesas", "pro", "restaurante_salao", "Cadastro e controle de mesas."],
    ["table_qr", "QR Code por mesa", "pro", "restaurante_salao", "QR Code individual por mesa."],
    ["table_menu", "Cardapio por mesa", "pro", "restaurante_salao", "Cardapio digital para mesa."],
    ["table_orders", "Pedido direto da mesa", "pro", "restaurante_salao", "Pedidos vinculados a mesa."],
    ["waiter_app", "Aplicativo do garcom", "pro", "restaurante_salao", "Fluxo operacional do garcom."],
    ["waiter_accounts", "Login individual por garcom", "pro", "restaurante_salao", "Usuarios individuais de garcom."],
    ["waiter_history", "Historico por garcom", "pro", "restaurante_salao", "Historico de atendimento por garcom."],
    ["waiter_commands", "Comandas", "pro", "restaurante_salao", "Comandas e consumo de mesa."],
    ["advanced_reports", "Relatorios avancados", "pro", "gestao_avancada", "Relatorios detalhados."],
    ["priority_support", "Suporte prioritario", "pro", "gestao_avancada", "Atendimento priorizado."]
  ].map { |key, label, minimum_plan, group, description| Feature.new(key:, label:, group:, minimum_plan:, description:) }.freeze

  PLAN_COPY = {
    "start" => "Para delivery, hamburguerias, pizzarias, acaiterias e pequenos negocios.",
    "pro" => "Tudo do START mais IA, automacao, fidelizacao, estoque, salao e gestao avancada."
  }.freeze

  PLAN_ORDER = { "start" => 0, "pro" => 1 }.freeze

  ALIASES = {
    "pedidos" => "orders",
    "produtos" => "products",
    "categorias" => "categories",
    "clientes" => "customers",
    "areas_entrega" => "delivery_zones",
    "caixa" => "cashier",
    "relatorios_basicos" => "basic_reports",
    "usuarios" => "users",
    "suporte" => "support",
    "atualizacoes" => "updates",
    "whatsapp_conectado" => "whatsapp_basic",
    "mensagens_pedido_recebido" => "whatsapp_basic",
    "mensagens_pedido_aceito" => "whatsapp_basic",
    "mensagens_pedido_entrega" => "whatsapp_basic",
    "mensagens_pedido_finalizado" => "whatsapp_basic",
    "ia_loja" => "store_ai",
    "templates_whatsapp" => "whatsapp_templates",
    "recuperador_vendas" => "sales_recovery",
    "cupons" => "coupons",
    "roleta" => "roulette",
    "estoque" => "inventory",
    "movimentacoes_estoque" => "inventory_movements",
    "aplicativo_android" => "motoboy_app",
    "mesas" => "tables",
    "relatorios_avancados" => "advanced_reports",
    "suporte_premium" => "priority_support"
  }.freeze

  class << self
    def all = DEFINITIONS

    def keys = DEFINITIONS.map(&:key)

    def canonical_key(key)
      value = key.to_s
      ALIASES[value] || value
    end

    def find(key)
      normalized = canonical_key(key)
      DEFINITIONS.find { |feature| feature.key == normalized }
    end

    def features_for_plan(slug)
      normalized = normalize_plan_slug(slug)
      DEFINITIONS.select { |feature| PLAN_ORDER[feature.minimum_plan] <= PLAN_ORDER.fetch(normalized, 0) }.map(&:key)
    end

    def required_plan_for(key)
      find(key)&.minimum_plan || "pro"
    end

    def normalize_plan_slug(slug)
      value = slug.to_s.downcase.parameterize
      return "start" if value.blank? || value.in?(%w[basico basic starter essencial])
      return "pro" if value.in?(%w[profissional professional plus enterprise empresarial])

      value.in?(PLAN_ORDER.keys) ? value : "start"
    end

    def serialize
      DEFINITIONS.map { |feature| feature.to_h.merge(required_plan_label: required_plan_label(feature.minimum_plan)) }
    end

    def required_plan_label(slug)
      normalize_plan_slug(slug).upcase
    end
  end
end
