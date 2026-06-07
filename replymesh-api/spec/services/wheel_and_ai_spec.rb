require "rails_helper"

RSpec.describe "Wheel and local AI services" do
  let!(:company) { create_company(name: "Demo IA") }
  let!(:store) { create_store(company) }
  let!(:user) { create_user(email: "ia@example.com") }
  let!(:customer) { create_customer(company) }

  it "grants a spin for a completed eligible order and generates a prize coupon" do
    order = create_order(company: company, customer: customer, status: "completed", total_cents: 2_500)
    WheelPrize.create!(
      company: company, name: "10% OFF", prize_type: "percentage",
      discount_value: 10, probability_weight: 100, coupon_valid_days: 7
    )

    grant = WheelService.grant_for_order(order)
    spin = WheelService.spin(company: company, phone: customer.phone)

    expect(grant.payload[:created]).to eq(1)
    expect(spin).to be_success
    expect(spin.payload[:coupon]).to be_present
    coupon = Coupon.find(spin.payload[:coupon]["id"] || spin.payload[:coupon][:id])
    expect(coupon.source).to eq("wheel")
    expect(coupon.customer_id).to eq(customer.id)
    expect(coupon.max_uses).to eq(1)
    expect(coupon.is_single_use_per_customer).to be(true)
    expect(coupon.expires_at).to be_within(5.seconds).of(7.days.from_now)
  end

  it "allows a wheel coupon only for its owner and only once" do
    other_customer = create_customer(company, phone: "21977776666")
    coupon = Coupon.create!(
      company: company,
      customer: customer,
      code: "ROLETAOWNER",
      title: "Premio pessoal",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: 1,
      used_count: 0,
      starts_at: Time.current,
      expires_at: 7.days.from_now,
      is_active: true,
      is_single_use_per_customer: true,
      source: "wheel"
    )

    owner_result = CouponValidationService.call(
      company: company, code: coupon.code, order_total_cents: 5_000,
      customer_phone: "+55 #{customer.phone}"
    )
    other_result = CouponValidationService.call(
      company: company, code: coupon.code, order_total_cents: 5_000,
      customer_phone: other_customer.phone
    )

    expect(owner_result).to be_valid
    expect(other_result).not_to be_valid
    expect(other_result.message).to eq("Cupom vinculado a outro cliente")

    create_order(company: company, customer: customer, status: "completed", total_cents: 5_000)
      .update!(coupon: coupon, coupon_code: coupon.code)
    coupon.update!(used_count: 1)

    reused_result = CouponValidationService.call(
      company: company, code: coupon.code, order_total_cents: 5_000,
      customer_phone: customer.phone
    )
    expect(reused_result).not_to be_valid
    expect(reused_result.message).to eq("Cupom esgotado")
  end

  it "makes Carina answer greetings naturally and block out-of-scope questions" do
    expect(ReplymeshKnowledgeService.local_answer("Boa noite", user_name: "Marinho")).to include("Marinho")
    expect(ReplymeshKnowledgeService.local_answer("Qual o resultado do futebol?")).to eq(ReplymeshKnowledgeService::OUT_OF_SCOPE)
  end

  it "answers a product question in the store simulator without external AI" do
    create_catalog(company)
    StoreAiSetting.for_company(company).update!(enabled: false)

    result = StoreAiService.call(company: company, user: user, question: "Tem X-Tudo?", simulate: true)

    expect(result[:status]).to be_in(%w[success fallback])
    expect(result[:answer]).to include("X-Tudo")
  end
end
