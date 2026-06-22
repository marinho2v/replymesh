class AiProviderService
  PROVIDERS = {
    "claude" => ClaudeAiService,
    "anthropic" => ClaudeAiService,
    "groq" => GroqAiService,
    "openai" => OpenaiAiService,
    "disabled" => DisabledAiService
  }.freeze

  def self.build(provider:, api_key:, model:)
    service_class = PROVIDERS[provider.to_s.downcase]
    raise ArgumentError, "Provider de IA nao suportado" unless service_class

    service_class.new(api_key: api_key, model: model)
  end

  def self.providers
    PROVIDERS.keys
  end
end
