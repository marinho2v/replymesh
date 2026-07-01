# frozen_string_literal: true

class CompanyContextBuilder
  CACHE_GROUP = :ai_context
  CACHE_ENDPOINT = :company_context
  CACHE_TTL = 5.minutes
  MAX_PRODUCTS = 80
  MAX_CATEGORIES = 40
  MAX_COUPONS = 20
  MAX_CAMPAIGNS = 10
  MAX_STOCK_ALERTS = 20

  class << self
    def build(company)
      return {} if company.blank?

      ReplymeshCacheService.fetch(
        company: company,
        group: CACHE_GROUP,
        endpoint: CACHE_ENDPOINT,
        expires_in: CACHE_TTL
      ) do
        build_with_metrics(company)
      end
    end

    def invalidate(company)
      ReplymeshCacheService.invalidate_company(company, groups: [CACHE_GROUP]) if company.present?
    end

    private

    def build_with_metrics(company)
      started_at = monotonic_time
      sql_started_at = nil
      sql_ms = 0.0
      query_count = 0

      subscriber = lambda do |_name, start, finish, _id, payload|
        next if payload[:name].to_s.match?(/SCHEMA|CACHE/)

        query_count += 1
        sql_ms += (finish - start) * 1000
      end

      context = nil
      ActiveSupport::Notifications.instrument("replymesh.company_context", company_id: company.id) do
        ActiveSupport::Notifications.subscribed(subscriber, "sql.active_record") do
          sql_started_at = monotonic_time
          context = build_uncached(company)
        end
      end

      duration_ms = elapsed_ms(started_at)
      track_metrics(company: company, duration_ms: duration_ms, sql_ms: sql_ms, query_count: query_count, context: context)
      context
    rescue StandardError => e
      Rails.logger.warn("[CompanyContextBuilder] fallback company=#{company&.id}: #{e.class} #{e.message}")
      fallback_context(company)
    end

    def build_uncached(company)
      company = Company
        .includes(
          :store_setting,
          :store_ai_setting,
          :sales_recovery_setting,
          :business_hours,
          :delivery_zones,
          :app_banners,
          :marketing_campaigns,
          :inventory_items
        )
        .find(company.id)

      settings = company.store_setting
      ai_settings = company.store_ai_setting
      recovery_setting = company.sales_recovery_setting
      active_categories = company.categories.active.ordered.limit(MAX_CATEGORIES).to_a
      active_products = company.products.active.includes(:category).ordered.limit(MAX_PRODUCTS).to_a
      sales_totals = sales_totals_for(company, active_products)
      coupons = company.coupons.valid_now.limit(MAX_COUPONS).to_a

      {
        generated_at: Time.current.iso8601,
        store_name: store_name(company, settings),
        company_slug: company.slug,
        business_hours: business_hours_for(company, settings),
        timezone: company.timezone.presence || "America/Sao_Paulo",
        city: settings&.city.presence || safe_attr(company, :city),
        state: settings&.state.presence || safe_attr(company, :state),
        logo: CloudStorageService.public_url_or_fallback(safe_attr(settings, :logo_storage_key), settings&.logo_url),
        banner: CloudStorageService.public_url_or_fallback(safe_attr(settings, :banner_storage_key), settings&.banner_url.presence || settings&.cover_url),
        payment_methods: payment_methods_for(settings),
        delivery: delivery_context_for(company, settings),
        delivery_time: delivery_time_for(settings),
        delivery_fee: settings&.delivery_fee_cents.to_i,
        categories: serialize_categories(active_categories),
        products: serialize_products(active_products, sales_totals),
        featured_products: serialize_products(featured_products(active_products), sales_totals),
        best_sellers: serialize_products(best_sellers(active_products, sales_totals), sales_totals),
        active_promotions: active_promotions_for(company),
        available_coupons: serialize_coupons(coupons),
        current_recovery_coupon: current_recovery_coupon(company),
        business_rules: business_rules_for(settings, ai_settings, recovery_setting),
        tone: ai_settings&.tone.presence || "profissional e amigavel",
        agent_name: ai_settings&.assistant_name.presence || "Assistente Replymesh",
        ai_enabled: ai_settings&.enabled? || false,
        current_campaigns: current_campaigns_for(company),
        stock_alerts: stock_alerts_for(company),
        top_products: serialize_products(best_sellers(active_products, sales_totals).first(10), sales_totals),
        frequently_sold_together: frequently_sold_together_for(company),
        average_ticket: average_ticket_for(company),
        recovery_statistics: recovery_statistics_for(company),
        delivery_context: {},
        sales_context: {},
        customer_context: {}
      }
    end

    def fallback_context(company)
      {
        generated_at: Time.current.iso8601,
        store_name: company&.name.to_s,
        company_slug: company&.slug.to_s,
        timezone: company&.timezone.presence || "America/Sao_Paulo",
        ai_enabled: false,
        categories: [],
        products: [],
        featured_products: [],
        best_sellers: [],
        active_promotions: [],
        available_coupons: [],
        current_recovery_coupon: nil,
        delivery_context: {},
        sales_context: {},
        customer_context: {}
      }
    end

    def store_name(company, settings)
      settings&.store_name.presence || settings&.trade_name.presence || settings&.company_name.presence || company.name
    end

    def business_hours_for(company, settings)
      model_hours = company.business_hours.sort_by(&:day_of_week).map do |hour|
        {
          day_of_week: hour.day_of_week,
          day_name: hour.day_name,
          open: format_time(hour.open_time),
          close: format_time(hour.close_time),
          open_now: hour.respond_to?(:is_open?) ? hour.is_open? : nil
        }
      end
      return model_hours if model_hours.any?

      settings&.opening_hours.to_h
    end

    def payment_methods_for(settings)
      accepted = Array(settings&.accepted_payment_methods.presence || StoreSetting::DEFAULT_ACCEPTED_PAYMENT_METHODS)
      {
        accepted: accepted,
        cash: accepted.include?("cash"),
        pix: accepted.include?("pix") || settings&.pix_enabled?,
        pix_provider: safe_attr(settings, :pix_provider).presence || "manual",
        card_on_delivery: accepted.any? { |method| method.in?(%w[debit_card credit_card card_on_delivery]) },
        mercado_pago_enabled: settings&.respond_to?(:mercadopago_enabled?) ? settings.mercadopago_enabled? : false
      }
    end

    def delivery_context_for(company, settings)
      zones = company.delivery_zones.select(&:is_active).sort_by { |zone| -zone.match_priority.to_i }.map do |zone|
        {
          name: zone.name,
          city: safe_attr(zone, :city),
          fee_cents: zone.delivery_fee_cents.to_i,
          estimated_minutes: zone.estimated_minutes.to_i,
          minimum_order_cents: safe_attr(zone, :minimum_order_cents).to_i,
          aliases: Array(safe_attr(zone, :aliases))
        }
      end

      {
        enabled: settings&.respond_to?(:delivery_enabled) ? settings.delivery_enabled : true,
        pickup_enabled: settings&.pickup_enabled? || false,
        default_fee_cents: settings&.delivery_fee_cents.to_i,
        estimated_minutes: settings&.estimated_delivery_minutes.to_i,
        zones: zones
      }
    end

    def delivery_time_for(settings)
      safe_attr(settings, :average_delivery_time).presence || settings&.estimated_delivery_minutes
    end

    def serialize_categories(categories)
      categories.map do |category|
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          sort_order: category.sort_order
        }
      end
    end

    def serialize_products(products, sales_totals)
      products.map do |product|
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category&.name,
          price_cents: product.price_cents.to_i,
          promotional_price_cents: safe_attr(product, :promotional_price_cents),
          featured: product.is_featured?,
          promotional: product.is_promotional?,
          image_url: CloudStorageService.public_url_or_fallback(safe_attr(product, :image_storage_key), safe_attr(product, :image_url)),
          sales_count: sales_totals.fetch(product.id, 0),
          sort_order: product.sort_order
        }
      end
    end

    def featured_products(products)
      products.select(&:is_featured?).first(12)
    end

    def best_sellers(products, sales_totals)
      products.sort_by do |product|
        [
          -sales_totals.fetch(product.id, 0),
          product.is_featured? ? 0 : 1,
          product.is_promotional? ? 0 : 1,
          -product.created_at.to_i,
          product.sort_order.to_i
        ]
      end.first(12)
    end

    def sales_totals_for(company, products)
      ids = products.map(&:id)
      return {} if ids.blank?

      OrderItem
        .joins(:order)
        .where(orders: { company_id: company.id })
        .where.not(orders: { status: "cancelled" })
        .where(product_id: ids)
        .group(:product_id)
        .sum(:quantity)
    end

    def active_promotions_for(company)
      company.app_banners.select(&:is_active).sort_by { |banner| [banner.sort_order.to_i, banner.created_at.to_i] }.first(10).map do |banner|
        {
          title: banner.title,
          subtitle: safe_attr(banner, :subtitle),
          image_url: CloudStorageService.public_url_or_fallback(safe_attr(banner, :image_storage_key), safe_attr(banner, :image_url)),
          sort_order: banner.sort_order
        }
      end
    end

    def serialize_coupons(coupons)
      coupons.reject(&:exhausted?).map do |coupon|
        {
          code: coupon.code,
          title: coupon.title,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value.to_f,
          expires_at: coupon.expires_at&.iso8601,
          source: coupon.source
        }
      end
    end

    def current_recovery_coupon(company)
      coupon = company.coupons.valid_now.where(source: "sales_recovery").order(created_at: :desc).first
      return unless coupon

      serialize_coupons([coupon]).first
    end

    def business_rules_for(settings, ai_settings, recovery_setting)
      {
        store_status: settings&.store_status,
        minimum_order_cents: settings&.min_order_value_cents.to_i,
        free_delivery_above_cents: settings&.free_delivery_above_cents.to_i,
        block_orders_when_closed: safe_attr(settings, :block_orders_when_closed),
        block_outside_delivery_area: safe_attr(settings, :block_outside_delivery_area),
        ai_mode: ai_settings&.ai_mode,
        ai_sales_mode: ai_settings&.respond_to?(:sales_mode?) ? ai_settings.sales_mode? : false,
        recovery_enabled: recovery_setting&.enabled? || false,
        recovery_delay_minutes: recovery_setting&.delay_minutes
      }
    end

    def current_campaigns_for(company)
      company.marketing_campaigns.select { |campaign| campaign.status == "active" }.first(MAX_CAMPAIGNS).map do |campaign|
        {
          id: campaign.id,
          title: campaign.title,
          status: campaign.status
        }
      end
    end

    def stock_alerts_for(company)
      company.inventory_items.select(&:low_stock?).first(MAX_STOCK_ALERTS).map do |item|
        {
          id: item.id,
          name: item.name,
          current_quantity: item.current_quantity.to_f,
          minimum_quantity: item.minimum_quantity.to_f,
          unit: item.unit
        }
      end
    end

    def frequently_sold_together_for(company)
      rows = OrderItem
        .joins(:order)
        .where(orders: { company_id: company.id })
        .where.not(orders: { status: "cancelled" })
        .where("order_items.created_at >= ?", 90.days.ago)
        .group(:order_id)
        .pluck(:order_id, Arel.sql("array_agg(DISTINCT product_name)"))

      rows.filter_map do |_order_id, names|
        pair = Array(names).compact_blank.first(2)
        pair if pair.size == 2
      end.tally.sort_by { |_pair, count| -count }.first(10).map do |pair, count|
        { products: pair, count: count }
      end
    rescue StandardError
      []
    end

    def average_ticket_for(company)
      cents = company.orders.where.not(status: "cancelled").where("created_at >= ?", 90.days.ago).average(:total_cents)
      cents.to_i
    end

    def recovery_statistics_for(company)
      events = company.sales_recovery_events.where("created_at >= ?", 30.days.ago)
      sent = events.where(status: %w[sent recovered]).count
      recovered = events.where(status: "recovered").count
      {
        sent: sent,
        recovered: recovered,
        ignored: events.where(status: "ignored").count,
        recovered_value_cents: events.where(status: "recovered").sum(:recovered_value_cents).to_i,
        recovery_rate_percent: sent.positive? ? ((recovered.to_f / sent) * 100).round(1) : 0.0,
        average_score: events.average(:recovery_score).to_f.round(1)
      }
    rescue StandardError
      {}
    end

    def track_metrics(company:, duration_ms:, sql_ms:, query_count:, context:)
      return unless defined?(PerformanceMonitorService)

      payload_bytes = context.to_json.bytesize
      PerformanceMonitorService.track_request(
        endpoint: "company_context_builder",
        company_id: company.id,
        duration_ms: duration_ms,
        sql_ms: sql_ms,
        render_ms: 0,
        query_count: query_count,
        payload_bytes: payload_bytes,
        request_payload_bytes: 0
      )
    rescue StandardError => e
      Rails.logger.warn("[CompanyContextBuilder] metric skipped company=#{company&.id}: #{e.class}")
    end

    def safe_attr(record, name)
      return nil unless record&.respond_to?(name)

      record.public_send(name)
    end

    def format_time(value)
      return value.strftime("%H:%M") if value.respond_to?(:strftime)

      value.to_s.presence
    end

    def monotonic_time
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end

    def elapsed_ms(started_at)
      ((monotonic_time - started_at) * 1000).round(2)
    end
  end
end
