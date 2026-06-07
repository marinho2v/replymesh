class StoreAiSetting < ApplicationRecord
  belongs_to :company

  validates :assistant_name, :initial_message, :tone, presence: true
  validates :daily_limit, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 10_000 }

  def self.for_company(company)
    find_or_create_by!(company: company)
  end

  def as_json_safe
    {
      enabled: enabled,
      auto_reply_whatsapp: auto_reply_whatsapp,
      assistant_name: assistant_name,
      initial_message: initial_message,
      tone: tone,
      model: model.presence || AiGlobalSetting.current.model,
      daily_limit: daily_limit,
      allow_orders: allow_orders,
      allow_products: allow_products,
      allow_hours: allow_hours,
      allow_promotions: allow_promotions,
      allow_order_status: allow_order_status
    }
  end
end
