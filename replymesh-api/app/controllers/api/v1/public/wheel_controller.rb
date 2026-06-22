module Api
  module V1
    module Public
      class WheelController < BaseController
        def promotions
          unless FeatureGate.enabled?(current_company, "roulette")
            return render_ok(roulette_active: false, promotions: [])
          end

          service = WheelService.new(company: current_company)
          roulette_active = service.promotion_active?

          render_ok(
            roulette_active: roulette_active,
            promotions: roulette_active ? [{ key: "roulette", title: "Roleta de Premios", active: true }] : []
          )
        end

        def profile
          return unless require_public_feature!("roulette")
          render_ok(WheelService.new(company: current_company).profile(phone: params[:phone]))
        end

        def prizes
          return unless require_public_feature!("roulette")
          service = WheelService.new(company: current_company)
          render_ok(prizes: service.promotion_active? ? service.public_prizes : [])
        end

        def spin
          return unless require_public_feature!("roulette")
          unless WheelService.new(company: current_company).promotion_active?
            return render_ok(success: false, message: "Nenhuma promocao ativa no momento")
          end

          result = WheelService.spin(company: current_company, phone: params[:phone])
          render_ok(result.payload.merge(success: result.success?, message: result.message))
        end
      end
    end
  end
end
