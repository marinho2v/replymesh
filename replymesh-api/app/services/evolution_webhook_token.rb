class EvolutionWebhookToken
  PURPOSE = "evolution-store-events".freeze

  def self.generate(instance)
    Rails.application.message_verifier(PURPOSE).generate(
      { instance_id: instance.id, company_id: instance.company_id },
      purpose: PURPOSE
    )
  end

  def self.resolve(token)
    payload = Rails.application.message_verifier(PURPOSE).verified(token.to_s, purpose: PURPOSE)
    return if payload.blank?

    instance = WhatsappInstance.includes(:company).find_by(id: payload["instance_id"] || payload[:instance_id])
    return unless instance
    return unless instance.company_id.to_s == (payload["company_id"] || payload[:company_id]).to_s

    instance
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    nil
  end
end
