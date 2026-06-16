require "rails_helper"

RSpec.describe "Evolution location webhook", type: :request do
  around do |example|
    old_secret = ENV["EVOLUTION_LOCATION_WEBHOOK_SECRET"]
    ENV["EVOLUTION_LOCATION_WEBHOOK_SECRET"] = "location-secret"
    example.run
  ensure
    ENV["EVOLUTION_LOCATION_WEBHOOK_SECRET"] = old_secret
  end

  it "links WhatsApp location to an open order for any linked company" do
    company = create_company(slug: "joaopizza")
    customer = create_customer(company, phone: "21959099803")
    order = create_order(company: company, customer: customer, status: "accepted")
    WhatsappInstance.create!(
      company: company,
      instance_name: "replymesh_joaopizza",
      instance_token: "instance-token",
      provider: "evolution_go",
      status: "connected"
    )

    post "/api/v1/webhooks/evolution/location?token=location-secret",
      params: {
        instanceName: "replymesh_joaopizza",
        phone: "5521959099803",
        message: {
          locationMessage: {
            degreesLatitude: -22.935,
            degreesLongitude: -43.18,
            name: "Local do cliente"
          }
        }
      },
      as: :json

    expect(response).to have_http_status(:ok)
    expect(json["success"]).to be(true)
    expect(json["matched"]).to be(true)

    order.reload
    expect(order.delivery_latitude.to_f).to eq(-22.935)
    expect(order.delivery_longitude.to_f).to eq(-43.18)
    expect(order.google_maps_url).to include("-22.935,-43.18")
    expect(order.waze_url).to include("-22.935,-43.18")
  end

  it "accepts the live location payload emitted by Evolution Go" do
    company = create_company(slug: "live-location")
    customer = create_customer(company, phone: "21959099803")
    order = create_order(company: company, customer: customer, status: "accepted")
    instance = WhatsappInstance.create!(
      company: company,
      instance_name: "replymesh_live_location",
      instance_uuid: SecureRandom.uuid,
      instance_token: "instance-token",
      provider: "evolution_go",
      status: "connected"
    )

    post "/api/v1/webhooks/evolution/location?token=#{CGI.escape(EvolutionWebhookToken.generate(instance))}",
      params: {
        instanceId: instance.instance_uuid,
        instanceName: instance.instance_name,
        data: {
          Info: {
            Sender: "5521959099803@s.whatsapp.net",
            Chat: "5521959099803@s.whatsapp.net",
            IsFromMe: false
          },
          Message: {
            liveLocationMessage: {
              degreesLatitude: -22.7785454,
              degreesLongitude: -42.9447479,
              caption: "Localizacao atual"
            }
          }
        }
      },
      as: :json

    expect(response).to have_http_status(:ok)
    expect(json).to include("success" => true, "matched" => true, "order_number" => order.order_number)

    order.reload
    expect(order.delivery_latitude.to_f).to eq(-22.7785454)
    expect(order.delivery_longitude.to_f).to eq(-42.9447479)
    expect(order.delivery_location_source).to eq("whatsapp")
    expect(order.delivery_location_received_at).to be_present
  end
end
