class CompanyDomainService
  DEFAULT_DOMAIN = ENV.fetch("REPLYMESH_DEFAULT_DOMAIN", "replymesh.cloud").freeze
  MASTER_HOST = ENV.fetch("REPLYMESH_MASTER_HOST", "app.replymesh.cloud").freeze
  API_HOST = ENV.fetch("REPLYMESH_API_HOST", "api.replymesh.cloud").freeze
  LANDING_HOST = ENV.fetch("REPLYMESH_LANDING_HOST", DEFAULT_DOMAIN).freeze
  RESERVED_SLUGS = %w[admin api app www mail ftp root support master suporte].freeze
  DOMAIN_STATUSES = %w[pending verified active failed dns_error inactive].freeze
  SSL_STATUSES = %w[pending active failed error].freeze

  def self.normalize_slug(value)
    normalized = I18n.transliterate(value.to_s)
                     .downcase
                     .strip
                     .gsub(/\s+/, "")
                     .gsub(/[^a-z0-9]+/, "-")
                     .gsub(/\A-+|-+\z/, "")

    normalized.presence || "empresa"
  end

  def self.reserved_slug?(slug)
    RESERVED_SLUGS.include?(normalize_slug(slug))
  end

  def self.unique_slug(name:, requested_slug: nil)
    base = normalize_slug(requested_slug.presence || name)
    base = "#{base}-loja" if reserved_slug?(base)
    candidate = base
    suffix = 2

    while Company.exists?(slug: candidate) || Domain.exists?(domain: domain_for(candidate))
      candidate = "#{base}-#{suffix}"
      suffix += 1
    end

    candidate
  end

  def self.domain_for(slug)
    "#{slug}.#{DEFAULT_DOMAIN}"
  end

  def self.attributes_for(slug)
    domain = domain_for(slug)
    {
      slug: slug,
      subdomain: domain,
      primary_domain: domain,
      domain_status: "pending",
      ssl_status: "pending"
    }
  end

  def self.custom_domain_valid?(value)
    domain = value.to_s.strip.downcase.sub(%r{\Ahttps?://}, "").sub(%r{/.*\z}, "")
    return true if domain.blank?

    domain.match?(/\A(?=.{4,253}\z)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}\z/)
  end

  def self.official_urls
    {
      landing: "https://#{LANDING_HOST}",
      master: "https://#{MASTER_HOST}",
      api: "https://#{API_HOST}",
      stores: "*.#{DEFAULT_DOMAIN}",
      subdomain_example: "empresa.#{DEFAULT_DOMAIN}"
    }
  end
end
