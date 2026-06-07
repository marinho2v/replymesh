module Api
  module V1
    module Public
      class PaymentsController < BaseController
        # GET /api/v1/public/:company_slug/payments/:order_id/status
        def status
          order = current_company.orders.find_by(public_token: params[:order_id].to_s)
          return render_not_found("Pedido nao encontrado") unless order

          render_ok(MercadoPagoPaymentProcessor.refresh!(order))
        end
      end
    end
  end
end
