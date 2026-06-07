module Api
  module V1
    module Public
      class CouponsController < BaseController
        def validate
          result = CouponValidationService.call(
            company: current_company,
            code: params[:code],
            order_total_cents: money_to_cents(params[:order_total_cents] || params[:order_total]),
            customer_phone: params[:customer_phone] || params[:phone],
            delivery_fee_cents: money_to_cents(params[:delivery_fee_cents] || params[:delivery_fee])
          )

          render_ok(
            valid: result.valid?,
            message: result.message,
            coupon: result.coupon && serialize_coupon(result.coupon),
            discount_cents: result.discount_cents,
            discountAmount: result.discount_cents.to_f / 100
          )
        end

        private

        def money_to_cents(value)
          return value.to_i if value.to_s.match?(/\A\d+\z/) && value.to_i > 1000

          (BigDecimal(value.to_s.presence || "0") * 100).round.to_i
        end

        def serialize_coupon(coupon)
          coupon.as_json(
            only: %i[id code title description discount_type discount_value minimum_order_cents
                     max_uses used_count starts_at expires_at is_active source customer_id]
          )
        end
      end
    end
  end
end
