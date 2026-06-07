module Api
  module V1
    module Store
      class CouponsController < BaseController
        before_action :set_coupon, only: %i[show update destroy]

        def index
          scope = company_scope(Coupon)
          scope = scope.active    if params[:active] == "true"
          scope = scope.valid_now if params[:valid]  == "true"
          scope = scope.where(source: params[:source]) if %w[manual wheel].include?(params[:source])
          scope = scope.includes(:customer).order(created_at: :desc)
          render_ok(coupons: scope.map { |c| serialize(c) })
        end

        def show
          render_ok(coupon: serialize(@coupon))
        end

        def create
          coupon = company_scope(Coupon).build(coupon_params.merge(source: "manual", customer_id: nil))
          if coupon.save
            render_created(coupon: serialize(coupon))
          else
            render_record_errors(coupon)
          end
        end

        def update
          return render_error("Cupons da roleta nao podem ser editados", status: :unprocessable_entity) if @coupon.source == "wheel"

          if @coupon.update(coupon_params)
            render_ok(coupon: serialize(@coupon))
          else
            render_record_errors(@coupon)
          end
        end

        def destroy
          return render_error("Cupons da roleta nao podem ser desativados manualmente", status: :unprocessable_entity) if @coupon.source == "wheel"

          @coupon.update!(is_active: false)
          render_ok(message: "Cupom desativado")
        end

        private

        def set_coupon
          @coupon = company_scope(Coupon).find_by(id: params[:id])
          render_not_found("Cupom") unless @coupon
        end

        def coupon_params
          params.require(:coupon).permit(
            :code, :title, :description, :discount_type, :discount_value,
            :minimum_order_cents, :max_uses, :starts_at, :expires_at,
            :is_active, :is_single_use_per_customer
          ).merge(company_id: current_company.id)
        end

        def serialize(c)
          c.as_json(
            only: %i[id code title discount_type discount_value minimum_order_cents
                     max_uses used_count starts_at expires_at is_active is_single_use_per_customer
                     source customer_id]
          ).merge(
            exhausted: c.exhausted?,
            customer_name: c.customer&.full_name,
            customer_phone: c.customer&.phone
          )
        end
      end
    end
  end
end
