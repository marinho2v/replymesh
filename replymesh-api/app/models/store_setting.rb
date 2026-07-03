class StoreSetting < ApplicationRecord
  include CloudStorageBacked
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :store, :settings, :business_hours, :delivery, :ai_context, :business_intelligence, :product_intelligence, :replymesh_strategy

  STATUSES = %w[open closed paused].freeze
  WHATSAPP_MODES = %w[automatic manual disabled].freeze
  PIX_KEY_TYPES = %w[cpf cnpj email phone random].freeze
  DEFAULT_ACCEPTED_PAYMENT_METHODS = %w[cash pix debit_card credit_card].freeze
  DEFAULT_VISUAL_TEMPLATE_ID = "hamburgueria-premium".freeze
  DEFAULT_OPENING_HOURS = {
    "monday" => { "enabled" => true, "open" => "18:00", "close" => "23:00" },
    "tuesday" => { "enabled" => true, "open" => "18:00", "close" => "23:00" },
    "wednesday" => { "enabled" => true, "open" => "18:00", "close" => "23:00" },
    "thursday" => { "enabled" => true, "open" => "18:00", "close" => "23:00" },
    "friday" => { "enabled" => true, "open" => "18:00", "close" => "23:30" },
    "saturday" => { "enabled" => true, "open" => "18:00", "close" => "23:30" },
    "sunday" => { "enabled" => false, "open" => "18:00", "close" => "22:30" }
  }.freeze

  belongs_to :company

  validates :company_id, uniqueness: true
  validates :store_status, inclusion: { in: STATUSES }
  validates :whatsapp_mode, inclusion: { in: WHATSAPP_MODES }
  validates :min_order_value_cents, :default_delivery_fee_cents, :delivery_fee_cents,
            :free_delivery_above_cents, :estimated_delivery_minutes,
            numericality: { greater_than_or_equal_to: 0 }
  validates :pix_key_type, inclusion: { in: PIX_KEY_TYPES }, allow_blank: true

  before_validation :normalize_company_settings
  cloud_storage_fields :logo_storage_key, :banner_storage_key, :cover_storage_key, :favicon_storage_key, :hero_image_storage_key

  def apply_company_settings!(attributes)
    attrs = attributes.to_h

    self.company_name = attrs["company_name"] if attrs.key?("company_name")
    self.trade_name = attrs["trade_name"] if attrs.key?("trade_name")
    self.store_name = attrs["store_name"] if attrs.key?("store_name")
    self.logo_url = attrs["logo_url"] if attrs.key?("logo_url")
    self.logo_storage_key = attrs["logo_storage_key"] if attrs.key?("logo_storage_key") && respond_to?(:logo_storage_key=)
    self.banner_url = attrs["banner_url"] if attrs.key?("banner_url")
    self.banner_storage_key = attrs["banner_storage_key"] if attrs.key?("banner_storage_key") && respond_to?(:banner_storage_key=)
    self.cover_url = attrs["cover_url"] if attrs.key?("cover_url")
    self.cover_storage_key = attrs["cover_storage_key"] if attrs.key?("cover_storage_key") && respond_to?(:cover_storage_key=)
    self.hero_subtitle = attrs["description"] if attrs.key?("description") && respond_to?(:hero_subtitle=)
    self.primary_color = attrs["primary_color"] if attrs.key?("primary_color")
    self.secondary_color = attrs["secondary_color"] if attrs.key?("secondary_color")
    self.whatsapp = attrs["whatsapp"] if attrs.key?("whatsapp")
    self.whatsapp_number = attrs["whatsapp_number"] if attrs.key?("whatsapp_number")
    self.whatsapp_mode = attrs["whatsapp_mode"] if attrs.key?("whatsapp_mode")
    self.phone = attrs["phone"] if attrs.key?("phone")
    self.instagram = attrs["instagram"] if attrs.key?("instagram")
    self.facebook = attrs["facebook"] if attrs.key?("facebook")
    self.email = attrs["email"] if attrs.key?("email")
    self.address = attrs["address"] if attrs.key?("address")
    self.city = attrs["city"] if attrs.key?("city")
    self.state = attrs["state"] if attrs.key?("state")
    self.zip_code = attrs["zip_code"] if attrs.key?("zip_code")
    self.delivery_fee_cents = money_to_cents(attrs["delivery_fee"]) if attrs.key?("delivery_fee")
    self.delivery_fee_cents = money_to_cents(attrs["delivery_fee_default"]) if attrs.key?("delivery_fee_default")
    self.free_delivery_above_cents = money_to_cents(attrs["free_delivery_above"]) if attrs.key?("free_delivery_above")
    self.min_order_value_cents = money_to_cents(attrs["minimum_order_amount"]) if attrs.key?("minimum_order_amount")
    self.store_status = attrs["store_status"] if attrs.key?("store_status")
    self.closed_message = attrs["closed_message"] if attrs.key?("closed_message") && respond_to?(:closed_message=)
    self.allow_pickup = ActiveModel::Type::Boolean.new.cast(attrs["allow_pickup"]) if attrs.key?("allow_pickup") && respond_to?(:allow_pickup=)
    self.pickup_enabled = ActiveModel::Type::Boolean.new.cast(attrs["allow_pickup"]) if attrs.key?("allow_pickup")
    self.block_outside_delivery_area = ActiveModel::Type::Boolean.new.cast(attrs["block_outside_delivery_area"]) if attrs.key?("block_outside_delivery_area") && respond_to?(:block_outside_delivery_area=)
    self.block_orders_when_closed = ActiveModel::Type::Boolean.new.cast(attrs["block_orders_when_closed"]) if attrs.key?("block_orders_when_closed") && respond_to?(:block_orders_when_closed=)
    self.average_delivery_time = attrs["average_delivery_time"] if attrs.key?("average_delivery_time") && respond_to?(:average_delivery_time=)
    self.estimated_delivery_minutes = attrs["estimated_delivery_minutes"] if attrs.key?("estimated_delivery_minutes")
    self.pix_enabled = ActiveModel::Type::Boolean.new.cast(attrs["pix_enabled"]) if attrs.key?("pix_enabled")
    self.pix_key = attrs["pix_key"] if attrs.key?("pix_key")
    self.pix_key_type = attrs["pix_key_type"] if attrs.key?("pix_key_type")
    self.pix_receiver_name = attrs["pix_receiver_name"] if attrs.key?("pix_receiver_name") && respond_to?(:pix_receiver_name=)
    self.pix_receiver_city = attrs["pix_receiver_city"] if attrs.key?("pix_receiver_city") && respond_to?(:pix_receiver_city=)
    self.pix_payload = attrs["pix_payload"] if attrs.key?("pix_payload") && respond_to?(:pix_payload=)
    self.pix_qr_code_url = attrs["pix_qr_code_url"] if attrs.key?("pix_qr_code_url") && respond_to?(:pix_qr_code_url=)
    self.print_footer = attrs["print_footer"] if attrs.key?("print_footer") && respond_to?(:print_footer=)
    self.default_support_message = attrs["default_support_message"] if attrs.key?("default_support_message") && respond_to?(:default_support_message=)
    self.default_order_message = attrs["default_order_message"] if attrs.key?("default_order_message") && respond_to?(:default_order_message=)
    self.recurring_customer_min_orders = attrs["recurring_customer_min_orders"] if attrs.key?("recurring_customer_min_orders") && respond_to?(:recurring_customer_min_orders=)
    self.opening_hours = attrs["opening_hours"] if attrs.key?("opening_hours")
    self.order_message_template = attrs["order_message_template"] if attrs.key?("order_message_template")
    self.accepted_payment_methods = attrs["accepted_payment_methods"] if attrs.key?("accepted_payment_methods")
    self.visual_template_id = attrs["visual_template_id"] if attrs.key?("visual_template_id") && respond_to?(:visual_template_id=)
    self.hero_title = attrs["hero_title"] if attrs.key?("hero_title") && respond_to?(:hero_title=)
    self.hero_highlight = attrs["hero_highlight"] if attrs.key?("hero_highlight") && respond_to?(:hero_highlight=)
    self.hero_subtitle = attrs["hero_subtitle"] if attrs.key?("hero_subtitle") && respond_to?(:hero_subtitle=)
    self.hero_image_url = attrs["hero_image_url"] if attrs.key?("hero_image_url") && respond_to?(:hero_image_url=)
    self.hero_image_storage_key = attrs["hero_image_storage_key"] if attrs.key?("hero_image_storage_key") && respond_to?(:hero_image_storage_key=)
    self.hero_image_position = attrs["hero_image_position"] if attrs.key?("hero_image_position") && respond_to?(:hero_image_position=)
    self.hero_image_zoom = attrs["hero_image_zoom"] if attrs.key?("hero_image_zoom") && respond_to?(:hero_image_zoom=)
    self.hero_overlay_opacity = attrs["hero_overlay_opacity"] if attrs.key?("hero_overlay_opacity") && respond_to?(:hero_overlay_opacity=)
    self.hero_height = attrs["hero_height"] if attrs.key?("hero_height") && respond_to?(:hero_height=)
    self.theme_primary_color = attrs["theme_primary_color"] if attrs.key?("theme_primary_color") && respond_to?(:theme_primary_color=)
    # Mercado Pago
    self.pix_provider               = attrs["pix_provider"] if attrs.key?("pix_provider") && respond_to?(:pix_provider=)
    self.mercadopago_public_key     = attrs["mercadopago_public_key"] if attrs.key?("mercadopago_public_key") && respond_to?(:mercadopago_public_key=)
    self.mercadopago_access_token   = attrs["mercadopago_access_token"] if attrs.key?("mercadopago_access_token") && respond_to?(:mercadopago_access_token=)
    self.mercadopago_webhook_secret = attrs["mercadopago_webhook_secret"] if attrs.key?("mercadopago_webhook_secret") && respond_to?(:mercadopago_webhook_secret=)
    self.mercadopago_enabled        = ActiveModel::Type::Boolean.new.cast(attrs["mercadopago_enabled"]) if attrs.key?("mercadopago_enabled") && respond_to?(:mercadopago_enabled=)

    save!
  end

  def as_company_settings_json
    {
      id: id,
      company_id: company_id,
      company_name: company_name.presence || store_name.presence || company.name,
      trade_name: trade_name.presence || store_name.presence || company.name,
      store_name: store_name.presence || trade_name.presence || company_name.presence || company.name,
      logo_url: cloud_media_url(:logo_storage_key, logo_url),
      logo_storage_key: respond_to?(:logo_storage_key) ? logo_storage_key : nil,
      banner_url: cloud_media_url(:banner_storage_key, banner_url.presence || cover_url),
      banner_storage_key: respond_to?(:banner_storage_key) ? banner_storage_key : nil,
      cover_url: cloud_media_url(:cover_storage_key, cover_url.presence || banner_url),
      cover_storage_key: respond_to?(:cover_storage_key) ? cover_storage_key : nil,
      description: respond_to?(:hero_subtitle) ? hero_subtitle : nil,
      favicon_url: cloud_media_url(:favicon_storage_key, respond_to?(:favicon_url) ? favicon_url : nil),
      favicon_storage_key: respond_to?(:favicon_storage_key) ? favicon_storage_key : nil,
      primary_color: primary_color,
      secondary_color: secondary_color,
      whatsapp: whatsapp.presence || whatsapp_number.presence || phone,
      whatsapp_number: whatsapp_number.presence || whatsapp.presence || phone,
      whatsapp_mode: whatsapp_mode.presence || "automatic",
      phone: phone.presence || whatsapp.presence || whatsapp_number,
      instagram: instagram,
      facebook: facebook,
      email: email,
      address: address,
      city: city,
      state: state,
      zip_code: zip_code,
      delivery_fee: cents_to_money(delivery_fee_cents.presence || default_delivery_fee_cents),
      delivery_fee_default: cents_to_money(delivery_fee_cents.presence || default_delivery_fee_cents),
      free_delivery_above: cents_to_money(free_delivery_above_cents.presence || min_order_value_cents),
      minimum_order_amount: cents_to_money(min_order_value_cents),
      store_status: store_status,
      closed_message: respond_to?(:closed_message) ? closed_message : nil,
      allow_pickup: respond_to?(:allow_pickup) ? allow_pickup : pickup_enabled,
      block_outside_delivery_area: respond_to?(:block_outside_delivery_area) ? block_outside_delivery_area : true,
      block_orders_when_closed: respond_to?(:block_orders_when_closed) ? block_orders_when_closed : true,
      average_delivery_time: respond_to?(:average_delivery_time) ? average_delivery_time : estimated_delivery_minutes.to_s,
      pix_enabled: pix_enabled,
      pix_key: pix_key,
      pix_key_type: pix_key_type,
      pix_receiver_name: respond_to?(:pix_receiver_name) ? pix_receiver_name : nil,
      pix_receiver_city: respond_to?(:pix_receiver_city) ? pix_receiver_city : nil,
      pix_payload: respond_to?(:pix_payload) ? pix_payload : nil,
      pix_qr_code_url: respond_to?(:pix_qr_code_url) ? pix_qr_code_url : nil,
      print_footer: respond_to?(:print_footer) ? print_footer : nil,
      default_support_message: respond_to?(:default_support_message) ? default_support_message : nil,
      default_order_message: respond_to?(:default_order_message) ? default_order_message : nil,
      recurring_customer_min_orders: respond_to?(:recurring_customer_min_orders) ? recurring_customer_min_orders : 2,
      opening_hours: opening_hours.presence || DEFAULT_OPENING_HOURS,
      order_message_template: order_message_template,
      accepted_payment_methods: accepted_payment_methods.presence || DEFAULT_ACCEPTED_PAYMENT_METHODS,
      visual_template_id: respond_to?(:visual_template_id) ? (visual_template_id.presence || DEFAULT_VISUAL_TEMPLATE_ID) : DEFAULT_VISUAL_TEMPLATE_ID,
      hero_title: respond_to?(:hero_title) ? hero_title : nil,
      hero_highlight: respond_to?(:hero_highlight) ? hero_highlight : nil,
      hero_subtitle: respond_to?(:hero_subtitle) ? hero_subtitle : nil,
      # Mercado Pago — token mascarado, nunca exposto no frontend
      pix_provider:              respond_to?(:pix_provider) ? (pix_provider.presence || 'manual') : 'manual',
      mercadopago_public_key:    respond_to?(:mercadopago_public_key) ? mercadopago_public_key : nil,
      mercadopago_access_token:  respond_to?(:mercadopago_access_token) ? mask_token(mercadopago_access_token) : nil,
      mercadopago_webhook_secret: respond_to?(:mercadopago_webhook_secret) ? mercadopago_webhook_secret : nil,
      mercadopago_enabled:       respond_to?(:mercadopago_enabled) ? mercadopago_enabled : false,
      hero_image_url: cloud_media_url(:hero_image_storage_key, respond_to?(:hero_image_url) ? hero_image_url : nil),
      hero_image_storage_key: respond_to?(:hero_image_storage_key) ? hero_image_storage_key : nil,
      hero_image_position: respond_to?(:hero_image_position) ? (hero_image_position.presence || "center") : "center",
      hero_image_zoom: respond_to?(:hero_image_zoom) ? (hero_image_zoom.presence || 100) : 100,
      hero_overlay_opacity: respond_to?(:hero_overlay_opacity) ? (hero_overlay_opacity.presence || 65) : 65,
      hero_height: respond_to?(:hero_height) ? (hero_height.presence || 480) : 480,
      theme_primary_color: respond_to?(:theme_primary_color) ? (theme_primary_color.presence || primary_color) : primary_color,
      updated_at: updated_at
    }
  end

  def automatic_whatsapp?
    whatsapp_mode.blank? || whatsapp_mode == "automatic"
  end

  def manual_whatsapp?
    whatsapp_mode == "manual"
  end

  def whatsapp_disabled?
    whatsapp_mode == "disabled"
  end

  private

  def cloud_media_url(storage_field, fallback_url)
    return fallback_url unless respond_to?(storage_field)

    CloudStorageService.public_url_or_fallback(public_send(storage_field), fallback_url)
  end

  def mask_token(token)
    return nil if token.blank?
    return token if token.length <= 8
    "#{token[0..3]}#{'*' * (token.length - 8)}#{token[-4..]}"
  end

  def normalize_company_settings
    self.store_name = store_name.presence || trade_name.presence || company_name.presence || company&.name
    self.company_name = company_name.presence || store_name.presence || company&.name
    self.trade_name = trade_name.presence || store_name.presence || company_name
    self.banner_url = banner_url.presence || cover_url
    self.cover_url = banner_url.presence || cover_url
    self.whatsapp = whatsapp.presence || whatsapp_number.presence || phone
    self.whatsapp_number = whatsapp.presence || whatsapp_number
    self.whatsapp_mode = "automatic" if whatsapp_mode.blank?
    self.phone = whatsapp.presence || phone
    self.delivery_fee_cents = default_delivery_fee_cents if delivery_fee_cents.to_i.zero? && default_delivery_fee_cents.to_i.positive?
    self.free_delivery_above_cents = min_order_value_cents if free_delivery_above_cents.to_i.zero? && min_order_value_cents.to_i.positive?
    self.default_delivery_fee_cents = delivery_fee_cents if default_delivery_fee_cents.to_i.zero? && delivery_fee_cents.to_i.positive?
    self.min_order_value_cents = free_delivery_above_cents if min_order_value_cents.to_i.zero? && free_delivery_above_cents.to_i.positive?
    self.opening_hours = DEFAULT_OPENING_HOURS if opening_hours.blank?
    self.accepted_payment_methods = DEFAULT_ACCEPTED_PAYMENT_METHODS if accepted_payment_methods.blank?
    self.hero_image_position = "center" if respond_to?(:hero_image_position=) && hero_image_position.blank?
    self.hero_image_zoom = 100 if respond_to?(:hero_image_zoom=) && hero_image_zoom.blank?
    self.hero_overlay_opacity = 65 if respond_to?(:hero_overlay_opacity=) && hero_overlay_opacity.blank?
    self.hero_height = 480 if respond_to?(:hero_height=) && hero_height.blank?
    self.theme_primary_color = primary_color if respond_to?(:theme_primary_color=) && theme_primary_color.blank?
  end

  def money_to_cents(value)
    return 0 if value.blank?

    (BigDecimal(value.to_s.tr(",", ".")) * 100).round.to_i
  end

  def cents_to_money(value)
    (value.to_i / 100.0).round(2)
  end
end
