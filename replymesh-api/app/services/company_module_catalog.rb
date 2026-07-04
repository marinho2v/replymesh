class CompanyModuleCatalog
  ModuleDefinition = Struct.new(
    :key, :label, :group, :description, :features, :essential, :dependencies,
    keyword_init: true
  )

  DEFINITIONS = [
    ["dashboard", "Dashboard", "essenciais", "Visao geral da operacao.", %w[dashboard], true, []],
    ["products", "Produtos", "essenciais", "Cadastro e organizacao de produtos.", %w[products], true, []],
    ["categories", "Categorias", "essenciais", "Categorias do cardapio.", %w[categories], true, []],
    ["orders", "Pedidos Online", "essenciais", "Gestao e acompanhamento de pedidos.", %w[orders], true, %w[products categories]],
    ["checkout", "Checkout", "essenciais", "Finalizacao segura de pedidos online.", %w[checkout], true, %w[orders products categories]],
    ["reports", "Relatorios Basicos", "essenciais", "Indicadores essenciais da operacao.", %w[basic_reports], false, %w[orders]],
    ["delivery", "Delivery", "operacao", "Fluxo de entrega da loja.", %w[delivery_zones], false, %w[orders products categories checkout delivery_zones]],
    ["delivery_zones", "Areas de Entrega", "operacao", "Bairros, areas e taxas de entrega.", %w[delivery_zones], false, %w[orders]],
    ["pos", "PDV / Balcao", "operacao", "Venda presencial e balcao.", %w[pos_counter], false, %w[products categories]],
    ["tables", "Mesas", "operacao", "Mesas, QR Code e pedidos por mesa.", %w[tables table_qr table_menu table_orders], false, %w[orders products categories]],
    ["waiter", "Garcom", "operacao", "Atendimento, comandas e historico por garcom.", %w[waiter_accounts waiter_history waiter_commands], false, %w[tables]],
    ["motoboy", "Motoboy", "operacao", "Cadastro e painel web do motoboy.", %w[motoboys motoboy_panel], false, %w[delivery]],
    ["finance", "Financeiro", "operacao", "Caixa e controles financeiros.", %w[cashier], false, %w[orders]],
    ["inventory", "Estoque", "operacao", "Itens e movimentacoes de estoque.", %w[inventory inventory_movements], false, %w[products]],
    ["whatsapp_manual", "WhatsApp Manual", "comunicacao", "Mensagens preparadas para envio pelo atendente.", %w[whatsapp_manual], false, %w[orders]],
    ["whatsapp_automatic", "WhatsApp Automatico / Replymesh Connect", "comunicacao", "Conexao, templates e envios automaticos.", %w[whatsapp_basic], false, %w[whatsapp_manual orders]],
    ["whatsapp_templates", "Templates WhatsApp", "comunicacao", "Edicao de mensagens automaticas.", %w[whatsapp_templates], false, %w[whatsapp_manual]],
    ["coupons", "Cupons", "marketing", "Cupons e descontos.", %w[coupons], false, %w[orders checkout]],
    ["promotions", "Promocoes", "marketing", "Campanhas e promocoes publicas.", %w[promotions], false, %w[products]],
    ["roulette", "Roleta Premiada", "marketing", "Roleta de premios e fidelizacao.", %w[roulette], false, %w[orders coupons]],
    ["banners", "Banners", "marketing", "Banners promocionais.", %w[banners], false, %w[products]],
    ["whatsapp_marketing", "Marketing via WhatsApp", "marketing", "Campanhas via WhatsApp.", %w[marketing_whatsapp], false, %w[whatsapp_manual]],
    ["abandoned_cart", "Automacao Inteligente", "marketing", "Recuperacao automatica de carrinhos e clientes.", %w[sales_recovery], false, %w[orders whatsapp_manual]],
    ["mercado_pago", "Mercado Pago", "pagamentos", "Integracao com Mercado Pago.", %w[mercado_pago], false, %w[orders checkout]],
    ["pix", "PIX", "pagamentos", "Pagamento PIX no checkout.", %w[pix], false, %w[orders checkout]],
    ["store_ai", "Inteligencia Artificial", "inteligencia", "Atendimento inteligente da loja.", %w[store_ai], false, %w[orders products categories]],
    ["advanced_pizza", "Pizzaria Avancada", "segmentos", "Sabores, tamanhos e regras avancadas de pizza.", %w[advanced_pizza], false, %w[products categories]],
    ["motoboy_app", "Aplicativo Motoboy", "aplicativos", "Aplicativo Android do motoboy.", %w[motoboy_app], false, %w[motoboy]],
    ["waiter_app", "Aplicativo Garcom", "aplicativos", "Aplicativo e fluxo operacional do garcom.", %w[waiter_app], false, %w[waiter]],
    ["custom_domain", "Dominio Proprio", "dominio", "Uso de dominio personalizado.", %w[custom_domain], false, []]
  ].map do |key, label, group, description, features, essential, dependencies|
    ModuleDefinition.new(key:, label:, group:, description:, features:, essential:, dependencies:)
  end.freeze

  CORE_KEYS = DEFINITIONS.select(&:essential).map(&:key).freeze
  CORE_FEATURES = DEFINITIONS.select(&:essential).flat_map(&:features).uniq.freeze

  PRESETS = {
    "basic" => (CORE_KEYS + %w[reports whatsapp_manual]).uniq,
    "operation" => (CORE_KEYS + %w[reports whatsapp_manual delivery pos motoboy]).uniq,
    "founder_free" => (CORE_KEYS + %w[
      reports delivery delivery_zones pos tables motoboy whatsapp_manual coupons
      promotions roulette banners pix
    ]).uniq,
    "complete" => DEFINITIONS.map(&:key)
  }.freeze

  class << self
    def all = DEFINITIONS
    def keys = DEFINITIONS.map(&:key)
    def find(key) = DEFINITIONS.find { |item| item.key == key.to_s }
    def preset(key) = PRESETS.fetch(key.to_s, [])
    def core_feature?(key) = CORE_FEATURES.include?(FeatureCatalog.canonical_key(key))

    def normalize_selection(module_keys)
      selected = (Array(module_keys).map(&:to_s) & keys) | CORE_KEYS
      loop do
        expanded = selected | selected.flat_map { |key| find(key)&.dependencies || [] }
        break selected if expanded.sort == selected.sort

        selected = expanded & keys
      end
    end

    def dependents_for(key, selected_keys = keys)
      selected = Array(selected_keys).map(&:to_s)
      selected.select do |candidate|
        candidate != key.to_s && transitive_dependencies(candidate).include?(key.to_s)
      end
    end

    def transitive_dependencies(key, seen = [])
      return [] if seen.include?(key.to_s)

      direct = find(key)&.dependencies || []
      direct | direct.flat_map { |dependency| transitive_dependencies(dependency, seen + [key.to_s]) }
    end

    def serialize
      DEFINITIONS.map do |item|
        item.to_h.merge(
          dependents: dependents_for(item.key),
          core: item.essential
        )
      end
    end

    def access_map(company)
      modules = DEFINITIONS.map do |item|
        gates = item.features.map { |feature_key| FeatureGate.check(company, feature_key) }
        item.to_h.merge(
          enabled: gates.all?(&:enabled?),
          partial: gates.any?(&:enabled?) && !gates.all?(&:enabled?),
          sources: gates.map(&:source).uniq,
          dependents: dependents_for(item.key),
          core: item.essential
        )
      end
      enabled = modules.select { |item| item[:enabled] }.map { |item| item[:key] }

      {
        modules:,
        enabled:,
        disabled: modules.reject { |item| item[:enabled] }.map { |item| item[:key] },
        preset: inferred_preset(enabled)
      }
    end

    def inferred_preset(enabled)
      normalized = normalize_selection(enabled).sort
      PRESETS.each do |name, keys_for_preset|
        return name if normalize_selection(keys_for_preset).sort == normalized
      end
      "custom"
    end
  end
end
