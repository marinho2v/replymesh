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
    domains = Company.where(status: "active")
      .pluck(:subdomain)
      .compact
      .select { |domain| domain.end_with?(".replymesh.cloud") && !reserved.include?(domain) }
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
echo "generated $(echo "$DOMAINS" | sed '/^$/d' | wc -l) store routers at $OUT"
