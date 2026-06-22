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
  validates :store_ai_provider, inclusion: { in: %w[groq anthropic claude openai disabled] }, if: -> { has_attribute?(:store_ai_provider) }
  validates :store_ai_daily_message_limit, :store_ai_monthly_message_limit, :store_ai_monthly_token_limit,
            :store_ai_timeout_seconds, :store_ai_max_context_products, :store_ai_handoff_attempts,
            numericality: { only_integer: true, greater_than: 0 }, if: -> { has_attribute?(:store_ai_daily_message_limit) }

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

  %w[groq claude openai].each do |provider_name|
    define_method("store_ai_#{provider_name}_api_key=") do |value|
      assign_encrypted_store_ai_key(provider_name, value)
    end

    define_method("store_ai_#{provider_name}_api_key") do
      read_encrypted_store_ai_key(provider_name)
    end

    define_method("store_ai_#{provider_name}_api_key_configured?") do
      public_send("store_ai_#{provider_name}_api_key").present?
    end

    define_method("store_ai_#{provider_name}_api_key_masked") do
      masked_secret(public_send("store_ai_#{provider_name}_api_key"))
    end
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
      store_ai: store_ai_as_json_safe,
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

  def store_ai_api_key_for(provider_name)
    normalized = provider_name.to_s == "claude" ? "claude" : provider_name.to_s
    case normalized
    when "groq"
      store_ai_groq_api_key.presence || ENV["GROQ_API_KEY"]
    when "openai"
      store_ai_openai_api_key.presence || ENV["OPENAI_API_KEY"]
    when "anthropic", "claude"
      store_ai_claude_api_key.presence || api_key.presence || ENV["ANTHROPIC_API_KEY"].presence || ENV["CLAUDE_API_KEY"]
    end
  end

  def store_ai_provider_configured?(provider_name = store_ai_provider)
    return false if provider_name.to_s == "disabled"

    store_ai_api_key_for(provider_name).present?
  end

  def store_ai_as_json_safe
    return {} unless has_attribute?(:store_ai_enabled)

    {
      enabled: store_ai_enabled,
      provider: store_ai_provider,
      model: store_ai_model,
      groq_api_key_configured: store_ai_groq_api_key_configured?,
      groq_api_key_masked: store_ai_groq_api_key_masked,
      claude_api_key_configured: store_ai_claude_api_key_configured?,
      claude_api_key_masked: store_ai_claude_api_key_masked,
      openai_api_key_configured: store_ai_openai_api_key_configured?,
      openai_api_key_masked: store_ai_openai_api_key_masked,
      daily_message_limit: store_ai_daily_message_limit,
      monthly_message_limit: store_ai_monthly_message_limit,
      monthly_token_limit: store_ai_monthly_token_limit,
      timeout_seconds: store_ai_timeout_seconds,
      max_context_products: store_ai_max_context_products,
      handoff_attempts: store_ai_handoff_attempts
    }
  end

  private

  def fill_defaults
    self.base_prompt = DEFAULT_PROMPT if base_prompt.blank?
    self.model = LEGACY_MODELS.fetch(model.to_s, model.presence || DEFAULT_MODEL)
    self.store_ai_model = "llama-3.1-8b-instant" if has_attribute?(:store_ai_model) && store_ai_model.blank?
    self.store_ai_provider = "groq" if has_attribute?(:store_ai_provider) && store_ai_provider.blank?
  end

  def assign_encrypted_store_ai_key(provider_name, value)
    return if value.nil?
    return if value.to_s.strip.blank?
    return if value.to_s.include?("****")

    public_send("store_ai_#{provider_name}_api_key_encrypted=", self.class.encrypt_secret(value.to_s.strip))
  end

  def read_encrypted_store_ai_key(provider_name)
    encrypted = public_send("store_ai_#{provider_name}_api_key_encrypted")
    return nil if encrypted.blank?

    self.class.decrypt_secret(encrypted)
  rescue StandardError
    nil
  end

  def masked_secret(value)
    return nil if value.blank?

    key = value.to_s
    return "********" if key.length < 12

    "#{key.first(6)}****#{key.last(4)}"
  end
end
