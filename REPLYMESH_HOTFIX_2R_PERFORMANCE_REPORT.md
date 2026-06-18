# REPLYMESH HOTFIX 2R PERFORMANCE REPORT

Data: 2026-06-18

## Objetivo

Restaurar e acelerar o carregamento da Store publica do Lanche do 2R sem alterar banco, Evolution, Mercado Pago, migrations, seeds ou API de negocio.

## Causa encontrada

- `store-template/public/logo.png` estava com aproximadamente 5,7 MB e era servido como `/logo.png` no login/home.
- O container `replymesh-store` nao aplicava cache longo para assets versionados.
- O container `replymesh-store` nao aplicava gzip para JavaScript/CSS.
- A Store fazia chamadas publicas repetidas em intervalos curtos para os mesmos endpoints.
- O endpoint publico `/api/v1/public/lanchedo2r/store` ainda retorna payload grande (~548 KB) por incluir `cover_url` e `banner_url` em base64 duplicados em `store` e `store_settings`. Este ponto ficou registrado como melhoria futura porque exige ajuste de payload/serializacao.

## Alteracoes realizadas

### Codigo

- `store-template/src/services/publicApi.js`
  - Adicionado cache/dedupe em memoria por 30 segundos para chamadas publicas GET.
- `store-template/src/templates/hamburgueria-premium/components/PremiumProductCard.jsx`
  - Imagens de produtos agora usam `loading="lazy"` e `decoding="async"`.
- `store-template/src/components/menu/MenuSection.jsx`
  - Imagens de produtos agora usam `loading="lazy"` e `decoding="async"`.
- `store-template/src/pages/public/ProductDetails.jsx`
  - Imagem principal agora usa carregamento assincorno/lazy.
- `store-template/public/logo.png`
  - Otimizada de ~5,7 MB para ~184 KB.

### Producao

- Publicado novo build da Store em `/opt/replymesh/store`.
- Ajustado Nginx da Store para:
  - gzip em JS/CSS/JSON/SVG/XML;
  - cache longo para `/assets/*`;
  - cache longo para `/logo.png`;
  - `index.html` sem cache agressivo para preservar atualizacoes.

## Backups VPS

- Store: `/opt/replymesh/backups/store-performance-fix-20260618-014444`
- Nginx Store: `/opt/replymesh/backups/store-nginx-default-performance-fix-20260618-014444.conf`
- Nginx Store ajuste logo: `/opt/replymesh/backups/store-nginx-default-logo-cache-20260618-014551.conf`

## Validacoes

### Build

- `npm run build` em `store-template`: PASSOU.

### Headers

- `https://lanchesdo2r.com.br/logo.png`
  - `Content-Length: 184684`
  - `Cache-Control: public, max-age=31536000, immutable`
- `https://lanchesdo2r.com.br/assets/index-build-20260617-status-hotfix-QitaFGcT.js`
  - `Cache-Control: public, max-age=31536000, immutable`
  - `Content-Encoding: gzip` com `Accept-Encoding: gzip`

### Tempos via curl apos hotfix

- `https://lanchesdo2r.com.br`: 200, TTFB ~0,41s
- `https://lanchedo2r.replymesh.cloud`: 200, TTFB ~0,40s, total ~0,52s
- `https://lanchesdo2r.com.br/login`: 200, total ~0,40s
- `https://lanchesdo2r.com.br/admin/dashboard`: 200, total ~0,40s
- `https://api.replymesh.cloud/up`: 200
- `https://api.replymesh.cloud/api/v1/public/lanchedo2r/menu`: 200, total ~0,69s
- `https://api.replymesh.cloud/api/v1/public/lanchedo2r/store`: 200, total ~1,04s

### Navegador Headless

- `https://lanchesdo2r.com.br/`: abriu loja do Lanche do 2R sem erro JS e sem spinner preso.
- `https://lanchesdo2r.com.br/login`: abriu login admin.
- `https://lanchesdo2r.com.br/admin/dashboard` sem sessao: redirecionou para login, sem loop.
- `https://lanchedo2r.replymesh.cloud/`: abriu loja do Lanche do 2R.

Metrica visual:

- Primeira abertura publica: conteudo visivel em ~3,37s.
- Segunda abertura publica com cache: conteudo visivel em ~0,46s.

## Nao alterado

- Banco de dados.
- Evolution.
- Mercado Pago.
- Rails API.
- Migrations/seeds/reset/drop.

## Pendencia futura recomendada

Reduzir payload de `/api/v1/public/:slug/store` removendo base64 duplicado de `cover_url`/`banner_url` ou migrando essas imagens para arquivo estatico/Active Storage/CDN. Isso deve ser feito como fase separada porque altera serializacao/API publica.

## Status

STORE 2R OTIMIZADA E VALIDADA.
