# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from production frontends.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

custom_domain_origin = lambda do |source, _env|
  uri = URI.parse(source.to_s)
  host = uri.host.to_s.downcase

  return false unless uri.scheme == "https"
  return true if host.match?(/\A[a-z0-9-]+\.replymesh\.cloud\z/)
  return false unless defined?(Domain)

  candidates = [host]
  candidates << host.delete_prefix("www.") if host.start_with?("www.")

  Domain.includes(:company)
        .where(domain: candidates, status: "active")
        .any? { |domain| domain.company&.status == "active" }
rescue URI::InvalidURIError
  false
end

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "https://replymesh.cloud",
            "https://app.replymesh.cloud",
            custom_domain_origin

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: %w[Authorization]
  end
end
