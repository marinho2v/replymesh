#!/usr/bin/env bash
set -euo pipefail

OUT="/etc/dokploy/traefik/dynamic/replymesh-store-generated.yml"
TMP="${OUT}.tmp"

DOMAINS=$(
  docker exec replymesh-rails-api bin/rails runner '
    reserved = %w[
      api.replymesh.cloud app.replymesh.cloud infra.replymesh.cloud marinho.replymesh.cloud
      create.replymesh.cloud www.replymesh.cloud replymesh.cloud
    ]
    company_domains = Company.where(status: "active").map do |company|
      raw = company.subdomain.presence || company.slug
      next if raw.blank?

      domain = raw.include?(".") ? raw : "#{raw}.replymesh.cloud"
      domain = domain.downcase
      next unless domain.match?(/\A[a-z0-9-]+\.replymesh\.cloud\z/)
      next if reserved.include?(domain)

      domain
    end

    custom_domains = if defined?(Domain)
      Domain.includes(:company)
            .where(status: "active")
            .where(domain_type: "custom_domain")
            .select { |domain| domain.company&.status == "active" }
            .flat_map do |domain|
              host = domain.domain.to_s.downcase.strip
              next [] if host.blank? || reserved.include?(host)

              variants = [host]
              variants << "www.#{host}" unless host.start_with?("www.")
              variants
            end
    else
      []
    end

    domains = (company_domains + custom_domains)
      .compact
      .uniq
      .sort
    puts domains.join("\n")
  '
)

{
  echo "http:"
  echo "  routers:"

  if [ -n "$DOMAINS" ]; then
    while IFS= read -r domain; do
      [ -z "$domain" ] && continue
      slug=$(echo "$domain" | sed 's/\.replymesh\.cloud$//' | tr -c 'a-zA-Z0-9-' '-' | tr 'A-Z' 'a-z')
      cat <<YAML
    replymesh-store-auto-${slug}-http:
      rule: Host("${domain}")
      service: replymesh-store-service
      entryPoints:
        - web
      priority: 280
      middlewares:
        - redirect-to-https
    replymesh-store-auto-${slug}-https:
      rule: Host("${domain}")
      service: replymesh-store-service
      entryPoints:
        - websecure
      priority: 280
      tls:
        certResolver: letsencrypt
YAML
    done <<< "$DOMAINS"
  fi

  cat <<'YAML'
  services:
    replymesh-store-service:
      loadBalancer:
        servers:
          - url: http://replymesh-store:80
        passHostHeader: true
YAML
} > "$TMP"

if [ ! -f "$OUT" ] || ! cmp -s "$TMP" "$OUT"; then
  cp "$TMP" "$OUT"
fi

rm -f "$TMP"

if [ -n "$DOMAINS" ]; then
  while IFS= read -r domain; do
    [ -z "$domain" ] && continue

    verify_output=$(echo Q | openssl s_client -connect "${domain}:443" -servername "$domain" 2>/dev/null || true)
    if echo "$verify_output" | grep -q "Verify return code: 0 (ok)"; then
      docker exec -e DOMAIN="$domain" replymesh-rails-api bin/rails runner '
        domain = ENV.fetch("DOMAIN").to_s.downcase
        slug = domain.delete_suffix(".replymesh.cloud")
        companies = Company.where(subdomain: [domain, slug]).or(Company.where(slug: slug))

        if defined?(Domain)
          candidates = [domain]
          candidates << domain.delete_prefix("www.") if domain.start_with?("www.")
          Domain.where(domain: candidates).find_each do |item|
            item.update_columns(status: "active", ssl_status: "active", updated_at: Time.current)
            companies = companies.or(Company.where(id: item.company_id))
          end
        end

        companies.distinct.update_all(ssl_status: "active", domain_status: "active", updated_at: Time.current)
      ' >/dev/null
    fi
  done <<< "$DOMAINS"
fi

echo "generated $(echo "$DOMAINS" | sed '/^$/d' | wc -l) store routers at $OUT"
