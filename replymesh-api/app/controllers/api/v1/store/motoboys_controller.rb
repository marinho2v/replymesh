module Api
  module V1
    module Store
      class MotoboysController < BaseController
        before_action -> { require_feature!("motoboys") }
        before_action :set_motoboy, only: %i[show update destroy]

        def index
          scope = company_scope(::Motoboy)
          scope = scope.active    if params[:active]    == "true"
          scope = scope.available if params[:available] == "true"
          render_ok(motoboys: scope.map { |m| serialize(m) })
        end

        def show
          render_ok(motoboy: serialize_full(@motoboy))
        end

        def create
          motoboy = nil

          ActiveRecord::Base.transaction do
            motoboy = company_scope(::Motoboy).build(motoboy_attributes)
            attach_user!(motoboy)
            motoboy.save!
          end

          if motoboy.persisted?
            render_created(motoboy: serialize(motoboy))
          end
        rescue ActiveRecord::RecordInvalid => e
          render_record_errors(e.record)
        end

        def update
          ActiveRecord::Base.transaction do
            @motoboy.assign_attributes(motoboy_attributes)
            attach_user!(@motoboy)
            @motoboy.save!
          end

          if @motoboy.persisted?
            render_ok(motoboy: serialize(@motoboy))
          end
        rescue ActiveRecord::RecordInvalid => e
          render_record_errors(e.record)
        end

        def destroy
          @motoboy.update!(active: false)
          render_ok(message: "Motoboy desativado")
        end

        def report
          start_at = parse_time(params[:start_date], Time.current.beginning_of_day)
          end_at = parse_time(params[:end_date], Time.current.end_of_day)
          deliveries = company_scope(DeliveryHistory)
                         .includes(:motoboy, :order)
                         .where(assigned_at: start_at..end_at)
          adjustments = company_scope(MotoboyFinancialAdjustment)
                          .where(adjustment_date: start_at.to_date..end_at.to_date)

          render_ok(report: build_report(deliveries, adjustments))
        rescue ArgumentError
          render_error("Periodo invalido", status: :bad_request)
        end

        private

        def set_motoboy
          @motoboy = company_scope(::Motoboy).find_by(id: params[:id])
          render_not_found("Motoboy") unless @motoboy
        end

        def motoboy_params
          params.require(:motoboy).permit(:name, :phone, :password, :active, :is_available, :notes)
        end

        def motoboy_attributes
          motoboy_params.except(:password).merge(company_id: current_company.id)
        end

        def attach_user!(motoboy)
          password = motoboy_params[:password].to_s
          return if password.blank? && motoboy.user.present?

          phone = motoboy.phone.to_s.gsub(/\D/, "")
          email = "#{phone}@motoboy.#{current_company.slug}.replymesh.local"
          user = motoboy.user || User.find_or_initialize_by(email: email)

          user.assign_attributes(
            name: motoboy.name,
            phone: phone,
            global_role: "motoboy",
            status: motoboy.active? ? "active" : "inactive"
          )
          user.password = password if password.present? || user.new_record?
          user.save!

          CompanyMember.find_or_create_by!(company: current_company, user: user) do |member|
            member.role = "motoboy"
            member.status = "active"
          end

          motoboy.user = user
        end

        def serialize(m)
          m.as_json(only: %i[id name phone active is_available total_deliveries]).merge(user_id: m.user_id)
        end

        def serialize_full(m)
          serialize(m).merge(
            recent_deliveries: m.delivery_histories.recent.limit(10).as_json(
              only: %i[id status assigned_at delivered_at]
            )
          )
        end

        def parse_time(value, fallback)
          value.present? ? Time.zone.parse(value.to_s) : fallback
        end

        def build_report(deliveries, adjustments)
          adjustment_totals = adjustments.group_by(&:motoboy_id)
          ranking = deliveries.group_by(&:motoboy_id).map do |motoboy_id, rows|
            motoboy = rows.first.motoboy
            credits = adjustment_totals.fetch(motoboy_id, []).select { |item| item.direction == "credit" }.sum(&:amount_cents)
            debits = adjustment_totals.fetch(motoboy_id, []).select { |item| item.direction == "debit" }.sum(&:amount_cents)
            fees = rows.sum { |item| item.order&.delivery_fee_cents.to_i }
            totals = rows.sum { |item| item.order&.total_cents.to_i }

            {
              motoboy_id: motoboy_id,
              motoboy_name: motoboy&.name,
              motoboy_phone: motoboy&.phone,
              total: rows.size,
              completed: rows.count(&:delivered?),
              delivery_fees: money(fees),
              adjustment_credits: money(credits),
              adjustment_debits: money(debits),
              net_payable: money(fees + credits - debits),
              store_revenue: money(totals - fees),
              customer_total: money(totals)
            }
          end

          credits = adjustments.select { |item| item.direction == "credit" }.sum(&:amount_cents)
          debits = adjustments.select { |item| item.direction == "debit" }.sum(&:amount_cents)
          fees = deliveries.sum { |item| item.order&.delivery_fee_cents.to_i }
          totals = deliveries.sum { |item| item.order&.total_cents.to_i }

          {
            summary: {
              totalDeliveries: deliveries.size,
              completedDeliveries: deliveries.count(&:delivered?),
              inProgressDeliveries: deliveries.count { |item| %w[assigned on_the_way].include?(item.status) },
              cancelledDeliveries: deliveries.count { |item| item.status == "cancelled" },
              totalDeliveryFees: money(fees),
              completedDeliveryFees: money(deliveries.select(&:delivered?).sum { |item| item.order&.delivery_fee_cents.to_i }),
              totalStoreRevenue: money(totals - fees),
              totalCustomerPaid: money(totals),
              totalAdjustmentCredits: money(credits),
              totalAdjustmentDebits: money(debits),
              totalMotoboyPayable: money(fees + credits - debits)
            },
            ranking: ranking.sort_by { |item| -item[:net_payable] }
          }
        end

        def money(cents)
          cents.to_f / 100
        end
      end
    end
  end
end
