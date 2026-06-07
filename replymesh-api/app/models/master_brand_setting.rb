class MasterBrandSetting < ApplicationRecord
  validates :platform_name, :primary_color, :secondary_color, presence: true
  validates :primary_color, :secondary_color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }

  def self.current
    first_or_create!
  end

  def as_json_safe
    attributes.slice(
      "id", "platform_name", "light_logo_url", "dark_logo_url", "favicon_url",
      "primary_color", "secondary_color", "support_email", "support_whatsapp", "updated_at"
    )
  end
end
