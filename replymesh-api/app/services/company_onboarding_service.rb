class CompanyOnboardingService
  Result = Struct.new(:success?, :payload, :errors, keyword_init: true)

  # day_of_week: 0=domingo, 1=segunda, ..., 6=sabado
  DEFAULT_BUSINESS_HOURS = [
    { day_of_week: 0, is_open: false, open_time: "18:00", close_time: "22:00" }, # domingo
    { day_of_week: 1, is_open: true,  open_time: "18:00", close_time: "23:00" }, # segunda
    { day_of_week: 2, is_open: true,  open_time: "18:00", close_time: "23:00" }, # terca
    { day_of_week: 3, is_open: true,  open_time: "18:00", close_time: "23:00" }, # quarta
    { day_of_week: 4, is_open: true,  open_time: "18:00", close_time: "23:00" }, # quinta
    { day_of_week: 5, is_open: true,  open_time: "18:00", close_time: "23:30" }, # sexta
    { day_of_week: 6, is_open: true,  open_time: "18:00", close_time: "23:30" }  # sabado
  ].freeze

  DEFAULT_PAYMENT_METHODS = [
    { name: "Dinheiro", method_type: "cash", requires_change: true },
    { name: "Pix", method_type: "pix" },
    { name: "Cartao Debito", method_type: "debit_card" },
    { name: "Cartao Credito", method_type: "credit_card" }
  ].freeze

  DEFAULT_LOGO_URL = "/logo.png".freeze
  DEFAULT_BANNER_URL = "/capa.jpeg".freeze

  def self.call(company_params, options = {}, actor: nil)
    new(company_params, options, actor: actor).call
  end

  def initialize(company_params, options = {}, actor: nil)
    @company_params = company_params.to_h.symbolize_keys
    @options = options.to_h.symbolize_keys
    @actor = actor
    @created_resources = {
      store_settings: false,
      business_hours: false,
      delivery_zone: false,
      subscription: false,
      domain: false,
      whatsapp_instance: false,
      whatsapp_templates: false,
      payment_methods: false,
      categories: false,
      app_banner: false
    }
  end

  def call
    ActiveRecord::Base.transaction do
      @company = create_company!
      @admin_user = create_admin_user!
      create_company_member!
      create_subscription!
      create_domain!
      create_store_settings! if option_enabled?(:create_default_settings, true)
      create_business_hours! if option_enabled?(:create_default_settings, true)
      create_default_delivery_zone! if option_enabled?(:create_default_settings, true)
      create_payment_methods! if option_enabled?(:create_default_payment_methods, true)
      create_whatsapp_templates! if option_enabled?(:create_default_templates, true)
      create_whatsapp_instance! if option_enabled?(:create_whatsapp_instance, true)
      create_activity_log!
    end

    Result.new(success?: true, payload: success_payload, errors: [])
  rescue ActiveRecord::RecordInvalid => e
    create_system_alert(e.message)
    Result.new(success?: false, payload: {}, errors: e.record.errors.full_messages.presence || [e.message])
  rescue StandardError => e
    create_system_alert(e.message)
    Result.new(success?: false, payload: {}, errors: [e.message])
  end

  private

  attr_reader :company_params, :options, :actor, :created_resources

  def create_company!
    slug = CompanyDomainService.unique_slug(
      name: company_params[:name],
      requested_slug: company_params[:slug]
    )

    Company.create!(
      name: company_params[:name],
      **CompanyDomainService.attributes_for(slug),
      custom_domain: normalize_custom_domain(company_params[:custom_domain]),
      legal_name: company_params[:legal_name],
      document_number: company_params[:document_number],
      responsible_name: company_params[:responsible_name],
      responsible_phone: company_params[:responsible_phone],
      responsible_email: company_params[:responsible_email],
      status: company_params[:status].presence || "trial",
      plan_status: company_params[:plan_status].presence || company_params[:status].presence || "trial",
      trial_ends_at: 14.days.from_now,
      timezone: company_params[:timezone].presence || "America/Sao_Paulo",
      default_locale: company_params[:default_locale].presence || "pt-BR"
    )
  end

  def create_admin_user!
    User.create!(
      name: company_params[:responsible_name],
      email: company_params[:responsible_email],
      phone: company_params[:responsible_phone],
      password: company_params[:admin_password].presence || SecureRandom.base58(16),
      global_role: "user",
      status: "active"
    )
  end

  def create_company_member!
    CompanyMember.create!(company: @company, user: @admin_user, role: "store_admin", status: "active")
  end

  def create_subscription!
    plan = Plan.find_by!(slug: company_params[:plan_slug].presence || "essencial")

    Subscription.create!(
      company: @company,
      plan: plan,
      status: @company.plan_status,
      price_cents: plan.price_cents,
      started_at: Time.current,
      trial_ends_at: @company.trial_ends_at,
      current_period_start: Time.current,
      current_period_end: 1.month.from_now
    )
    created_resources[:subscription] = true
  end

  def create_domain!
    Domain.create!(
      company: @company,
      domain: @company.subdomain,
      domain_type: "subdomain",
      status: "pending",
      ssl_status: "pending",
      is_primary: true
    )

    if @company.custom_domain.present?
      Domain.create!(
        company: @company,
        domain: @company.custom_domain,
        domain_type: "custom_domain",
        status: "pending",
        ssl_status: "pending",
        is_primary: false
      )
    end
    created_resources[:domain] = true
  end

  def create_store_settings!
    StoreSetting.create!(
      company: @company,
      company_name: @company.name,
      trade_name: @company.name,
      store_name: @company.name,
      whatsapp: @company.responsible_phone,
      phone: @company.responsible_phone,
      email: @company.responsible_email,
      logo_url: DEFAULT_LOGO_URL,
      banner_url: DEFAULT_BANNER_URL,
      cover_url: DEFAULT_BANNER_URL,
      primary_color: "#16a34a",
      secondary_color: "#0b0b0d",
      visual_template_id: "hamburgueria-classic",
      accepted_payment_methods: StoreSetting::DEFAULT_ACCEPTED_PAYMENT_METHODS,
      opening_hours: StoreSetting::DEFAULT_OPENING_HOURS
    )
    create_default_app_banner!
    created_resources[:store_settings] = true
  end

  def create_default_app_banner!
    AppBanner.create!(
      company: @company,
      title: "Banner principal",
      image_url: DEFAULT_BANNER_URL,
      is_active: true,
      sort_order: 0
    )
    created_resources[:app_banner] = true
  end

  def create_business_hours!
    DEFAULT_BUSINESS_HOURS.each do |attrs|
      BusinessHour.create!({ company: @company }.merge(attrs))
    end
    created_resources[:business_hours] = true
  end

  def create_default_delivery_zone!
    DeliveryZone.create!(
      company: @company,
      name: "Centro",
      slug: "centro",
      delivery_fee_cents: 500,
      minimum_order_cents: 0,
      estimated_minutes: 40,
      is_active: true,
      match_priority: 1,
      aliases: []
    )
    created_resources[:delivery_zone] = true
  rescue StandardError
    nil
  end

  def create_payment_methods!
    DEFAULT_PAYMENT_METHODS.each do |attributes|
      PaymentMethod.create!({ company: @company }.merge(attributes))
    end
    created_resources[:payment_methods] = true
  end

  def create_whatsapp_templates!
    WhatsappTemplate.sync_defaults_for!(@company)
    created_resources[:whatsapp_templates] = true
  end

  def create_whatsapp_instance!
    instance_name = safe_instance_name(@company.slug)
    token = SecureRandom.hex(32)
    client = EvolutionGoClient.new
    response = client.create_instance(instance_name, token: token)

    instance = WhatsappInstance.create!(
      company: @company,
      instance_name: instance_name,
      instance_token: token,
      provider: "evolution_go",
      status: response[:status] || "created",
      remote_status: response[:raw_status] || response[:status],
      remote_data: response[:remote_data],
      base_url: response[:base_url],
      instance_uuid: response[:instance_uuid],
      connected_number: response[:connected_number],
      last_remote_sync_at: Time.current
    )
    client.configure_location_webhook(token, webhook_token: EvolutionWebhookToken.generate(instance))
    created_resources[:whatsapp_instance] = true
  rescue StandardError => e
    WhatsappLog.create!(company: @company, level: "warn", message: "Falha ao criar instancia WhatsApp: #{e.message}")
  end

  def safe_instance_name(slug)
    "replymesh_#{slug.to_s.gsub(/[^a-z0-9_]/, "_")}"
  end

  def create_activity_log!
    ActivityLog.create!(
      company: @company,
      user: actor,
      action: "company_created",
      resource_type: "Company",
      resource_id: @company.id,
      metadata_json: { slug: @company.slug, admin_user_id: @admin_user.id }
    )
  end

  def create_system_alert(message)
    SystemAlert.create!(
      company: defined?(@company) ? @company : nil,
      level: "error",
      title: "Falha no onboarding de empresa",
      message: message
    )
  rescue StandardError
    nil
  end

  def success_payload
    {
      success: true,
      company: {
        id: @company.id,
        name: @company.name,
        slug: @company.slug,
        subdomain: @company.domains.find_by(is_primary: true)&.domain,
        status: @company.status
      },
      admin_user: {
        id: @admin_user.id,
        email: @admin_user.email
      },
      created_resources: created_resources
    }
  end

  def option_enabled?(key, default)
    return default unless options.key?(key)

    ActiveModel::Type::Boolean.new.cast(options[key])
  end

  def normalize_custom_domain(value)
    value.to_s.strip.downcase.sub(%r{\Ahttps?://}, "").sub(%r{/.*\z}, "").presence
  end
end
