module Api
  module V1
    module Public
      class StoresController < BaseController
        # GET /api/v1/public/:company_slug/store
        def show
          settings = current_company.store_setting
          render_ok(
            store: serialize_store(settings),
            store_settings: serialize_store_settings(settings),
            app_banners: serialize_banners(current_company.app_banners.active.ordered),
            business_hours: serialize_business_hours(current_company.business_hours.ordered),
            business_hour_exceptions: serialize_business_hour_exceptions(current_company.business_hour_exceptions.upcoming),
            delivery_zones: serialize_delivery_zones(current_company.delivery_zones.active.by_priority)
          )
        end

        # GET /api/v1/public/:company_slug/menu
        def menu
          categories = current_company.categories.active.ordered.includes(
            products: { product_option_groups: :product_option_items }
          )

          render_ok(
            menu: categories.map { |cat|
              {
                id:       cat.id,
                name:     cat.name,
                slug:     cat.slug,
                products: cat.products.active.ordered.map { |p| serialize_product(p) }
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

        def serialize_store(s)
          return {} unless s

          {
            id:                      current_company.id,
            company_id:              current_company.id,
            store_name:              s.store_name.presence || s.company_name.presence || current_company.name,
            slug:                    current_company.slug,
            logo_url:                s.logo_url,
            cover_url:               s.cover_url,
            banner_url:              s.banner_url,
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
            visual_template_id:      s.respond_to?(:visual_template_id) ? (s.visual_template_id.presence || 'hamburgueria-classic') : 'hamburgueria-classic',
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
            mercadopago_public_key:  s.respond_to?(:mercadopago_public_key) ? s.mercadopago_public_key : nil
          }
        end

        def serialize_store_settings(s)
          return {} unless s

          serialize_store(s).merge(
            company_name: s.company_name,
            trade_name: s.trade_name,
            free_delivery_above_cents: s.free_delivery_above_cents,
            accepted_payment_methods: s.accepted_payment_methods
          )
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
            category:                p.category&.as_json(only: %i[id name slug is_active]),
            option_groups:           p.product_option_groups.ordered.map { |g|
              {
                id:         g.id,
                name:       g.name,
                group_type: g.group_type,
                required:   g.required,
                min_select: g.min_select,
                max_select: g.max_select,
                items:      g.product_option_items.active.ordered.as_json(
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
