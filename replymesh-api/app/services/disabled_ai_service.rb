class DisabledAiService
  Result = ClaudeAiService::Result

  def initialize(api_key: nil, model: nil); end

  def chat(system_prompt:, user_message:, max_tokens: 700)
    Result.new(success?: false, error: "Provider de IA desativado")
  end
end
