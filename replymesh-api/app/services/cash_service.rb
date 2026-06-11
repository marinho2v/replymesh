# CashService
#
# Responsável por abrir/fechar sessões de caixa e registrar movimentações.
# Equivalente às RPCs: open_cash_session, close_cash_session, add_cash_movement, record_order_payment.
#
# Uso:
#   CashService.open_session(company: company, user: user, opening_amount_cents: 10000)
#   CashService.close_session(session: session, user: user, counted_cents: 15000, notes: "ok")
#   CashService.record_payment(order: order, user: user)
#   CashService.add_movement(session: session, type: "sangria", amount_cents: 5000, user: user)
#
class CashService
  Result = Struct.new(:success, :data, :error, keyword_init: true) do
    def success? = success
  end

  # ─── Abrir caixa ────────────────────────────────────────────────────────────
  def self.open_session(company:, user:, opening_amount_cents: 0, notes: nil)
    existing = CashSession.current_for(company.id)
    return Result.new(success: false, error: "Já existe um caixa aberto") if existing

    session = CashSession.create!(
      company:              company,
      opened_by:            user,
      opening_amount_cents: opening_amount_cents.to_i,
      status:               "open",
      opened_at:            Time.current,
      notes:                notes
    )
    Result.new(success: true, data: session)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end

  # ─── Fechar caixa ───────────────────────────────────────────────────────────
  def self.close_session(session:, user:, counted_cents:, closing_notes: nil)
    return Result.new(success: false, error: "Caixa não está aberto") unless session&.open?

    expected = calculate_expected_balance(session)

    session.update!(
      status:                   "closed",
      closed_by:                user,
      closed_at:                Time.current,
      closing_expected_cents:   expected,
      closing_counted_cents:    counted_cents.to_i,
      difference_cents:         counted_cents.to_i - expected,
      closing_notes:            closing_notes
    )
    Result.new(success: true, data: session)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end

  # ─── Registrar pagamento de pedido no caixa ─────────────────────────────────
  def self.record_payment(order:, user: nil)
    if order.financial_recorded_at.present?
      return Result.new(success: true, data: CashSession.current_for(order.company_id))
    end

    session = CashSession.current_for(order.company_id)
    return Result.new(success: false, error: "Nenhum caixa aberto") unless session

    movements   = movements_for_order(order)
    origin_info = build_origin_info(order)

    ActiveRecord::Base.transaction do
      movements.each do |attrs|
        session.cash_movements.create!(
          company_id:          order.company_id,
          order:               order,
          created_by:          user,
          **origin_info,
          **attrs
        )
      end

      OrderPaymentDetail.find_or_create_by!(company: order.company, order: order) do |d|
        d.payment_method   = order.payment_method
        d.amount_cents     = order.total_cents
        d.needs_change     = order.needs_change
        d.change_for_cents = order.change_for_cents
      end

      order.update_columns(financial_recorded_at: Time.current, paid_at: Time.current)
    end

    Result.new(success: true, data: session)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end

  # ─── Adicionar movimentação manual ──────────────────────────────────────────
  def self.add_movement(session:, movement_type:, amount_cents:, user: nil, notes: nil)
    return Result.new(success: false, error: "Caixa não está aberto") unless session&.open?

    movement = session.cash_movements.create!(
      company_id:           session.company_id,
      movement_type:        movement_type,
      amount_cents:         amount_cents.to_i,
      affects_physical_cash: %w[sangria reinforcement withdrawal adjustment].include?(movement_type),
      created_by:           user,
      notes:                notes
    )
    Result.new(success: true, data: movement)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end

  private_class_method def self.build_origin_info(order)
    origin = case order.order_type
             when "delivery" then "delivery"
             when "dine_in"  then "table"
             when "pickup"   then "pickup"
             when "pos"      then "pos"
             else "other"
             end

    return { origin: origin } unless order.order_type == "dine_in"

    ts = order.table_session
    {
      origin:             "table",
      origin_table_name:  ts&.dining_table&.name,
      origin_waiter_name: ts&.opened_by&.name
    }
  end

  private_class_method def self.movements_for_order(order)
    movements = []
    type = order.payment_method == "money"             ? "sale_cash"
           : order.payment_method == "pix"             ? "sale_pix"
           : "sale_card"

    movements << { movement_type: type, amount_cents: order.total_cents,
                   affects_physical_cash: type == "sale_cash" }

    if order.needs_change && order.change_for_cents.to_i > 0
      change = order.change_for_cents - order.total_cents
      movements << { movement_type: "change_given", amount_cents: [change, 0].max,
                     affects_physical_cash: true } if change > 0
    end

    movements
  end

  private_class_method def self.calculate_expected_balance(session)
    movements = session.cash_movements
    opening   = session.opening_amount_cents

    cash_in  = movements.where(movement_type: %w[sale_cash reinforcement],
                               affects_physical_cash: true).sum(:amount_cents)
    cash_out = movements.where(movement_type: %w[change_given sangria withdrawal refund],
                               affects_physical_cash: true).sum(:amount_cents)
    opening + cash_in - cash_out
  end
end
