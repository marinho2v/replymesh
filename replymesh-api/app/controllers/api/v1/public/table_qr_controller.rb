module Api
  module V1
    module Public
      class TableQrController < BaseController
        before_action :set_table

        def show
          render_ok(
            table: serialize_table(@table),
            session: serialize_session(ensure_open_session)
          )
        end

        def open_session
          session = ensure_open_session(customer_name: params[:customer_name])
          render_ok(table: serialize_table(@table), session: serialize_session(session))
        end

        def create_order
          session = current_open_session
          return render_error("Informe seu nome para abrir a comanda") unless session

          order = nil
          ActiveRecord::Base.transaction do
            calculated_items = calculate_items
            subtotal_cents = calculated_items.sum { |item| item[:total_price_cents] }

            order = current_company.orders.create!(
              dining_table: @table,
              legacy_source: "table_qr",
              order_type: "dine_in",
              status: "pending",
              payment_method: "money",
              payment_status: "pending",
              delivery_status: "pending",
              customer_name: session.notes.presence || @table.name || "Mesa #{@table.number}",
              customer_phone: "mesa-#{@table.id}",
              customer_whatsapp: "mesa-#{@table.id}",
              subtotal_cents: subtotal_cents,
              delivery_fee_cents: 0,
              discount_cents: 0,
              total_cents: subtotal_cents,
              notes: params[:notes]
            )

            calculated_items.each do |item|
              order.order_items.create!(
                company: current_company,
                product: item[:product],
                product_name: item[:product_name],
                unit_price_cents: item[:unit_price_cents],
                quantity: item[:quantity],
                total_price_cents: item[:total_price_cents],
                selected_options: [],
                notes: item[:notes]
              )
            end

            session.update!(
              order: order,
              sent_to_kitchen_at: Time.current,
              subtotal_cents: session.subtotal_cents.to_i + subtotal_cents,
              total_cents: session.total_cents.to_i + subtotal_cents
            )

            @table.update!(status: "preparing") if @table.status == "available"
          end

          render_ok(order: serialize_order(order.reload), session: serialize_session(session.reload), status: :created)
        rescue ActiveRecord::RecordInvalid => e
          render_error(e.record.errors.full_messages.first)
        end

        def orders
          session = current_open_session
          return render_ok(orders: [], session: nil) unless session

          orders = current_company.orders.includes(:order_items)
                                  .where(dining_table: @table)
                                  .where("created_at >= ?", session.opened_at)
                                  .recent

          render_ok(orders: orders.map { |order| serialize_order(order) }, session: serialize_session(session))
        end

        private

        def set_table
          @table = current_company.dining_tables.find_by(qr_token: params[:qr_token], is_active: true, qr_enabled: true)
          render_not_found("Mesa indisponivel") unless @table
        end

        def current_open_session
          current_company.table_sessions.open.where(dining_table: @table).order(opened_at: :desc).first
        end

        def ensure_open_session(customer_name: nil)
          session = current_open_session
          if session
            session.update!(notes: customer_name.to_s.strip) if customer_name.present? && session.notes.blank?
            return session
          end

          current_company.table_sessions.create!(
            dining_table: @table,
            status: "open",
            opened_at: Time.current,
            notes: customer_name.to_s.strip.presence
          ).tap do
            @table.update!(status: "occupied") if @table.status == "available"
          end
        end

        def calculate_items
          items = Array(params[:items]).map do |item_params|
            product = current_company.products.active.find_by(id: item_params[:product_id])
            raise ActiveRecord::RecordInvalid.new(OrderItem.new.tap { |i| i.errors.add(:product, "invalido") }) unless product

            quantity = [item_params[:quantity].to_i, 1].max
            unit_price_cents = product.promotional_price_cents.presence || product.price_cents

            {
              product: product,
              product_name: product.name,
              unit_price_cents: unit_price_cents.to_i,
              quantity: quantity,
              total_price_cents: unit_price_cents.to_i * quantity,
              notes: item_params[:notes]
            }
          end

          raise ActiveRecord::RecordInvalid.new(Order.new.tap { |o| o.errors.add(:base, "Carrinho vazio") }) if items.empty?

          items
        end

        def serialize_table(table)
          table.as_json(only: %i[id number name slug seats status qr_token qr_enabled])
        end

        def serialize_session(session)
          return nil unless session

          {
            id: session.id,
            status: session.status,
            customer_name: session.notes,
            subtotal_cents: session.subtotal_cents,
            total_cents: session.total_cents,
            opened_at: session.opened_at
          }
        end

        def serialize_order(order)
          {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            total_cents: order.total_cents,
            total: order.total_brl,
            notes: order.notes,
            created_at: order.created_at,
            order_items: order.order_items.map do |item|
              item.as_json(only: %i[id product_id product_name quantity unit_price_cents total_price_cents notes])
                  .merge(unit_price: item.unit_price_brl, total_price: item.total_price_brl)
            end
          }
        end
      end
    end
  end
end
