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
end
