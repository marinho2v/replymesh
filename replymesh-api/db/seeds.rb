plans = [
  {
    name: "Essencial",
    slug: "essencial",
    price_cents: 30_000,
    billing_cycle: "monthly",
    description: "Plano inicial para operacoes essenciais.",
    features_json: ["Painel da loja", "WhatsApp manual", "Pedidos online"]
  },
  {
    name: "Profissional",
    slug: "profissional",
    price_cents: 50_000,
    billing_cycle: "monthly",
    description: "Plano completo para operacoes em crescimento.",
    features_json: ["Painel da loja", "WhatsApp", "Relatorios", "Motoboy"]
  },
  {
    name: "Premium IA",
    slug: "premium_ia",
    price_cents: 0,
    billing_cycle: "monthly",
    description: "Plano sob consulta com recursos avancados de IA.",
    features_json: ["IA", "Automacoes avancadas", "Suporte prioritario"]
  }
]

plans.each do |attributes|
  plan = Plan.find_or_initialize_by(slug: attributes[:slug])
  plan.update!(attributes.merge(status: "active"))
end

master_email = ENV.fetch("REPLYMESH_MASTER_EMAIL", "admin@replymesh.cloud")
master_password = ENV.fetch("REPLYMESH_MASTER_PASSWORD", "admin123456")

master = User.find_or_initialize_by(email: master_email)
master.update!(
  name: "Admin Master",
  password: master_password,
  global_role: "super_admin",
  status: "active"
)

puts "Seed concluido: #{Plan.count} planos, master #{master.email}."

all_master_permissions = MasterRole::PERMISSION_KEYS.index_with(true)
master_roles = {
  "super_admin" => ["Super Admin", "Acesso total ao painel master.", all_master_permissions],
  "administrator" => ["Administrador", "Gerencia a operacao administrativa da Replymesh.", all_master_permissions.except("users.permissions")],
  "support" => ["Suporte", "Atende tickets e consulta empresas e auditoria.", {
    "companies.view" => true, "tickets.view" => true, "tickets.reply" => true,
    "tickets.status" => true, "logs.audit" => true, "view_audit_logs" => true
  }],
  "finance" => ["Financeiro", "Gerencia assinaturas, planos e pagamentos.", {
    "companies.view" => true, "finance.subscriptions" => true,
    "finance.change_plan" => true, "finance.payments" => true
  }],
  "commercial" => ["Comercial", "Cadastra e acompanha empresas.", {
    "companies.view" => true, "companies.create" => true, "companies.edit" => true
  }],
  "developer" => ["Desenvolvedor", "Consulta logs e administra configuracoes tecnicas.", {
    "companies.view" => true, "logs.audit" => true, "view_audit_logs" => true, "settings.ai" => true,
    "settings.brand" => true, "settings.updates" => true
  }]
}

master_roles.each do |key, (name, description, permissions)|
  role = MasterRole.find_or_initialize_by(key: key)
  role.update!(name: name, description: description, permissions: permissions, status: "active")
end

master.update!(master_role: MasterRole.find_by!(key: "super_admin"))
MasterBrandSetting.current
puts "Funcoes master disponiveis: #{MasterRole.count}."

Company.find_each do |company|
  WhatsappTemplate.sync_defaults_for!(company, force_text: true, force_enabled: true)
end

puts "Templates WhatsApp padrao disponiveis para onboarding: #{WhatsappTemplate::DEFAULT_TEMPLATES.size}."

system_updates = [
  ["v1.5.13", "Carina Premium", "A assistente da Replymesh ganhou respostas naturais, memoria de conversa e uma base de conhecimento completa.", "news"],
  ["v1.5.12", "IA da plataforma", "A configuracao da Carina foi centralizada com seguranca no painel master.", "improvement"],
  ["v1.5.11", "Mercado Pago Pix", "Fluxo Pix automatico com QR Code, confirmacao e expiracao de pagamentos.", "news"],
  ["v1.5.10", "Notificacoes", "Alertas operacionais e notificacoes da loja integrados ao painel.", "improvement"],
  ["v1.5.9", "Templates visuais", "Identidade visual e templates publicos configuraveis por empresa.", "news"],
  ["v1.5.6", "Mesas QR", "Mesas, QR Code e pedidos vinculados ao atendimento local.", "news"],
  ["v1.5.5", "Suporte, Caixa e Estoque", "Tickets, operacao de caixa e controle de estoque conectados ao Rails.", "improvement"]
]

system_updates.each_with_index do |(version, title, description, update_type), index|
  update = SystemUpdate.find_or_initialize_by(version: version)
  update.update!(
    title: "Fase #{version.delete_prefix('v')} - #{title}",
    short_description: description,
    content: "#{description}\n\nEsta entrega faz parte da evolucao local da plataforma Replymesh e esta disponivel para todas as lojas.",
    update_type: update_type,
    status: "published",
    audience_type: "all",
    is_featured: index.zero?,
    published_at: Time.current - index.days,
    icon: update_type == "news" ? "Sparkles" : "Wrench",
    color: update_type == "news" ? "#8b5cf6" : "#3b82f6"
  )
  SystemUpdatePublicationService.call(update)
end

puts "Atualizacoes do sistema disponiveis: #{SystemUpdate.count}."
