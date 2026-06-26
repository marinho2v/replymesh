require "rails_helper"

RSpec.describe CompanyModuleAssignment do
  let(:company) { create_company(name: "Loja Modulos") }
  let(:admin) { create_user(email: "modules-admin@example.com") }

  before do
    add_member(admin, company)
    assign_plan(company, slug: "pro")
    create_store(company)
  end

  it "applies a basic custom module set without affecting another company" do
    other_company = create_company(name: "Outra Loja")
    assign_plan(other_company, slug: "pro")

    described_class.apply!(
      company: company,
      module_keys: CompanyModuleCatalog.preset("basic"),
      actor: admin
    )

    expect(FeatureGate.enabled?(company, "orders")).to be(true)
    expect(FeatureGate.enabled?(company, "whatsapp_manual")).to be(true)
    expect(FeatureGate.enabled?(company, "pos_counter")).to be(false)
    expect(FeatureGate.enabled?(company, "motoboy_panel")).to be(false)
    expect(company.store_setting.reload.whatsapp_mode).to eq("manual")
    expect(FeatureGate.enabled?(other_company, "pos_counter")).to be(true)
  end

  it "enables every catalog module in the complete preset" do
    described_class.apply!(
      company: company,
      module_keys: CompanyModuleCatalog.preset("complete"),
      actor: admin
    )

    expect(CompanyModuleCatalog.access_map(company)[:disabled]).to be_empty
    expect(company.store_setting.reload.whatsapp_mode).to eq("automatic")
  end

  it "keeps core modules enabled even when they are omitted" do
    described_class.apply!(
      company: company,
      module_keys: [],
      actor: admin
    )

    expect(CompanyModuleCatalog::CORE_FEATURES).to all(satisfy { |feature| FeatureGate.enabled?(company, feature) })
    expect(CompanyModuleCatalog.access_map(company)[:enabled]).to include(*CompanyModuleCatalog::CORE_KEYS)
  end

  it "automatically enables dependencies for AI and Mercado Pago" do
    applied = described_class.apply!(
      company: company,
      module_keys: %w[store_ai mercado_pago],
      actor: admin
    )

    expect(applied).to include("store_ai", "mercado_pago", "orders", "products", "categories", "checkout")
    expect(FeatureGate.enabled?(company, "store_ai")).to be(true)
    expect(FeatureGate.enabled?(company, "mercado_pago")).to be(true)
  end

  it "allows inventory to be disabled without disabling orders" do
    described_class.apply!(
      company: company,
      module_keys: CompanyModuleCatalog.preset("complete") - ["inventory"],
      actor: admin
    )

    expect(FeatureGate.enabled?(company, "inventory")).to be(false)
    expect(FeatureGate.enabled?(company, "orders")).to be(true)
    expect(FeatureGate.enabled?(company, "checkout")).to be(true)
  end

  it "reports delivery dependents before removal" do
    dependents = CompanyModuleCatalog.dependents_for("delivery", %w[delivery motoboy motoboy_app])

    expect(dependents).to contain_exactly("motoboy", "motoboy_app")
  end
end
