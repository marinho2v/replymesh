class SalesRecoveryDeliveryJob < ApplicationJob
  queue_as :default

  def perform(event_id)
    event = SalesRecoveryEvent.find_by(id: event_id)
    return unless event&.status == "queued"

    SalesRecoveryEngine.deliver(event: event)
  rescue StandardError => e
    Rails.logger.error("SalesRecoveryDeliveryJob failed for event #{event_id}: #{e.class} #{e.message}")
  end
end
