smtp_port = ENV.fetch("SMTP_PORT", "465").to_i

Rails.application.config.action_mailer.delivery_method = :smtp
Rails.application.config.action_mailer.smtp_settings = {
  address: ENV.fetch("SMTP_HOST", "smtp.hostinger.com"),
  port: smtp_port,
  user_name: ENV["SMTP_USERNAME"],
  password: ENV["SMTP_PASSWORD"],
  authentication: ENV.fetch("SMTP_AUTH", "login"),
  ssl: ActiveModel::Type::Boolean.new.cast(ENV.fetch("SMTP_SSL", "true")),
  enable_starttls_auto: smtp_port != 465
}
Rails.application.config.action_mailer.default_url_options = {
  host: ENV.fetch("REPLYMESH_LANDING_HOST", "replymesh.cloud"),
  protocol: Rails.env.production? ? "https" : "http"
}
