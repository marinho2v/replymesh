class SystemUpdatePublicationService
  def self.call(system_update)
    new(system_update).call
  end

  def initialize(system_update)
    @system_update = system_update
  end

  def call
    target_companies.find_each { |company| notify(company) }
    notify_master
  end

  private

  def target_companies
    case @system_update.audience_type
    when "company"
      Company.where(id: @system_update.company_id)
    when "plan"
      Company.joins(subscriptions: :plan).where(plans: { slug: @system_update.plan_key }).distinct
    else
      Company.all
    end
  end

  def notify(company)
    exists = Notification.where(company: company, notification_type: "system_update")
      .where("metadata ->> 'system_update_id' = ?", @system_update.id.to_s)
      .exists?
    return if exists

    NotificationService.notify_company(
      company: company,
      title: @system_update.title,
      message: @system_update.short_description,
      type: "system_update",
      link_url: "/admin/updates",
      metadata: { system_update_id: @system_update.id, version: @system_update.version }
    )
  end

  def notify_master
    exists = Notification.where(company_id: nil, notification_type: "system_update")
      .where("metadata ->> 'system_update_id' = ?", @system_update.id.to_s)
      .exists?
    return if exists

    NotificationService.notify_master(
      title: "Atualizacao publicada: #{@system_update.title}",
      message: @system_update.short_description,
      type: "system_update",
      link_url: "/configuracoes/atualizacoes",
      metadata: { system_update_id: @system_update.id, version: @system_update.version }
    )
  end
end
