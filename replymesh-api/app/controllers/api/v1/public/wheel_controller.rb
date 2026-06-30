module Api
  module V1
    module Public
      class WheelController < BaseController
        def promotions
          render_ok(
            ReplymeshCacheService.fetch(
              company: current_company,
              group: :promotions,
              endpoint: :public_promotions,
              expires_in: 5.minutes
            ) do
              unless FeatureGate.enabled?(current_company, "roulette")
                next { roulette_active: false, promotions: [] }
              end

              service = WheelService.new(company: current_company)
              roulette_active = service.promotion_active?

              {
                roulette_active: roulette_active,
                promotions: roulette_active ? [{ key: "roulette", title: "Roleta de Premios", active: true }] : []
              }
            end
          )
        end

        def profile
          return unless require_public_feature!("roulette")
          render_ok(WheelService.new(company: current_company).profile(phone: params[:phone]))
        end

        def prizes
          return unless require_public_feature!("roulette")
          render_ok(
            ReplymeshCacheService.fetch(
              company: current_company,
              group: :promotions,
              endpoint: :public_wheel_prizes,
              expires_in: 5.minutes
            ) do
              service = WheelService.new(company: current_company)
              { prizes: service.promotion_active? ? service.public_prizes : [] }
            end
          )
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
