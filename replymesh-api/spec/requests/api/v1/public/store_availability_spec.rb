require "rails_helper"

RSpec.describe "Public store availability", type: :request do
  it "returns store_not_found for an unknown slug" do
    get "/api/v1/public/slug-inexistente/store"

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body).to include(
      "success" => false,
      "code" => "store_not_found"
    )
  end

  it "returns store_unavailable for an inactive company" do
    company = create_company(status: "inactive")

    get "/api/v1/public/#{company.slug}/store"

    expect(response).to have_http_status(:locked)
    expect(response.parsed_body).to include(
      "success" => false,
      "code" => "store_unavailable"
    )
  end
end
