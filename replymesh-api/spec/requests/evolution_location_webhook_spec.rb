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
end
