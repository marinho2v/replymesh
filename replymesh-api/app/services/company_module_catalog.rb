class CompanyModuleCatalog
  ModuleDefinition = Struct.new(:key, :label, :group, :description, :features, :essential, keyword_init: true)

  DEFINITIONS = [
    ["menu", "Cardapio Digital", "essenciais", "Produtos, categorias e cardapio publico.", %w[products categories], true],
    ["orders", "Pedidos Online", "essenciais", "Gestao e acompanhamento de pedidos.", %w[orders], true],
    ["checkout", "Checkout", "essenciais", "Finalizacao de pedidos online.", %w[orders], true],
    ["reports", "Relatorios", "essenciais", "Indicadores basicos e avancados.", %w[basic_reports advanced_reports], false],
    ["dashboard", "Dashboard", "essenciais", "Visao geral da operacao.", %w[dashboard], false],
    ["pos", "PDV / Balcao", "operacao", "Venda presencial e balcao.", %w[pos_counter], false],
    ["tables", "Mesas", "operacao", "Mesas, QR Code e pedidos por mesa.", %w[tables table_qr table_menu table_orders], false],
    ["waiter", "Garcom", "operacao", "Atendimento, comandas e historico por garcom.", %w[waiter_accounts waiter_history waiter_commands], false],
    ["delivery", "Delivery", "operacao", "Areas e taxas de entrega.", %w[delivery_zones], false],
    ["motoboy", "Motoboy", "operacao", "Cadastro e painel web do motoboy.", %w[motoboys motoboy_panel], false],
    ["finance", "Financeiro", "operacao", "Caixa e controles financeiros.", %w[cashier], false],
    ["inventory", "Estoque", "operacao", "Itens e movimentacoes de estoque.", %w[inventory inventory_movements], false],
    ["coupons", "Cupons", "marketing", "Cupons e descontos.", %w[coupons], false],
    ["promotions", "Promocoes", "marketing", "Campanhas e promocoes publicas.", %w[promotions], false],
    ["roulette", "Roleta Premiada", "marketing", "Roleta de premios e fidelizacao.", %w[roulette], false],
    ["banners", "Banners", "marketing", "Banners promocionais.", %w[banners], false],
    ["whatsapp_marketing", "Marketing via WhatsApp", "marketing", "Campanhas via WhatsApp.", %w[marketing_whatsapp], false],
    ["abandoned_cart", "Recuperador de Vendas", "marketing", "Recuperacao de clientes e vendas.", %w[sales_recovery], false],
    ["whatsapp_manual", "WhatsApp Manual", "whatsapp", "Mensagens preparadas para envio pelo atendente.", %w[whatsapp_manual], false],
    ["whatsapp_automatic", "WhatsApp Automatico / Replymesh Connect", "whatsapp", "Conexao, templates e envios automaticos.", %w[whatsapp_basic whatsapp_templates], false],
    ["store_ai", "Inteligencia Artificial", "ia", "Atendimento inteligente da loja.", %w[store_ai], false],
    ["mercado_pago", "Mercado Pago", "pagamentos", "Integracao com Mercado Pago.", %w[mercado_pago], false],
    ["pix", "PIX", "pagamentos", "Pagamento PIX no checkout.", %w[pix], false],
    ["advanced_pizza", "Pizzaria Avancada", "segmentos", "Sabores, tamanhos e regras avancadas de pizza.", %w[advanced_pizza], false],
    ["motoboy_app", "Aplicativo Motoboy", "aplicativos", "Aplicativo Android do motoboy.", %w[motoboy_app], false],
    ["waiter_app", "Aplicativo Garcom", "aplicativos", "Aplicativo e fluxo operacional do garcom.", %w[waiter_app], false],
    ["custom_domain", "Dominio Proprio", "dominio", "Uso de dominio personalizado.", %w[custom_domain], false]
  ].map do |key, label, group, description, features, essential|
    ModuleDefinition.new(key:, label:, group:, description:, features:, essential:)
  end.freeze

  PRESETS = {
    "basic" => %w[menu orders checkout reports whatsapp_manual],
    "operation" => %w[menu orders checkout reports dashboard pos delivery motoboy finance inventory whatsapp_manual],
    "complete" => DEFINITIONS.map(&:key)
  }.freeze

  class << self
    def all = DEFINITIONS
    def keys = DEFINITIONS.map(&:key)
    def find(key) = DEFINITIONS.find { |item| item.key == key.to_s }
    def preset(key) = PRESETS.fetch(key.to_s, [])

    def serialize
      DEFINITIONS.map(&:to_h)
    end

    def access_map(company)
      modules = DEFINITIONS.map do |item|
        gates = item.features.map { |feature_key| FeatureGate.check(company, feature_key) }
        item.to_h.merge(
          enabled: gates.all?(&:enabled?),
          partial: gates.any?(&:enabled?) && !gates.all?(&:enabled?),
          sources: gates.map(&:source).uniq
        )
      end

      {
        modules:,
        enabled: modules.select { |item| item[:enabled] }.map { |item| item[:key] },
        disabled: modules.reject { |item| item[:enabled] }.map { |item| item[:key] }
      }
    end
  end
end
