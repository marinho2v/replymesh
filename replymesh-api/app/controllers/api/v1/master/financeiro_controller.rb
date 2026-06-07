module Api
  module V1
    module Master
      class FinanceiroController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        # GET /api/v1/master/financeiro
        def index
          render json: {
            success: true,
            metrics: current_metrics,
            monthly_evolution: monthly_evolution,
            revenue_by_plan: revenue_by_plan,
            top_companies: top_companies_by_revenue
          }
        end

        # GET /api/v1/master/financeiro/cobrancas
        def cobrancas
          subs = Subscription
            .where(status: %w[active trial])
            .includes(:company, :plan)
            .order(current_period_end: :asc, price_cents: :desc)
            .limit(100)

          total_expected_cents = subs.where(status: "active").sum(:price_cents)

          render json: {
            success: true,
            total_expected_cents: total_expected_cents,
            total_expected_brl: cents_to_brl(total_expected_cents),
            count: subs.size,
            cobrancas: subs.map { |s| serialize_cobranca(s) }
          }
        end

        # GET /api/v1/master/financeiro/inadimplencia
        def inadimplencia
          overdue_subs = Subscription
            .where(status: %w[overdue suspended])
            .includes(:company, :plan)
            .order(created_at: :asc)

          total_overdue_cents = overdue_subs.sum(:price_cents)

          render json: {
            success: true,
            total_overdue_cents: total_overdue_cents,
            total_overdue_brl: cents_to_brl(total_overdue_cents),
            count: overdue_subs.size,
            inadimplentes: overdue_subs.map { |s| serialize_inadimplente(s) }
          }
        end

        private

        # ─────────── Métricas principais ───────────

        def current_metrics
          active_subs = Subscription.where(status: "active")
          mrr_cents   = active_subs.sum(:price_cents)

          {
            mrr_cents: mrr_cents,
            mrr_brl: cents_to_brl(mrr_cents),
            arr_cents: mrr_cents * 12,
            arr_brl: cents_to_brl(mrr_cents * 12),
            total_companies: Company.count,
            active_companies: Company.where(status: "active").count,
            trial_companies: Company.where(status: "trial").count,
            overdue_companies: Subscription.where(status: "overdue").joins(:company).distinct.count("companies.id"),
            suspended_companies: Company.where(status: "suspended").count,
            canceled_companies: Company.where(status: "canceled").count,
            active_subscriptions: active_subs.count,
            trial_subscriptions: Subscription.where(status: "trial").count,
            overdue_subscriptions: Subscription.where(status: "overdue").count
          }
        end

        # ─────────── Evolução mensal (últimos 12 meses) ───────────

        def monthly_evolution
          today = Time.current
          12.downto(0).map do |months_ago|
            period_start = (today - months_ago.months).beginning_of_month
            period_end   = (today - months_ago.months).end_of_month

            # Assinaturas ativas que foram criadas até o final do período
            # e não foram canceladas antes do início do período
            active_cents = Subscription
              .where(status: %w[active trial])
              .where("started_at <= ?", period_end)
              .sum(:price_cents)

            new_subs_count = Subscription
              .where("started_at >= ? AND started_at <= ?", period_start, period_end)
              .count

            {
              month:            period_start.strftime("%b/%y"),
              month_key:        period_start.strftime("%Y-%m"),
              mrr_cents:        active_cents,
              mrr_brl:          cents_to_brl(active_cents),
              new_count:        new_subs_count
            }
          end
        end

        # ─────────── Receita por plano ───────────

        def revenue_by_plan
          rows = Plan
            .joins("LEFT JOIN subscriptions ON subscriptions.plan_id = plans.id AND subscriptions.status = 'active'")
            .group("plans.id", "plans.name", "plans.slug", "plans.price_cents")
            .select(
              "plans.id",
              "plans.name",
              "plans.slug",
              "plans.price_cents",
              "COUNT(subscriptions.id) AS sub_count",
              "COALESCE(SUM(subscriptions.price_cents), 0) AS total_cents"
            )
            .order("total_cents DESC")

          rows.map do |p|
            {
              plan_id:            p.id,
              plan_name:          p.name,
              plan_slug:          p.slug,
              plan_price_cents:   p.price_cents,
              subscription_count: p.sub_count.to_i,
              total_cents:        p.total_cents.to_i,
              total_brl:          cents_to_brl(p.total_cents.to_i)
            }
          end
        end

        # ─────────── Top empresas por receita ───────────

        def top_companies_by_revenue
          Company
            .joins(:subscriptions)
            .where(subscriptions: { status: "active" })
            .group("companies.id")
            .select("companies.id, companies.name, companies.slug, companies.status, SUM(subscriptions.price_cents) AS revenue_cents")
            .order("revenue_cents DESC")
            .limit(10)
            .map do |c|
              {
                id:            c.id,
                name:          c.name,
                slug:          c.slug,
                status:        c.status,
                revenue_cents: c.revenue_cents.to_i,
                revenue_brl:   cents_to_brl(c.revenue_cents.to_i)
              }
            end
        end

        # ─────────── Serializers ───────────

        def serialize_cobranca(sub)
          {
            id:                sub.id,
            status:            sub.status,
            price_cents:       sub.price_cents,
            price_brl:         cents_to_brl(sub.price_cents),
            started_at:        sub.started_at,
            trial_ends_at:     sub.trial_ends_at,
            current_period_end: sub.current_period_end,
            plan:              sub.plan && { id: sub.plan.id, name: sub.plan.name, slug: sub.plan.slug },
            company:           sub.company && {
              id:     sub.company.id,
              name:   sub.company.name,
              slug:   sub.company.slug,
              status: sub.company.status
            }
          }
        end

        def serialize_inadimplente(sub)
          {
            id:            sub.id,
            status:        sub.status,
            price_cents:   sub.price_cents,
            price_brl:     cents_to_brl(sub.price_cents),
            started_at:    sub.started_at,
            canceled_at:   sub.canceled_at,
            plan:          sub.plan && { id: sub.plan.id, name: sub.plan.name },
            company:       sub.company && {
              id:         sub.company.id,
              name:       sub.company.name,
              slug:       sub.company.slug,
              status:     sub.company.status,
              created_at: sub.company.created_at
            }
          }
        end

        # ─────────── Helper ───────────

        def cents_to_brl(cents)
          (cents.to_i / 100.0).round(2)
        end
      end
    end
  end
end
