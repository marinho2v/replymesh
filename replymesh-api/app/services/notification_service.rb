class NotificationService
  def self.notify_company(company:, title:, message: nil, type: 'system', link_url: nil, metadata: {})
    return unless company

    Notification.create!(
      company: company,
      title: title,
      message: message,
      notification_type: type,
      link_url: link_url,
      metadata: metadata || {}
    )
  rescue => e
    Rails.logger.warn("[NotificationService] Failed to create notification: #{e.message}")
    nil
  end

  def self.notify_master(title:, message: nil, type: 'system_alert', link_url: nil, metadata: {})
    Notification.create!(
      company: nil,
      user: nil,
      title: title,
      message: message,
      notification_type: type,
      link_url: link_url,
      metadata: metadata || {}
    )
  rescue => e
    Rails.logger.warn("[NotificationService] Failed to create master notification: #{e.message}")
    nil
  end

  # Triggered when a new order is received
  def self.order_received(order)
    return unless order&.company

    notify_company(
      company: order.company,
      title: "Novo pedido ##{order.order_number}",
      message: "#{order.customer_name} â€” #{format_money(order_amount(order))}",
      type: 'order',
      link_url: "/admin/orders/#{order.id}",
      metadata: { order_id: order.id, order_number: order.order_number, total: order_amount(order) }
    )
  end

  # Triggered when loja creates a support ticket
  def self.ticket_created(ticket)
    return unless ticket

    notify_master(
      title: "Novo ticket de suporte",
      message: "#{ticket.company&.name}: #{ticket.subject}",
      type: 'ticket',
      link_url: "/tickets/#{ticket.id}",
      metadata: { ticket_id: ticket.id, company_id: ticket.company_id, priority: ticket.priority }
    )
  end

  # Triggered when master replies to a ticket
  def self.ticket_replied(ticket)
    return unless ticket&.company

    notify_company(
      company: ticket.company,
      title: "Seu ticket foi respondido",
      message: "Ticket: #{ticket.subject}",
      type: 'ticket',
      link_url: "/admin/support",
      metadata: { ticket_id: ticket.id }
    )
  end

  # Stock low alert
  def self.stock_low(company:, item_name:, current_qty:, min_qty:)
    notify_company(
      company: company,
      title: "Estoque baixo: #{item_name}",
      message: "Atual: #{current_qty} | MÃ­nimo: #{min_qty}",
      type: 'stock',
      link_url: "/admin/inventory",
      metadata: { item_name: item_name, current_qty: current_qty, min_qty: min_qty }
    )
  end

  # System update announcement
  def self.system_update(version:, notes:, company: nil)
    params = {
      title: "AtualizaÃ§Ã£o do sistema #{version}",
      message: notes,
      type: 'system_update',
      link_url: "/admin/updates",
      metadata: { version: version }
    }

    if company
      notify_company(**params.merge(company: company))
    else
      # broadcast to all companies
      Company.find_each do |c|
        notify_company(**params.merge(company: c))
      rescue => e
        Rails.logger.warn("[NotificationService] Failed broadcast to company #{c.id}: #{e.message}")
      end
    end
  end

  private

  def self.format_money(value)
    return 'R$ 0,00' unless value

    "R$ #{format('%.2f', value.to_f).gsub('.', ',')}"
  end

  def self.order_amount(order)
    return order.total_brl.to_f if order.respond_to?(:total_brl)
    return order.total_cents.to_i / 100.0 if order.respond_to?(:total_cents)

    order.total.to_f
  end
end

