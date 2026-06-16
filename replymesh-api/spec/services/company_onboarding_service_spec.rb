require "rails_helper"

RSpec.describe CompanyOnboardingService do
  before do
    Plan.create!(name: "START", slug: "start", price_cents: 29_900)
  end

  it "creates a company with a prepared Evolution instance and location webhook" do
    client = instance_double(
      EvolutionGoClient,
      create_instance: {
        instance_name: "replymesh_nova_loja",
        status: "created",
        raw_status: "created",
        base_url: "https://marinho.replymesh.cloud",
        remote_data: {}
      },
      ensure_webhooks: { success: true, action: "configured", changed: true }
    )
    allow(EvolutionGoClient).to receive(:new).and_return(client)

    result = described_class.call(
      {
        name: "Nova Loja",
        slug: "nova-loja",
        responsible_name: "Dono Loja",
        responsible_email: "dono@example.com",
        responsible_phone: "21999990000",
        admin_password: "senha-forte-123"
      }
    )

    expect(result).to be_success

    company = Company.find_by!(slug: "nova-loja")
    instance = company.whatsapp_instances.find_by!(instance_name: "replymesh_nova_loja")
    settings = company.store_setting

    expect(settings.logo_url).to be_nil
    expect(settings.banner_url).to be_nil
    expect(settings.cover_url).to be_nil
    expect(settings.visual_template_id).to eq("hamburgueria-premium")
    expect(company.app_banners).to be_empty
    expect(instance.instance_token).to be_present
    expect(instance.provider).to eq("evolution_go")
    expect(instance.status).to eq("created")
    expect(client).to have_received(:create_instance).with("replymesh_nova_loja", token: instance.instance_token)
    expect(client).to have_received(:ensure_webhooks).with(instance, remote: hash_including(status: "created"))
  end
end
