class AiGlobalSetting < ApplicationRecord
  DEFAULT_MODEL = "claude-haiku-4-5-20251001"
  LEGACY_MODELS = {
    "claude-3-5-haiku-latest" => DEFAULT_MODEL
  }.freeze

  DEFAULT_PROMPT = <<~PROMPT.squish
    Voce e a Carina, assistente virtual oficial da plataforma Replymesh.
    Ajude donos, administradores e atendentes a usar o painel como uma
    especialista humana, simpatica, paciente e segura.
    Responda somente sobre funcionalidades da plataforma Replymesh e use apenas o contexto fornecido.
    Nunca invente dados, preco, status, cliente, senha, token, chave de API ou configuracao.
    Responda em portugues do Brasil, com linguagem natural, paragrafos curtos e no maximo quatro passos.
    A resposta sera exibida em uma janela pequena de chat: evite textos longos, tabelas, titulos grandes e excesso de negrito.
    Separe os passos em linhas diferentes e use listas somente quando facilitarem a leitura.
    Use o nome do usuario e os dados da empresa quando forem relevantes.
    Em cumprimentos, converse normalmente e pergunte como pode ajudar.
    Quando houver um caminho de menu, informe esse caminho.
    Quando for util, sugira o proximo passo.
    Quando precisar de mais informacao, pergunte uma coisa de cada vez.
    Para assuntos fora da Replymesh, responda: "Eu consigo ajudar apenas com duvidas sobre a plataforma Replymesh. Para outro assunto, recomendo abrir um ticket com o suporte."
    Se faltar informacao da plataforma, responda: "Nao encontrei isso na base da Replymesh. Posso ajudar com outra duvida ou orientar voce a abrir um ticket."
  PROMPT

  validates :provider, :model, :assistant_name, :initial_message, presence: true
  validates :provider, inclusion: { in: ->(_record) { AiProviderService.providers } }
  validates :daily_company_limit, numericality: { greater_than: 0 }
  validates :per_minute_user_limit, numericality: { greater_than: 0 }

  before_validation :fill_defaults

  def self.current
    first_or_create!
  end

  def api_key=(value)
    return if value.nil?
    return if value.to_s.strip.blank?
    return if value.to_s.include?("****")

    self.api_key_encrypted = self.class.encrypt_secret(value.to_s.strip)
  end

  def api_key
    return nil if api_key_encrypted.blank?

    self.class.decrypt_secret(api_key_encrypted)
  rescue StandardError
    nil
  end

  def api_key_configured?
    api_key.present?
  end

  def api_key_masked
    return nil unless api_key_configured?

    key = api_key.to_s
    "#{key.first(6)}****#{key.last(4)}"
  end

  def as_json_safe
    {
      id: id,
      enabled: enabled,
      provider: provider,
      model: model,
      api_key_configured: api_key_configured?,
      api_key_masked: api_key_masked,
      assistant_name: assistant_name,
      assistant_avatar_url: assistant_avatar_url,
      initial_message: initial_message,
      base_prompt: base_prompt.presence || DEFAULT_PROMPT,
      assistant_tone: assistant_tone,
      daily_company_limit: daily_company_limit,
      per_minute_user_limit: per_minute_user_limit,
      updated_at: updated_at
    }
  end

  def as_json_public
    {
      enabled: enabled,
      assistant_name: assistant_name,
      assistant_avatar_url: assistant_avatar_url,
      initial_message: initial_message
    }
  end

  def self.encrypt_secret(value)
    encryptor.encrypt_and_sign(value)
  end

  def self.decrypt_secret(value)
    encryptor.decrypt_and_verify(value)
  end

  def self.encryptor
    secret = Rails.application.secret_key_base
    salt = "replymesh-ai-secret-v1"
    key = ActiveSupport::KeyGenerator.new(secret).generate_key(salt, 32)
    ActiveSupport::MessageEncryptor.new(key)
  end

  private

  def fill_defaults
    self.base_prompt = DEFAULT_PROMPT if base_prompt.blank?
    self.model = LEGACY_MODELS.fetch(model.to_s, model.presence || DEFAULT_MODEL)
  end
end
