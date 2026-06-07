class WhatsappTemplate < ApplicationRecord
  ENABLED_BY_DEFAULT = %w[pedido_aceito saiu_para_entrega pedido_finalizado].freeze
  STATUS_TEMPLATE_KEYS = {
    "accepted" => "pedido_aceito",
    "preparing" => "pedido_em_preparo",
    "ready" => "pedido_pronto",
    "out_for_delivery" => "saiu_para_entrega",
    "completed" => "pedido_finalizado",
    "cancelled" => "pedido_cancelado"
  }.freeze

  DEFAULT_TEMPLATES = [
    {
      template_key: "pedido_recebido",
      title: "Pedido Recebido",
      message: "🧾 Pedido recebido!\n\nOlá, *{{nome_cliente}}* 👋\nRecebemos seu pedido e vamos confirmar em instantes.\n\n*{{nome_loja}}* 🍔",
      enabled: false
    },
    {
      template_key: "pedido_aceito",
      title: "Pedido Aceito",
      message: "🍔 Pedido aceito!\n\nOlá, *{{nome_cliente}}* 👋\nSeu pedido já entrou em preparo.\n\nPara agilizar a entrega, envie sua localização fixa por aqui 📍\n\n*{{nome_loja}}* 🍔",
      enabled: true
    },
    {
      template_key: "pedido_em_preparo",
      title: "Pedido em Preparo",
      message: "👨‍🍳 Pedido em preparo!\n\nOlá, *{{nome_cliente}}* 👋\nSeu pedido está sendo preparado com cuidado.\n\nDaqui a pouco avisamos quando estiver pronto.\n\n*{{nome_loja}}* 🍔",
      enabled: false
    },
    {
      template_key: "pedido_pronto",
      title: "Pedido Pronto",
      message: "✅ Pedido pronto!\n\nOlá, *{{nome_cliente}}* 👋\nSeu pedido já está pronto.\n\nSe for retirada, pode vir buscar. Se for entrega, em breve ele sai com o motoboy.\n\n*{{nome_loja}}* 🍔",
      enabled: false
    },
    {
      template_key: "saiu_para_entrega",
      title: "Saiu para Entrega",
      message: "🛵 Seu pedido saiu para entrega!\n\nOlá, *{{nome_cliente}}* 👋\nO motoboy já está a caminho.\n\nFique atento ao WhatsApp e ao telefone.\n\n*{{nome_loja}}* 🍔",
      enabled: true
    },
    {
      template_key: "pedido_finalizado",
      title: "Pedido Finalizado",
      message: "🎉 Pedido finalizado!\n\nOlá, *{{nome_cliente}}* 👋\nSeu pedido foi finalizado com sucesso.\n\nObrigado pela preferência. Esperamos te atender de novo em breve!\n\n*{{nome_loja}}* 🍔",
      enabled: true
    },
    {
      template_key: "pedido_cancelado",
      title: "Pedido Cancelado",
      message: "❌ Pedido cancelado\n\nOlá, *{{nome_cliente}}* 👋\nSeu pedido foi cancelado.\n\nSe tiver qualquer dúvida, chama a gente por aqui que vamos te ajudar.\n\n*{{nome_loja}}* 🍔",
      enabled: false
    },
    { template_key: "marketing", title: "Marketing", message: "Olá, *{{nome_cliente}}* 👋\nTemos uma oferta especial para você!\n\n*{{nome_loja}}* 🍔", enabled: false }
  ].freeze

  belongs_to :company

  validates :template_key, :title, :message, presence: true
  validates :template_key, uniqueness: { scope: :company_id }

  def self.template_key_for_status(status)
    STATUS_TEMPLATE_KEYS[status.to_s]
  end

  def self.sync_defaults_for!(company, force_text: false, force_enabled: false)
    DEFAULT_TEMPLATES.each do |attributes|
      template = find_or_initialize_by(company: company, template_key: attributes[:template_key])
      template.title = attributes[:title] if force_text || template.title.blank?
      template.message = attributes[:message] if force_text || template.message.blank?
      template.enabled = attributes[:enabled] if template.new_record? || force_enabled
      template.save!
    end
  end
end
