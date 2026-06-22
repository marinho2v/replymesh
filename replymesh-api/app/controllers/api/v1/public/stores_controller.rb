module Api
  module V1
    module Public
      class StoresController < BaseController
        PUBLIC_CACHE_TTL = 60.seconds

        before_action :set_public_cache_headers, only: %i[
          menu banners business_hours delivery_zones
        ]
        before_action -> { require_public_feature!("products") }, only: %i[menu product]
        before_action -> { require_public_feature!("banners") }, only: %i[banners]
        before_action -> { require_public_feature!("delivery_zones") }, only: %i[delivery_zones]

        # GET /api/v1/public/:company_slug/store
        def show
          settings = current_company.store_setting
          render_ok(
            store: serialize_store(settings),
            store_settings: serialize_store_settings(settings),
            app_banners: FeatureGate.enabled?(current_company, "banners") ? serialize_banners(current_company.app_banners.active.ordered) : [],
            business_hours: serialize_business_hours(current_company.business_hours.ordered),
            business_hour_exceptions: serialize_business_hour_exceptions(current_company.business_hour_exceptions.upcoming),
            delivery_zones: FeatureGate.enabled?(current_company, "delivery_zones") ? serialize_delivery_zones(current_company.delivery_zones.active.by_priority) : []
          )
        end

        # GET /api/v1/public/:company_slug/menu
        def menu
          categories = current_company.categories.active.ordered.to_a
          products_by_category_id = current_company.products
                                                   .active
                                                   .ordered
                                                   .includes(:category, product_option_groups: :product_option_items)
                                                   .to_a
                                                   .group_by(&:category_id)

          render_ok(
            menu: categories.map { |cat|
              {
                id:       cat.id,
                name:     cat.name,
                slug:     cat.slug,
                products: (products_by_category_id[cat.id] || []).map { |p| serialize_product(p) }
              }
            }
          )
        end

        # GET /api/v1/public/:company_slug/products/:id
        def product
          product = current_company.products.active.includes(
            :category,
            product_option_groups: :product_option_items
          ).find_by(id: params[:id])

          return render_not_found("Produto nao encontrado") unless product

          render_ok(product: serialize_product(product).merge(
            category: product.category&.as_json(only: %i[id name slug is_active])
          ))
        end

        # GET /api/v1/public/:company_slug/banners
        def banners
          banners = current_company.app_banners.active.ordered
          render_ok(banners: serialize_banners(banners))
        end

        # GET /api/v1/public/:company_slug/business_hours
        def business_hours
          hours      = current_company.business_hours.ordered
          exceptions = current_company.business_hour_exceptions.upcoming

          render_ok(
            business_hours: serialize_business_hours(hours),
            exceptions: serialize_business_hour_exceptions(exceptions)
          )
        end

        # GET /api/v1/public/:company_slug/delivery_zones
        def delivery_zones
          zones = current_company.delivery_zones.active.by_priority
          render_ok(delivery_zones: serialize_delivery_zones(zones))
        end

        private

        def set_public_cache_headers
          expires_in PUBLIC_CACHE_TTL, public: true
        end

        def serialize_store(s, include_media: true)
          return {} unless s
          media = public_media_fields(s, include_media: include_media)

          {
            id:                      current_company.id,
            company_id:              current_company.id,
            store_name:              s.store_name.presence || s.company_name.presence || current_company.name,
            slug:                    current_company.slug,
            logo_url:                media[:logo_url],
            favicon_url:             media[:favicon_url],
            cover_url:               media[:cover_url],
            banner_url:              media[:banner_url],
            primary_color:           s.primary_color,
            secondary_color:         s.secondary_color,
            phone:                   s.phone,
            whatsapp:                s.whatsapp,
            whatsapp_number:         s.whatsapp_number,
            email:                   s.email,
            address:                 s.address,
            city:                    s.city,
            state:                   s.state,
            zip_code:                s.zip_code,
            delivery_enabled:        s.delivery_enabled,
            pickup_enabled:          s.pickup_enabled,
            dine_in_enabled:         s.dine_in_enabled,
            min_order_value_cents:   s.min_order_value_cents,
            default_delivery_fee_cents: s.default_delivery_fee_cents,
            estimated_delivery_minutes: s.estimated_delivery_minutes,
            store_status:            s.store_status,
            closed_message:          s.respond_to?(:closed_message) ? s.closed_message : nil,
            allow_pickup:            s.respond_to?(:allow_pickup) ? s.allow_pickup : s.pickup_enabled,
            block_outside_delivery_area: s.respond_to?(:block_outside_delivery_area) ? s.block_outside_delivery_area : true,
            block_orders_when_closed: s.respond_to?(:block_orders_when_closed) ? s.block_orders_when_closed : true,
            pix_enabled:             s.pix_enabled,
            pix_key:                 s.pix_key,
            pix_key_type:            s.pix_key_type,
            pix_receiver_name:       s.respond_to?(:pix_receiver_name) ? s.pix_receiver_name : nil,
            pix_receiver_city:       s.respond_to?(:pix_receiver_city) ? s.pix_receiver_city : nil,
            pix_payload:             s.respond_to?(:pix_payload) ? s.pix_payload : nil,
            pix_qr_code_url:         s.respond_to?(:pix_qr_code_url) ? s.pix_qr_code_url : nil,
            print_footer:            s.respond_to?(:print_footer) ? s.print_footer : nil,
            visual_template_id:      s.respond_to?(:visual_template_id) ? (s.visual_template_id.presence || StoreSetting::DEFAULT_VISUAL_TEMPLATE_ID) : StoreSetting::DEFAULT_VISUAL_TEMPLATE_ID,
            hero_title:              s.respond_to?(:hero_title) ? s.hero_title : nil,
            hero_highlight:          s.respond_to?(:hero_highlight) ? s.hero_highlight : nil,
            hero_subtitle:           s.respond_to?(:hero_subtitle) ? s.hero_subtitle : nil,
            hero_image_url:          s.respond_to?(:hero_image_url) ? s.hero_image_url : nil,
            hero_image_position:     s.respond_to?(:hero_image_position) ? (s.hero_image_position.presence || 'center') : 'center',
            hero_image_zoom:         s.respond_to?(:hero_image_zoom) ? (s.hero_image_zoom.presence || 100) : 100,
            hero_overlay_opacity:    s.respond_to?(:hero_overlay_opacity) ? (s.hero_overlay_opacity.presence || 65) : 65,
            hero_height:             s.respond_to?(:hero_height) ? (s.hero_height.presence || 480) : 480,
            theme_primary_color:     s.respond_to?(:theme_primary_color) ? (s.theme_primary_color.presence || s.primary_color) : s.primary_color,
            pix_provider:            s.respond_to?(:pix_provider) ? (s.pix_provider.presence || 'manual') : 'manual',
            mercadopago_enabled:     s.respond_to?(:mercadopago_enabled) ? s.mercadopago_enabled : false,
            mercadopago_public_key:  s.respond_to?(:mercadopago_public_key) ? s.mercadopago_public_key : nil,
            feature_access:          public_feature_access,
            updated_at:              s.updated_at
          }
        end

        def public_feature_access
          motoboy_gate = FeatureGate.check(current_company, "motoboy_panel")

          {
            motoboy_panel: {
              enabled: motoboy_gate.enabled?,
              feature: motoboy_gate.feature,
              required_plan: motoboy_gate.required_plan,
              required_plan_label: FeatureCatalog.required_plan_label(motoboy_gate.required_plan),
              source: motoboy_gate.source,
              message: "Este recurso nao esta incluso no plano atual da sua loja. Fale com o suporte Replymesh para liberar ou testar este recurso."
            }
          }
        end

        def serialize_store_settings(s)
          return {} unless s

          serialize_store(s, include_media: false).merge(
            company_name: s.company_name,
            trade_name: s.trade_name,
            free_delivery_above_cents: s.free_delivery_above_cents,
            accepted_payment_methods: s.accepted_payment_methods
          )
        end

        def public_media_fields(s, include_media:)
          return { logo_url: nil, favicon_url: nil, cover_url: nil, banner_url: nil } unless include_media

          cover_url = s.cover_url.presence
          banner_url = s.banner_url.presence
          canonical_cover = cover_url || banner_url
          duplicate_banner = cover_url.present? && banner_url.present? && cover_url == banner_url

          {
            logo_url: s.logo_url,
            favicon_url: s.respond_to?(:favicon_url) ? s.favicon_url : nil,
            cover_url: canonical_cover,
            banner_url: duplicate_banner ? nil : banner_url
          }
        end

        def serialize_banners(banners)
          banners.as_json(only: %i[id title image_url link_url sort_order])
        end

        def serialize_business_hours(hours)
          hours.map { |h|
            h.as_json(only: %i[day_of_week is_open open_time close_time break_start break_end closed_message])
             .merge(day_name: h.day_name)
          }
        end

        def serialize_business_hour_exceptions(exceptions)
          exceptions.as_json(only: %i[exception_date is_open open_time close_time message])
        end

        def serialize_delivery_zones(zones)
          zones.as_json(only: %i[id name slug city delivery_fee_cents estimated_minutes minimum_order_cents aliases])
        end

        def serialize_product(p)
          option_groups = p.product_option_groups.sort_by { |group| group.sort_order || 0 }

          {
            id:                      p.id,
            name:                    p.name,
            slug:                    p.slug,
            description:             p.description,
            price_cents:             p.price_cents,
            promotional_price_cents: p.promotional_price_cents,
            price_brl:               p.price_brl,
            image_url:               p.image_url,
            is_featured:             p.is_featured,
            is_promotional:          p.is_promotional,
            is_customizable:         p.is_customizable,
            is_combo:                p.is_combo,
            sort_order:               p.sort_order,
            updated_at:               p.updated_at,
            category:                p.category&.as_json(only: %i[id name slug is_active]),
            option_groups:           option_groups.map { |g|
              option_items = g.product_option_items
                              .select { |item| item.is_active != false }
                              .sort_by { |item| item.sort_order || 0 }

              {
                id:         g.id,
                name:       g.name,
                group_type: g.group_type,
                required:   g.required,
                min_select: g.min_select,
                max_select: g.max_select,
                items:      option_items.as_json(
                  only: %i[id name additional_price_cents]
                )
              }
            }
          }
        end
      end
    end
  end
end
