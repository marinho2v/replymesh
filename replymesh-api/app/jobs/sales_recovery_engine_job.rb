class SalesRecoveryEngineJob < ApplicationJob
  queue_as :default

  def perform(company_id = nil)
    scope = company_id.present? ? Company.where(id: company_id) : Company.joins(:sales_recovery_setting).where(sales_recovery_settings: { enabled: true })
    scope.find_each do |company|
      SalesRecoveryEngine.call(company: company)
    rescue StandardError => e
      Rails.logger.error("SalesRecoveryEngineJob failed for company #{company.id}: #{e.class} #{e.message}")
    end
  end
end
