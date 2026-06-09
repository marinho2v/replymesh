module Api
  module V1
    module Store
      class WheelPrizesController < BaseController
        before_action -> { require_feature!("roulette") }
        before_action :set_prize, only: %i[update]

        def create
          prize = company_scope(WheelPrize).build(prize_params)
          if prize.save
            render_created(prize: serialize(prize))
          else
            render_record_errors(prize)
          end
        end

        def update
          if @prize.update(prize_params)
            render_ok(prize: serialize(@prize))
          else
            render_record_errors(@prize)
          end
        end

        private

        def set_prize
          @prize = company_scope(WheelPrize).find_by(id: params[:id])
          render_not_found("Premio") unless @prize
        end

        def prize_params
          attrs = params.require(:wheel_prize).permit(
            :name, :description, :prize_type, :discount_value, :probability_weight,
            :coupon_valid_days, :minimum_order_cents, :max_total_wins, :badge,
            :color, :sort_order, :is_active
          )
          attrs[:company_id] = current_company.id
          attrs
        end

        def serialize(prize)
          prize.as_json(
            only: %i[id name description prize_type discount_value probability_weight coupon_valid_days
                     minimum_order_cents max_total_wins current_wins badge color sort_order is_active]
          ).merge(minimum_order_amount: prize.minimum_order_cents.to_i / 100.0)
        end
      end
    end
  end
end
