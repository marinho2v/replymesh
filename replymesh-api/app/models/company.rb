class Company < ApplicationRecord
  has_many :master_impersonation_sessions, dependent: :destroy
  has_many :master_audit_logs, dependent: :nullify
  STATUSES = %w[active inactive trial suspended canceled].freeze
  PLAN_STATUSES = %w[trial active overdue canceled suspended].freeze
  DOMAIN_STATUSES = CompanyDomainService::DOMAIN_STATUSES
  SSL_STATUSES = CompanyDomainService::SSL_STATUSES

  # ── Plataforma (Fases 1-8) ────────────────────────────────────
  has_many :company_members, dependent: :destroy
  has_many :users, through: :company_members
  has_many :subscriptions, dependent: :destroy
  has_many :company_feature_overrides, dependent: :destroy
  has_many :domains, dependent: :destroy
  has_one  :store_setting, dependent: :destroy
  has_many :payment_methods, dependent: :destroy
  has_many :whatsapp_instances, dependent: :destroy
  has_many :whatsapp_templates, dependent: :destroy
  has_many :whatsapp_logs, dependent: :destroy
  has_many :activity_logs, dependent: :destroy
  has_many :system_alerts, dependent: :destroy

  # ── Template da Loja (Fases 10-11) ────────────────────────────
  has_many :categories,                dependent: :destroy
  has_many :products,                  dependent: :destroy
  has_many :product_option_groups,     dependent: :destroy
  has_many :product_option_items,      dependent: :destroy
  has_many :delivery_zones,            dependent: :destroy
  has_many :customers,                 dependent: :destroy
  has_many :customer_addresses,        dependent: :destroy
  has_many :coupons,                   dependent: :destroy
  has_many :wheel_prizes,              dependent: :destroy
  has_many :wheel_spins,               dependent: :destroy
  has_many :orders,                    dependent: :destroy
  has_many :order_items,               dependent: :destroy
  has_many :order_status_logs,         dependent: :destroy
  has_many :order_attempts,            dependent: :destroy
  has_many :motoboys,                  dependent: :destroy
  has_many :delivery_histories,        dependent: :destroy
  has_many :motoboy_financial_adjustments, dependent: :destroy
  has_many :dining_tables,             dependent: :destroy
  has_many :table_sessions,            dependent: :destroy
  has_many :inventory_items,           dependent: :destroy
  has_many :inventory_movements,       dependent: :destroy
  has_many :cash_sessions,             dependent: :destroy
  has_many :cash_movements,            dependent: :destroy
  has_many :business_hours,            dependent: :destroy
  has_many :business_hour_exceptions,  dependent: :destroy
  has_many :app_banners,               dependent: :destroy
  has_many :marketing_campaigns,       dependent: :destroy
  has_many :marketing_message_logs,    dependent: :destroy
  has_one  :android_app_request,        dependent: :destroy
  has_many :whatsapp_message_logs,     dependent: :destroy
  has_many :support_tickets,           dependent: :destroy
  has_many :support_ticket_messages,   through: :support_tickets
  has_many :ai_assistant_logs,         dependent: :nullify
  has_one  :store_ai_setting,          dependent: :destroy
  has_many :store_ai_conversations,    dependent: :destroy
  has_many :store_ai_carts,            dependent: :destroy
  has_many :ai_usage_logs,             dependent: :nullify
  has_many :system_updates,            dependent: :nullify
  has_many :system_update_reads,       dependent: :destroy

  normalizes :slug, with: ->(slug) { slug.strip.downcase }
  normalizes :responsible_email, with: ->(email) { email.strip.downcase }

  before_validation :prepare_domain_fields

  validates :name, :slug, :responsible_name, :responsible_email, :status, :plan_status, presence: true
  validates :slug, uniqueness: true, format: { with: /\A[a-z0-9][a-z0-9-]*\z/ }
  validates :subdomain, :primary_domain, presence: true
  validates :subdomain, :primary_domain, uniqueness: true
  validates :custom_domain, uniqueness: true, allow_blank: true
  validates :domain_status, :custom_domain_status, inclusion: { in: DOMAIN_STATUSES }
  validates :ssl_status, inclusion: { in: SSL_STATUSES }, if: -> { has_attribute?(:ssl_status) }
  validates :status, inclusion: { in: STATUSES }
  validates :plan_status, inclusion: { in: PLAN_STATUSES }
  validates :monthly_price_cents, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :free_period_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :contract_type, inclusion: { in: %w[monthly quarterly semiannual annual custom] }
  validate :slug_is_not_reserved
  validate :custom_domain_has_valid_format

  private

  def prepare_domain_fields
    self.slug = CompanyDomainService.normalize_slug(slug.presence || name)
    self.custom_domain = custom_domain.to_s.strip.downcase.sub(%r{\Ahttps?://}, "").sub(%r{/.*\z}, "").presence

    expected_subdomain = CompanyDomainService.domain_for(slug)
    if subdomain.blank? || will_save_change_to_slug? || subdomain.end_with?(".replymesh.com.br")
      self.subdomain = expected_subdomain
    end

    if primary_domain.blank? || primary_domain.end_with?(".replymesh.cloud") || primary_domain.end_with?(".replymesh.com.br")
      self.primary_domain = subdomain
    end

    self.domain_status ||= "pending"
    self.custom_domain_status ||= custom_domain.present? ? "pending" : "inactive"
    self.ssl_status ||= "pending" if has_attribute?(:ssl_status)
  end

  def slug_is_not_reserved
    return unless CompanyDomainService.reserved_slug?(slug)

    errors.add(:slug, "reservado para infraestrutura da Replymesh")
  end

  def custom_domain_has_valid_format
    return if CompanyDomainService.custom_domain_valid?(custom_domain)

    errors.add(:custom_domain, "invalido")
  end
end
