class MarketingMessageService
  def self.send!(company:, phone:, message:, customer: nil, campaign: nil)
    normalized_phone = phone.to_s.gsub(/\D/, "")
    normalized_phone = "55#{normalized_phone}" unless normalized_phone.start_with?("55")
    raise ArgumentError, "Telefone invalido" unless normalized_phone.match?(/\A55\d{10,11}\z/)

    instance = WhatsappInstance.primary_for_company(company)
    raise ArgumentError, "WhatsApp da empresa nao esta configurado" unless instance&.instance_token.present?
    raise ArgumentError, "WhatsApp da empresa esta desconectado" unless instance.status == "connected" || instance.remote_status == "connected"

    log = company.marketing_message_logs.create!(
      customer: customer, marketing_campaign: campaign, phone: normalized_phone,
      message: message.to_s.strip, status: "pending", provider: "evolution"
    )
    result = EvolutionGoClient.new.send_text(instance.instance_token, phone: normalized_phone, message: message.to_s.strip)
    log.update!(status: "sent", sent_at: Time.current, metadata: { message_id: result[:message_id], mode: result[:mode] })
    log
  rescue StandardError => e
    log&.update!(status: "failed", error_message: e.message.to_s.first(500))
    raise
  end
end
