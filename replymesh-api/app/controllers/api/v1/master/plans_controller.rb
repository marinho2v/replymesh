module Api
  module V1
    module Master
      class PlansController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_plan, only: %i[show update]

        def index
          plans = Plan.left_outer_joins(:subscriptions)
                      .select("plans.*, COUNT(subscriptions.id) AS subscriptions_count")
                      .group("plans.id")
                      .order(:price_cents, :name)

          render json: { success: true, plans: plans.map { |plan| serialize_plan(plan) } }
        end

        def show
          render json: { success: true, plan: serialize_plan(@plan, include_companies: true) }
        end

        def create
          plan = Plan.new(plan_params)

          if plan.save
            audit!("plan_created", resource: plan, metadata: { name: plan.name, slug: plan.slug, price_cents: plan.price_cents })
            render json: { success: true, plan: serialize_plan(plan) }, status: :created
          else
            render json: { success: false, errors: plan.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          previous = @plan.attributes.slice("name", "slug", "price_cents", "billing_cycle", "status")

          if @plan.update(plan_params)
            audit!(
              "plan_updated",
              resource: @plan,
              metadata: {
                previous: previous,
                current: @plan.attributes.slice("name", "slug", "price_cents", "billing_cycle", "status")
              }
            )
            render json: { success: true, plan: serialize_plan(@plan) }
          else
            render json: { success: false, errors: @plan.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_plan
          @plan = Plan.find(params[:id])
        end

        def plan_params
          params.require(:plan).permit(:name, :slug, :price_cents, :billing_cycle, :description, :status, features_json: [])
        end

        def serialize_plan(plan, include_companies: false)
          payload = {
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            price_cents: plan.price_cents,
            billing_cycle: plan.billing_cycle,
            description: plan.description,
            features_json: plan.features_json,
            status: plan.status,
            subscriptions_count: plan.respond_to?(:subscriptions_count) ? plan.subscriptions_count.to_i : plan.subscriptions.count,
            active_subscriptions_count: plan.subscriptions.where(status: "active").count,
            mrr_cents: plan.subscriptions.where(status: "active").sum(:price_cents),
            created_at: plan.created_at,
            updated_at: plan.updated_at
          }

          if include_companies
            payload[:companies] = plan.subscriptions.includes(:company).order(created_at: :desc).map do |subscription|
              company = subscription.company
              {
                id: company.id,
                name: company.name,
                slug: company.slug,
                status: company.status,
                subscription_status: subscription.status
              }
            end
          end

          payload
        end
      end
    end
  end
end
