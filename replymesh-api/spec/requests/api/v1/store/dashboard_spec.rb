require "rails_helper"

RSpec.describe "Store dashboard metrics", type: :request do
  let!(:company) { create_company(name: "Dashboard Brasil") }
  let!(:user) { create_user(email: "dashboard@example.com") }

  before do
    add_member(user, company)
    create_store(company)
  end

  it "uses the Sao Paulo business day and consistent completed-order revenue" do
    travel_to Time.utc(2026, 6, 18, 0, 30) do
      customer = create_customer(company)
      customer.update_columns(created_at: Time.utc(2026, 6, 17, 14))

      completed = create_order(company: company, customer: customer, status: "completed", total_cents: 10_000)
      pending = create_order(company: company, status: "pending", total_cents: 5_000)
      cancelled = create_order(company: company, status: "cancelled", total_cents: 9_000)
      previous_day = create_order(company: company, status: "completed", total_cents: 7_000)

      completed.update_columns(created_at: Time.utc(2026, 6, 17, 15))
      pending.update_columns(created_at: Time.utc(2026, 6, 18, 0))
      cancelled.update_columns(created_at: Time.utc(2026, 6, 17, 16))
      previous_day.update_columns(created_at: Time.utc(2026, 6, 17, 2, 59))

      get "/api/v1/store/dashboard",
          headers: auth_headers(user).merge("X-Company-Slug" => company.slug)

      expect(response).to have_http_status(:ok)
      expect(json).to include(
        "today_orders" => 2,
        "today_revenue_cents" => 10_000,
        "average_ticket_cents" => 10_000,
        "new_customers_today" => 1
      )
      expect(json["status_counts"]).to include(
        "completed" => 1,
        "pending" => 1,
        "cancelled" => 1
      )
      expect(json["trend_data"].last).to include(
        "date" => "2026-06-17",
        "revenue_cents" => 10_000
      )
    end
  end
end
