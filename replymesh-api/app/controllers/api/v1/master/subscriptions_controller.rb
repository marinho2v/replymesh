module Api
  module V1
    module Master
      class SubscriptionsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_subscription, only: %i[show update]

        def index
          subscriptions = Subscription.includes(:plan, :company).order(created_at: :desc)

          render json: {
            success: true,
            metrics: metrics,
            subscriptions: subscriptions.map { |subscription| serialize_subscription(subscription) }
          }
        end

        def show
          render json: { success: true, subscription: serialize_subscription(@subscription) }
        end

        def update
          previous_plan_id = @subscription.plan_id
          previous_status = @subscription.status

          Subscription.transaction do
            if update_params[:plan_id].present?
              plan = Plan.find(update_params[:plan_id])
              @subscription.plan = plan
              @subscription.price_cents = plan.price_cents
            end

            if update_params[:status].present?
              @subscription.status = update_params[:status]
              @subscription.canceled_at = Time.current if @subscription.status == "canceled"
              @subscription.canceled_at = nil if previous_status == "canceled" && @subscription.status != "canceled"
            end

            @subscription.current_period_start ||= Time.current
            @subscription.current_period_end ||= 1.month.from_now
            @subscription.save!
            sync_company_status!

            audit!(
              previous_plan_id == @subscription.plan_id ? "subscription_updated" : "plan_changed",
              company: @subscription.company,
              resource: @subscription,
              metadata: {
                previous_plan_id: previous_plan_id,
                new_plan_id: @subscription.plan_id,
                previous_status: previous_status,
                new_status: @subscription.status
              }
            )
          end

          render json: { success: true, subscription: serialize_subscription(@subscription.reload) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        rescue ActiveRecord::RecordNotFound => e
          render json: { success: false, errors: [e.message] }, status: :not_found
        end

        private

        def set_subscription
          @subscription = Subscription.includes(:plan, :company).find(params[:id])
        end

        def update_params
          params.require(:subscription).permit(:plan_id, :status)
        end

        def sync_company_status!
          company = @subscription.company
          company.update!(
            plan_status: @subscription.status,
            status: company_status_for(@subscription.status)
          )
        end

        def company_status_for(status)
          case status
          when "active" then "active"
          when "trial" then "trial"
          when "overdue", "suspended" then "suspended"
          when "canceled" then "canceled"
          else "inactive"
          end
        end

        def metrics
          scope = Subscription.all
          {
            mrr_cents: scope.where(status: "active").sum(:price_cents),
            trial_cents: scope.where(status: "trial").sum(:price_cents),
            active_count: scope.where(status: "active").count,
            trial_count: scope.where(status: "trial").count,
            overdue_count: scope.where(status: "overdue").count,
            canceled_count: scope.where(status: "canceled").count,
            suspended_count: scope.where(status: "suspended").count,
            total_count: scope.count
          }
        end

        def serialize_subscription(subscription)
          {
            id: subscription.id,
            status: subscription.status,
            price_cents: subscription.price_cents,
            started_at: subscription.started_at,
            trial_ends_at: subscription.trial_ends_at,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            canceled_at: subscription.canceled_at,
            created_at: subscription.created_at,
            updated_at: subscription.updated_at,
            company: {
              id: subscription.company.id,
              name: subscription.company.name,
              slug: subscription.company.slug,
              status: subscription.company.status,
              plan_status: subscription.company.plan_status,
              responsible_email: subscription.company.responsible_email
            },
            plan: {
              id: subscription.plan.id,
              name: subscription.plan.name,
              slug: subscription.plan.slug,
              price_cents: subscription.plan.price_cents,
              status: subscription.plan.status
            }
          }
        end
      end
    end
  end
end
