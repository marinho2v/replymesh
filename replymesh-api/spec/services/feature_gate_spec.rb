require "rails_helper"

RSpec.describe FeatureGate do
  let(:company) { create_company(name: "Loja Feature Gate") }
  let(:admin) { create_user(email: "feature-admin@example.com") }

  before do
    add_member(admin, company)
  end

  it "allows core and basic WhatsApp features on Start" do
    assign_plan(company, slug: "start")

    expect(described_class.enabled?(company, "orders")).to be(true)
    expect(described_class.enabled?(company, "whatsapp_basic")).to be(true)
    expect(described_class.enabled?(company, "cashier")).to be(true)
  end

  it "blocks paid automation on Start" do
    assign_plan(company, slug: "start")

    expect(described_class.enabled?(company, "store_ai")).to be(false)
    expect(described_class.enabled?(company, "marketing_whatsapp")).to be(false)
    expect(described_class.enabled?(company, "sales_recovery")).to be(false)
  end

  it "allows Pro features on Pro" do
    assign_plan(company, slug: "pro")

    expect(described_class.enabled?(company, "store_ai")).to be(true)
    expect(described_class.enabled?(company, "marketing_whatsapp")).to be(true)
    expect(described_class.enabled?(company, "sales_recovery")).to be(true)
    expect(described_class.enabled?(company, "inventory")).to be(true)
  end

  it "treats legacy enterprise subscriptions as Pro compatibility" do
    assign_plan(company, slug: "enterprise")

    FeatureCatalog.keys.each do |feature_key|
      expect(described_class.enabled?(company, feature_key)).to be(true), "expected #{feature_key} to be enabled"
    end
  end

  it "allows a manually released feature for a lower plan" do
    assign_plan(company, slug: "start")
    CompanyFeatureOverride.create!(company: company, feature_key: "coupons", mode: "allow", created_by: admin)

    expect(described_class.enabled?(company, "coupons")).to be(true)
  end

  it "blocks a manually disabled feature even when the plan includes it" do
    assign_plan(company, slug: "pro")
    CompanyFeatureOverride.create!(company: company, feature_key: "store_ai", mode: "block", created_by: admin)

    expect(described_class.enabled?(company, "store_ai")).to be(false)
  end

  it "does not use manual allow to bypass an inactive subscription" do
    assign_plan(company, slug: "start", status: "canceled")
    CompanyFeatureOverride.create!(company: company, feature_key: "store_ai", mode: "allow", created_by: admin)

    expect(described_class.enabled?(company, "store_ai")).to be(false)
  end

  it "does not use expired manual allow overrides" do
    assign_plan(company, slug: "start")
    CompanyFeatureOverride.create!(company: company, feature_key: "store_ai", mode: "allow", expires_at: 1.day.ago, created_by: admin)

    expect(described_class.enabled?(company, "store_ai")).to be(false)
  end

  it "supports legacy feature keys as aliases" do
    assign_plan(company, slug: "pro")

    expect(described_class.enabled?(company, "ia_loja")).to be(true)
  end
end
