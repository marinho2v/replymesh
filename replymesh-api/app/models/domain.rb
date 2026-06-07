class Domain < ApplicationRecord
  DOMAIN_TYPES = %w[subdomain custom_domain].freeze
  STATUSES = %w[pending active dns_error inactive].freeze
  SSL_STATUSES = %w[pending active error].freeze

  belongs_to :company

  normalizes :domain, with: ->(domain) { domain.strip.downcase }

  validates :domain, :domain_type, :status, :ssl_status, presence: true
  validates :domain, uniqueness: true
  validates :domain_type, inclusion: { in: DOMAIN_TYPES }
  validates :status, inclusion: { in: STATUSES }
  validates :ssl_status, inclusion: { in: SSL_STATUSES }
end
