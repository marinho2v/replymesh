class StoreAiSetting < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :settings, :ai_context, :dashboard, :sales_coach, :sales_coach_learning, :business_intelligence, :product_intelligence, :marketing_intelligence, :replymesh_strategy

  PROVIDERS = %w[anthropic groq openai disabled].freeze
  MODES = %w[answers sales_assistant auto_seller].freeze

  belongs_to :company

  validates :assistant_name, :initial_message, :tone, presence: true
  validates :ai_provider, inclusion: { in: PROVIDERS }, allow_blank: true, if: -> { has_attribute?(:ai_provider) }
  validates :ai_mode, inclusion: { in: MODES }, if: -> { has_attribute?(:ai_mode) }
  validates :daily_limit, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 10_000 }
  validates :ai_daily_message_limit, :ai_monthly_message_limit, :ai_monthly_token_limit,
            numericality: { only_integer: true, greater_than: 0 }, if: -> { has_attribute?(:ai_daily_message_limit) }

  before_validation :sync_legacy_auto_reply_flag

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
      allow_orders: allow_orders,
      allow_products: allow_products,
      allow_hours: allow_hours,
      allow_delivery: allow_delivery,
      allow_payments: allow_payments,
      allow_promotions: allow_promotions,
      allow_order_status: allow_order_status,
      ai_provider: ai_provider,
      ai_model: ai_model,
      ai_mode: ai_mode,
      ai_sales_mode_enabled: ai_sales_mode_enabled,
      ai_auto_reply_enabled: ai_auto_reply_enabled,
      ai_daily_message_limit: ai_daily_message_limit,
      ai_monthly_message_limit: ai_monthly_message_limit,
      ai_monthly_token_limit: ai_monthly_token_limit,
      identify_customer_by_phone: identify_customer_by_phone,
      confirm_saved_address: confirm_saved_address,
      create_customer: create_customer,
      allow_address_update: allow_address_update,
      auto_cart_enabled: auto_cart_enabled,
      create_order_after_confirmation: create_order_after_confirmation,
      calculate_delivery_fee: calculate_delivery_fee,
      verify_store_hours: verify_store_hours,
      verify_delivery_area: verify_delivery_area,
      apply_coupon_enabled: apply_coupon_enabled,
      offer_cash: offer_cash,
      offer_pix: offer_pix,
      auto_generate_mercadopago_pix: auto_generate_mercadopago_pix,
      send_pix_copy_paste: send_pix_copy_paste,
      wait_payment_confirmation: wait_payment_confirmation,
      pause_on_attendant_reply: pause_on_attendant_reply,
      pause_after_order_confirmation: pause_after_order_confirmation,
      handoff_on_unknown: handoff_on_unknown,
      handoff_on_request: handoff_on_request
    }
  end

  def sales_mode?
    has_attribute?(:ai_sales_mode_enabled) && ai_sales_mode_enabled? && ai_mode.in?(%w[sales_assistant auto_seller])
  end

  def effective_provider
    ai_provider.presence
  end

  def effective_model(global_model = nil)
    ai_model.presence || model.presence || global_model
  end

  private

  def sync_legacy_auto_reply_flag
    return unless has_attribute?(:ai_auto_reply_enabled)

    if will_save_change_to_ai_auto_reply_enabled?
      self.auto_reply_whatsapp = ai_auto_reply_enabled
    else
      self.ai_auto_reply_enabled = auto_reply_whatsapp
    end
  end
end
