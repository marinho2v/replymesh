class GroqAiService < OpenAiCompatibleChatService
  DEFAULT_MODEL = "llama-3.1-8b-instant"

  def initialize(api_key: ENV["GROQ_API_KEY"], model: DEFAULT_MODEL)
    super(
      api_key: api_key.presence || ENV["GROQ_API_KEY"],
      model: model.presence || DEFAULT_MODEL,
      base_url: ENV.fetch("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
      provider_name: "Groq"
    )
  end
end
