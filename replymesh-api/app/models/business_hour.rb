class BusinessHour < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :business_hours, :store, :ai_context, :business_intelligence, :marketing_intelligence, :replymesh_strategy
  DAYS = (0..6).to_a.freeze  # 0=domingo, 6=sábado

  belongs_to :company

  validates :day_of_week, inclusion: { in: DAYS }, uniqueness: { scope: :company_id }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :ordered,     -> { order(:day_of_week) }

  def day_name
    %w[Domingo Segunda Terça Quarta Quinta Sexta Sábado][day_of_week]
  end
end
