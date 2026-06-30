class MasterDashboardService
  PERIODS = {
    "today" => -> { Time.current.beginning_of_day..Time.current.end_of_day },
    "7d" => -> { 6.days.ago.beginning_of_day..Time.current.end_of_day },
    "30d" => -> { 29.days.ago.beginning_of_day..Time.current.end_of_day },
    "current_month" => -> { Time.current.beginning_of_month..Time.current.end_of_month },
    "previous_month" => -> { 1.month.ago.beginning_of_month..1.month.ago.end_of_month }
  }.freeze

  def initialize(period: "7d")
    @period_key = PERIODS.key?(period.to_s) ? period.to_s : "7d"
    @range = PERIODS.fetch(@period_key).call
    @previous_range = previous_range_for(@range)
  end

  def call
    {
      success: true,
      period: {
        key: @period_key,
        starts_at: @range.begin,
        ends_at: @range.end,
        previous_starts_at: @previous_range.begin,
        previous_ends_at: @previous_range.end
      },
      overview: overview,
      charts: charts,
      alerts: alerts,
      recent_companies: recent_companies,
      recent_activities: recent_activities
    }
  end

  private

  def overview
    active_subscriptions = Subscription.where(status: "active")
    orders_scope = Order.where(created_at: @range)
    previous_orders = Order.where(created_at: @previous_range)
    processed_revenue = orders_scope.where.not(status: "cancelled").sum(:total_cents)
    previous_revenue = previous_orders.where.not(status: "cancelled").sum(:total_cents)
    mrr = active_subscriptions.sum(:price_cents)

    {
      companies_total: metric(Company.count),
      companies_active: metric(Company.where(status: "active").count, previous_count_for(Company.where(status: "active"))),
      companies_trial: metric(Company.where(status: "trial").count),
      companies_inactive: metric(Company.where(status: %w[inactive suspended canceled]).count),
      companies_new: metric(Company.where(created_at: @range).count, Company.where(created_at: @previous_range).count),
      founder_companies: metric(Company.where(origin: "founder_program").count),
      founder_remaining: metric(FounderProgramSetting.current.remaining),
      master_users: metric(User.where.not(master_role_id: nil).or(User.where(global_role: "super_admin")).count),
      store_users: metric(User.joins(:company_members).distinct.count),
      orders_total: metric(Order.count),
      orders_today: metric(Order.today.count, Order.where(created_at: 1.day.ago.beginning_of_day..1.day.ago.end_of_day).count),
      processed_revenue_cents: metric(processed_revenue, previous_revenue),
      mrr_cents: metric(mrr),
      active_subscriptions: metric(active_subscriptions.count),
      overdue_subscriptions: metric(Subscription.where(status: %w[overdue suspended]).count),
      whatsapp_connected: metric(WhatsappInstance.where(status: "connected").count),
      whatsapp_disconnected: metric(WhatsappInstance.where(status: %w[not_created created disconnected error]).count),
      tickets_open: metric(SupportTicket.where(status: "open").count),
      tickets_pending: metric(SupportTicket.where(status: "pending").count),
      tickets_resolved: metric(SupportTicket.where(status: %w[resolved closed]).count),
      carina_usage_today: metric(AiAssistantLog.where(created_at: Time.current.all_day).count, AiAssistantLog.where(created_at: 1.day.ago.all_day).count),
      mercado_pago_errors: metric(Order.where(payment_method: "pix", payment_status: %w[failed expired cancelled]).where(created_at: @range).count),
      pix_approved: metric(Order.where(payment_method: "pix", payment_status: "paid").where(created_at: @range).count),
      pix_pending: metric(Order.where(payment_method: "pix", payment_status: "pending_payment").count)
    }
  end

  def charts
    {
      revenue: daily_series(@range) { |range| Order.where(created_at: range).where.not(status: "cancelled").sum(:total_cents) },
      orders: daily_series(@range) { |range| Order.where(created_at: range).count },
      carina_usage: daily_series(@range) { |range| AiAssistantLog.where(created_at: range).count },
      companies_by_month: month_series(6) { |range| Company.where(created_at: range).count },
      tickets_by_status: SupportTicket::STATUSES.map { |status| { label: status, value: SupportTicket.where(status: status).count } },
      whatsapp_status: [
        { label: "Conectados", value: WhatsappInstance.where(status: "connected").count, color: "#22c55e" },
        { label: "Desconectados", value: WhatsappInstance.where(status: %w[not_created created disconnected error]).count, color: "#ef4444" }
      ]
    }
  end

  def alerts
    items = []

    WhatsappInstance.includes(:company).where.not(status: "connected").limit(8).find_each do |instance|
      items << alert("whatsapp_disconnected", "WhatsApp desconectado", instance.company, "A instancia #{instance.instance_name} esta #{instance.status}.", "whatsapp")
    end

    SupportTicket.includes(:company).where(status: %w[open pending]).where("created_at <= ?", 8.hours.ago).limit(8).find_each do |ticket|
      items << alert("ticket_old", "Ticket aberto ha mais de 8h", ticket.company, ticket.subject, "tickets")
    end

    Company.where(status: "trial").where(trial_ends_at: Time.current..3.days.from_now).limit(8).find_each do |company|
      items << alert("trial_expiring", "Teste perto de vencer", company, "Trial termina em #{company.trial_ends_at&.strftime('%d/%m/%Y')}.", "subscription")
    end

    Company.where(status: %w[inactive suspended canceled]).limit(8).find_each do |company|
      items << alert("company_inactive", "Empresa inativa", company, "Status atual: #{company.status}.", "company")
    end

    Order.where(payment_method: "pix", payment_status: "pending_payment").where("created_at <= ?", 10.minutes.ago).includes(:company).limit(8).find_each do |order|
      items << alert("old_pix_pending", "Pix pendente antigo", order.company, "Pedido ##{order.order_number || order.id} aguarda pagamento.", "payments")
    end

    items.first(12)
  end

  def recent_companies
    Company.includes(:domains, :subscriptions, :whatsapp_instances, :store_setting)
      .order(created_at: :desc)
      .limit(8)
      .map do |company|
        month_orders = company.orders.where(created_at: Time.current.beginning_of_month..Time.current.end_of_month)
        today_orders = company.orders.today
        sub = company.subscriptions.order(created_at: :desc).first
        {
          id: company.id,
          name: company.name,
          slug: company.slug,
          logo_url: company_logo_url(company),
          domain: company.domains.first&.domain || "#{company.slug}.replymesh.cloud",
          plan: sub&.plan&.name || "-",
          status: company.status,
          orders_today: today_orders.count,
          revenue_month_cents: month_orders.where.not(status: "cancelled").sum(:total_cents),
          whatsapp_status: company.whatsapp_instances.order(updated_at: :desc).first&.status || "not_created",
          created_at: company.created_at
        }
      end
  end

  def company_logo_url(company)
    company.logo_url.presence || company.store_setting&.logo_url.presence
  end

  def recent_activities
    MasterAuditLog.includes(:actor, :company).recent.limit(12).map do |log|
      {
        id: log.id,
        action: log.action,
        module_name: log.module_name,
        status: log.status,
        created_at: log.created_at,
        actor: { id: log.actor_id, name: log.actor_name, email: log.actor_email },
        company: log.company_id && { id: log.company_id, name: log.company_name }
      }
    end
  end

  def metric(value, previous = nil)
    previous = value if previous.nil?
    {
      value: value.to_i,
      previous_value: previous.to_i,
      variation_percent: variation(value.to_f, previous.to_f)
    }
  end

  def variation(current, previous)
    return 0.0 if previous.zero? && current.zero?
    return 100.0 if previous.zero?

    (((current - previous) / previous) * 100).round(1)
  end

  def previous_count_for(scope)
    scope.where(created_at: @previous_range).count
  end

  def previous_range_for(range)
    length = range.end - range.begin
    (range.begin - length)..(range.begin - 1.second)
  end

  def daily_series(range)
    range.begin.to_date.upto(range.end.to_date).map do |date|
      day_range = date.beginning_of_day..date.end_of_day
      {
        label: date.strftime("%d/%m"),
        value: yield(day_range).to_i
      }
    end
  end

  def month_series(months)
    (months - 1).downto(0).map do |ago|
      date = ago.months.ago
      range = date.beginning_of_month..date.end_of_month
      { label: date.strftime("%b/%y"), value: yield(range).to_i }
    end
  end

  def alert(kind, title, company, message, action)
    {
      kind: kind,
      title: title,
      message: message,
      company: company && { id: company.id, name: company.name, slug: company.slug, status: company.status },
      action: action
    }
  end
end
