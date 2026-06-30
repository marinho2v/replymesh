require "net/http"
require "json"

class OpenAiCompatibleChatService
  Result = ClaudeAiService::Result

  def initialize(api_key:, model:, base_url:, provider_name:)
    @api_key = api_key.to_s
    @model = model.to_s.presence
    @base_url = base_url.to_s.delete_suffix("/")
    @provider_name = provider_name
  end

  def chat(system_prompt:, user_message:, max_tokens: 700)
    return Result.new(success?: false, error: "#{@provider_name} API key nao configurada") if @api_key.blank?
    return Result.new(success?: false, error: "#{@provider_name} model nao configurado") if @model.blank?

    uri = URI("#{@base_url}/chat/completions")
    response = PerformanceMonitorService.instrument_external("ai") do
      Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 8, read_timeout: 30) do |http|
        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request["Authorization"] = "Bearer #{@api_key}"
        request.body = {
          model: @model,
          max_tokens: max_tokens,
          temperature: 0.3,
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_message }
          ]
        }.to_json
        http.request(request)
      end
    end

    payload = JSON.parse(response.body)
    unless response.is_a?(Net::HTTPSuccess)
      return Result.new(success?: false, error: payload.dig("error", "message") || "#{@provider_name} retornou erro")
    end

    content = payload.dig("choices", 0, "message", "content").to_s.strip
    tokens = payload.dig("usage", "total_tokens").to_i
    Result.new(success?: true, content: content, tokens: tokens)
  rescue StandardError => e
    Rails.logger.warn("#{@provider_name} AI request failed: #{e.class}")
    Result.new(success?: false, error: "Nao foi possivel conectar ao #{@provider_name} agora")
  end
end
