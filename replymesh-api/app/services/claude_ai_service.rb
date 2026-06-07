require "net/http"
require "json"

class ClaudeAiService
  API_URL = URI("https://api.anthropic.com/v1/messages")

  Result = Struct.new(:success?, :content, :tokens, :error, keyword_init: true)

  def initialize(api_key:, model:)
    @api_key = api_key.to_s
    @model = model.presence || "claude-haiku-4-5-20251001"
  end

  def chat(system_prompt:, user_message:, max_tokens: 700)
    return Result.new(success?: false, error: "Claude API key nao configurada") if @api_key.blank?

    response = Net::HTTP.start(API_URL.host, API_URL.port, use_ssl: true, open_timeout: 8, read_timeout: 30) do |http|
      request = Net::HTTP::Post.new(API_URL)
      request["Content-Type"] = "application/json"
      request["anthropic-version"] = "2023-06-01"
      request["x-api-key"] = @api_key
      request.body = {
        model: @model,
        max_tokens: max_tokens,
        system: system_prompt,
        messages: [{ role: "user", content: user_message }]
      }.to_json
      http.request(request)
    end

    payload = JSON.parse(response.body)
    unless response.is_a?(Net::HTTPSuccess)
      return Result.new(success?: false, error: payload["error"]&.dig("message") || "Claude retornou erro")
    end

    content = Array(payload["content"]).filter_map { |item| item["text"] }.join("\n").strip
    tokens = payload.dig("usage", "input_tokens").to_i + payload.dig("usage", "output_tokens").to_i

    Result.new(success?: true, content: content, tokens: tokens)
  rescue StandardError => e
    Rails.logger.warn("Claude AI request failed: #{e.class}")
    Result.new(success?: false, error: "Nao foi possivel conectar ao Claude agora")
  end
end
