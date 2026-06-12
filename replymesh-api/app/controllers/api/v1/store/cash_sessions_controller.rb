module Api
  module V1
    module Store
      class CashSessionsController < BaseController
        before_action :set_session, only: %i[show close]

        # GET /store/cash_sessions
        def index
          sessions = company_scope(CashSession).recent.limit(page_limit)
          render_ok(cash_sessions: sessions.map { |s| serialize(s) })
        end

        # GET /store/cash_sessions/:id  (ou :id = "current")
        def show
          render_ok(cash_session: serialize_full(@session))
        end

        # POST /store/cash_sessions — Abrir caixa
        def create
          result = CashService.open_session(
            company:              current_company,
            user:                 current_user,
            opening_amount_cents: params.dig(:cash_session, :opening_amount_cents).to_i,
            notes:                params.dig(:cash_session, :notes)
          )

          if result.success?
            render_created(cash_session: serialize_full(result.data))
          else
            render_error(result.error)
          end
        end

        # POST /store/cash_sessions/:id/close — Fechar caixa
        def close
          result = CashService.close_session(
            session:       @session,
            user:          current_user,
            counted_cents: params.require(:counted_cents).to_i,
            closing_notes: params[:notes]
          )

          if result.success?
            render_ok(cash_session: serialize_full(result.data))
          else
            render_error(result.error)
          end
        end

        private

        def set_session
          @session = if params[:id] == "current"
                       CashSession.current_for(current_company.id)
                     else
                       company_scope(CashSession).find_by(id: params[:id])
                     end
          render_not_found("Sessão de caixa") unless @session
        end

        def serialize(s)
          s.as_json(only: %i[id status opening_amount_cents closing_expected_cents
                             closing_counted_cents difference_cents opened_at closed_at])
           .merge(opening_brl: s.opening_amount_brl)
        end

        def serialize_full(s)
          serialize(s).merge(
            opened_by:   s.opened_by&.slice("id", "name"),
            closed_by:   s.closed_by&.slice("id", "name"),
            movements_summary: build_summary(s)
          )
        end

        def build_summary(s)
          mvs = s.cash_movements
          {
            total_cash_sales:      cents_brl(mvs.where(movement_type: "sale_cash").sum(:amount_cents)),
            total_pix_sales:       cents_brl(mvs.where(movement_type: "sale_pix").sum(:amount_cents)),
            total_card_sales:      cents_brl(mvs.where(movement_type: "sale_card").sum(:amount_cents)),
            total_change_given:    cents_brl(mvs.where(movement_type: "change_given").sum(:amount_cents)),
            total_sangria:         cents_brl(mvs.where(movement_type: "sangria").sum(:amount_cents)),
            total_withdrawal:      cents_brl(mvs.where(movement_type: "withdrawal").sum(:amount_cents)),
            total_reinforcement:   cents_brl(mvs.where(movement_type: "reinforcement").sum(:amount_cents)),
            expected_cash_balance: cents_brl(CashService.calculate_expected_balance(s)),
            movements_count:       mvs.count
          }
        end

        def cents_brl(cents)
          cents.to_f / 100
        end
      end
    end
  end
end
