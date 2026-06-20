class MasterBrandSetting < ApplicationRecord
  DEFAULT_LANDING_CLIENTS = [
    {
      "name" => "Lanche do 2R",
      "type" => "Hamburgueria",
      "logo_url" => "/clients/lanche-do-2r.png",
      "site_url" => "https://lanchesdo2r.com.br"
    },
    {
      "name" => "Petisco da Paty",
      "type" => "Delivery",
      "logo_url" => "/clients/petisco-da-paty.png",
      "site_url" => ""
    },
    {
      "name" => "Pizza Show",
      "type" => "Pizzaria",
      "logo_url" => "/clients/pizza-show.png",
      "site_url" => ""
    }
  ].freeze

  validates :platform_name, :primary_color, :secondary_color, presence: true
  validates :primary_color, :secondary_color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }
  validate :landing_clients_must_be_list

  def self.current
    first_or_create!
  end

  def as_json_safe
    attributes.slice(
      "id", "platform_name", "light_logo_url", "dark_logo_url", "favicon_url",
      "primary_color", "secondary_color", "support_email", "support_whatsapp",
      "support_location", "instagram_url", "facebook_url", "youtube_url", "updated_at"
    ).merge(
      "landing_logo_url" => read_brand_attribute("landing_logo_url"),
      "landing_hero_image_url" => read_brand_attribute("landing_hero_image_url"),
      "landing_clients" => normalized_landing_clients
    )
  end

  def normalized_landing_clients
    clients = read_brand_attribute("landing_clients").presence || DEFAULT_LANDING_CLIENTS
    return DEFAULT_LANDING_CLIENTS unless clients.is_a?(Array)

    clients.filter_map do |client|
      next unless client.is_a?(Hash)

      name = client["name"].presence || client[:name].presence
      next if name.blank?

      {
        "name" => name.to_s,
        "type" => (client["type"].presence || client[:type].presence || "Cliente").to_s,
        "logo_url" => (client["logo_url"].presence || client[:logo_url].presence || "").to_s,
        "site_url" => (client["site_url"].presence || client[:site_url].presence || "").to_s
      }
    end
  end

  private

  def read_brand_attribute(name)
    has_attribute?(name) ? self[name] : nil
  end

  def landing_clients_must_be_list
    return unless has_attribute?("landing_clients")
    return if self["landing_clients"].blank? || self["landing_clients"].is_a?(Array)

    errors.add(:landing_clients, "deve ser uma lista")
  end
end
