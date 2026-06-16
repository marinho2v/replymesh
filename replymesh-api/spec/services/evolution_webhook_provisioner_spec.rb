require "rails_helper"

RSpec.describe EvolutionWebhookProvisioner do
  around do |example|
    previous_url = ENV["EVOLUTION_LOCATION_WEBHOOK_URL"]
    ENV["EVOLUTION_LOCATION_WEBHOOK_URL"] = "https://api.replymesh.cloud/api/v1/webhooks/evolution/location"
    example.run
  ensure
    ENV["EVOLUTION_LOCATION_WEBHOOK_URL"] = previous_url
  end

  let(:company) { create_company(slug: "webhook-qa") }
  let(:instance) do
    WhatsappInstance.create!(
      company: company,
      instance_name: "replymesh_webhook_qa",
      instance_token: "instance-token",
      provider: "evolution_go",
      status: "connected"
    )
  end
  let(:client) { instance_double(EvolutionGoClient) }

  it "does not reconfigure a correctly signed MESSAGE webhook" do
    signed_token = EvolutionWebhookToken.generate(instance)
    webhook_url = "https://api.replymesh.cloud/api/v1/webhooks/evolution/location?token=#{CGI.escape(signed_token)}"
    remote = { remote_data: { "webhook" => webhook_url, "events" => "MESSAGE" } }

    allow(client).to receive(:location_webhook_url).and_return(webhook_url)
    allow(client).to receive(:connect_instance)

    result = described_class.call(instance: instance, client: client, remote: remote)

    expect(result).to include(action: "unchanged", changed: false, events: ["MESSAGE"])
    expect(client).not_to have_received(:connect_instance)
  end

  it "repairs a missing or invalid webhook without creating a new instance" do
    webhook_url = "https://api.replymesh.cloud/api/v1/webhooks/evolution/location?token=signed-token"
    remote = { remote_data: { "webhook" => "http://legacy.invalid/webhook", "events" => [] } }

    allow(client).to receive(:location_webhook_url).and_return(webhook_url)
    allow(client).to receive(:connect_instance).and_return(success: true)

    result = described_class.call(instance: instance, client: client, remote: remote)

    expect(result).to include(action: "configured", changed: true, events: ["MESSAGE"])
    expect(client).to have_received(:connect_instance).with(
      "instance-token",
      webhook_url: webhook_url,
      subscribe: ["MESSAGE"]
    )
    expect(WhatsappLog.where(
      company: company,
      whatsapp_instance: instance,
      message: "Webhooks Evolution configurados automaticamente"
    )).to exist
  end

  it "skips safely when a remote instance has no local token" do
    instance.update!(instance_token: nil)

    result = described_class.call(instance: instance, client: client, remote: {})

    expect(result).to include(action: "skipped", changed: false, reason: "missing_instance_token")
  end
end
