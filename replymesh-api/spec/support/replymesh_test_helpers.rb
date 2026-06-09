module ReplymeshTestHelpers
  def create_company(name: "Loja Teste", slug: nil, status: "active")
    slug ||= "#{name.parameterize}-#{SecureRandom.hex(3)}"
    Company.create!(
      name: name,
      slug: slug,
      responsible_name: "Responsavel",
      responsible_email: "#{slug}@example.com",
      responsible_phone: "21999990000",
      status: status,
      plan_status: "active",
      subdomain: "#{slug}.replymesh.cloud",
      primary_domain: "#{slug}.replymesh.cloud",
      domain_status: "active",
      custom_domain_status: "inactive"
    )
  end

  def create_user(email:, role: "user", password: "admin123456", master_role: nil)
    User.create!(
      name: email.split("@").first.titleize,
      email: email,
      password: password,
      password_confirmation: password,
      global_role: role,
      status: "active",
      master_role: master_role
    )
  end

  def add_member(user, company, role: "store_admin")
    CompanyMember.create!(user: user, company: company, role: role, status: "active")
  end

  def create_plan(slug:, name: nil)
    Plan.find_or_create_by!(slug: slug.to_s) do |plan|
      plan.name = name || slug.to_s.titleize
      plan.status = "active"
      plan.billing_cycle = "monthly"
      plan.price_cents = 0
    end
  end

  def assign_plan(company, slug: "start", status: "active")
    plan = create_plan(slug: slug)
    Subscription.create!(
      company: company,
      plan: plan,
      status: status,
      started_at: Time.current,
      current_period_start: Time.current,
      current_period_end: 30.days.from_now
    )
    company.update!(plan_status: status == "active" ? "active" : status)
    plan
  end

  def create_store(company, status: "open", delivery_fee_cents: 700)
    StoreSetting.create!(
      company: company,
      store_name: company.name,
      company_name: company.name,
      trade_name: company.name,
      store_status: status,
      block_orders_when_closed: true,
      delivery_fee_cents: delivery_fee_cents,
      default_delivery_fee_cents: delivery_fee_cents,
      min_order_value_cents: 0,
      free_delivery_above_cents: 0,
      estimated_delivery_minutes: 40
    )
  end

  def create_catalog(company, price_cents: 2_500)
    category = Category.create!(company: company, name: "Lanches", slug: "lanches", sort_order: 0, is_active: true)
    product = Product.create!(
      company: company,
      category: category,
      name: "X-Tudo",
      slug: "x-tudo",
      price_cents: price_cents,
      cost_price_cents: 1_000,
      is_active: true
    )
    [category, product]
  end

  def create_customer(company, phone: "21999990001")
    Customer.create!(company: company, full_name: "Cliente Teste", phone: phone, whatsapp: phone)
  end

  def create_order(company:, customer: nil, status: "pending", order_type: "delivery",
                   payment_method: "money", payment_status: "not_required", total_cents: 3_200)
    customer ||= create_customer(company)
    Order.create!(
      company: company,
      customer: customer,
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      customer_whatsapp: customer.whatsapp,
      order_type: order_type,
      payment_method: payment_method,
      payment_status: payment_status,
      status: status,
      delivery_status: "pending",
      subtotal_cents: total_cents,
      delivery_fee_cents: 0,
      discount_cents: 0,
      total_cents: total_cents
    )
  end

  def jwt_for(user, claims = {})
    JWT.encode(
      { user_id: user.id, exp: 1.hour.from_now.to_i }.merge(claims),
      ENV.fetch("JWT_SECRET") { Rails.application.secret_key_base },
      "HS256"
    )
  end

  def auth_headers(user, company: nil)
    headers = { "Authorization" => "Bearer #{jwt_for(user)}" }
    headers["X-Company-Id"] = company.id.to_s if company
    headers
  end

  def json
    JSON.parse(response.body)
  end
end

RSpec.configure do |config|
  config.include ReplymeshTestHelpers
end
