class OpenaiAiService < OpenAiCompatibleChatService
  DEFAULT_MODEL = "gpt-4.1-mini"

  def initialize(api_key: ENV["OPENAI_API_KEY"], model: DEFAULT_MODEL)
    super(
      api_key: api_key.presence || ENV["OPENAI_API_KEY"],
      model: model.presence || DEFAULT_MODEL,
      base_url: ENV.fetch("OPENAI_BASE_URL", "https://api.openai.com/v1"),
      provider_name: "OpenAI"
    )
  end
end
