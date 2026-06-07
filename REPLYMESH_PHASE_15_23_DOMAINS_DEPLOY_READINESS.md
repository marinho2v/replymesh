# Replymesh Phase 15.23 - Subdominios e Deploy Readiness

Data: 2026-06-07
Versao base: Replymesh Local Stable v0.15.22

## Escopo

Preparacao local para producao com os dominios oficiais:

- Landing: `replymesh.cloud`
- Painel Master: `app.replymesh.cloud`
- API Rails: `api.replymesh.cloud`
- Lojas: `*.replymesh.cloud`

Nenhum deploy, VPS, DNS, Evolution, Mercado Pago, WhatsApp, Motoboy ou regra de negocio foi alterado.

## Backend

### Migration criada

- `replymesh-api/db/migrate/20260607000100_add_ssl_status_to_companies.rb`

Campos/indices:

- adiciona `companies.ssl_status:string`, default `pending`, `null: false`;
- adiciona indice em `companies.ssl_status`;
- normaliza eventuais dominios antigos `.replymesh.com.br` para `.replymesh.cloud`.

### Campos de dominio em Company

Confirmados/preparados:

- `slug`
- `subdomain`
- `custom_domain`
- `domain_status`
- `custom_domain_status`
- `ssl_status`
- `primary_domain`
- `dns_verified_at`

### Validacoes

Servico central:

- `CompanyDomainService`

Regras implementadas:

- remove acentos;
- remove espacos;
- normaliza minusculas;
- remove caracteres especiais;
- gera `slug.replymesh.cloud`;
- evita duplicidade com sufixo `-2`, `-3`, etc.;
- bloqueia slugs reservados: `admin`, `api`, `app`, `www`, `mail`, `ftp`, `root`, `support`, `master`, `suporte`;
- valida formato basico de dominio proprio.

Exemplos validados:

- `Joao Pizza` -> `joaopizza.replymesh.cloud`
- `Doceria da Lu` -> `doceriadalu.replymesh.cloud`
- duplicado `Demo Hamburgueria` -> `demohamburgueria-2.replymesh.cloud`

## Empresas existentes

Empresas locais verificadas:

- `empresa-teste-fase-3-20260603222304.replymesh.cloud`
- `empresauifase336419658.replymesh.cloud`
- `fase11-teste.replymesh.cloud`
- `empresa-teste.replymesh.cloud`
- `demohamburgueria.replymesh.cloud`
- `demopizza.replymesh.cloud`

Todas com `ssl_status = pending`.

## Frontend Master

Atualizacoes:

- Nova Empresa usa sufixo fixo `.replymesh.cloud`.
- Nova Empresa bloqueia slugs reservados antes do envio.
- Criada configuracao central `replymesh-frontend/src/config/platform.js`.
- Adicionada aba visual `Configuracoes > Infraestrutura / Dominios`.

A aba mostra:

- subdominio padrao da empresa;
- Painel Master `https://app.replymesh.cloud`;
- API `https://api.replymesh.cloud`;
- dominio proprio como preparacao futura.

## Store Template

Preparacao mantida:

- resolve empresa por hostname `slug.replymesh.cloud`;
- reserva hosts de infraestrutura;
- fallback local por `/loja/:slug` continua funcionando.

## Traefik / VPS futuro

Para producao sera necessario:

1. Criar DNS wildcard `*.replymesh.cloud` apontando para a VPS.
2. Configurar `app.replymesh.cloud` para o frontend master.
3. Configurar `api.replymesh.cloud` para a API Rails.
4. Encaminhar `*.replymesh.cloud` para o store-template.
5. No store-template, o hostname sera lido e convertido em `company_slug`.
6. O backend continuara filtrando dados por `company_id` e `slug`.
7. Configurar SSL automatico para wildcard e hosts principais.

Nenhum desses passos foi executado nesta fase.

## Testes executados

- `rails db:migrate`: OK
- `rails routes`: OK
- `bundle exec rspec`: OK, 27 exemplos, 0 falhas
- `ruby -c app/models/company.rb`: OK
- `ruby -c app/services/company_domain_service.rb`: OK
- `ruby -c db/migrate/20260607000100_add_ssl_status_to_companies.rb`: OK
- Validacao seca via `rails runner`: OK
- `npm run build` em `store-template`: OK
- `npm run build` em `replymesh-frontend`: OK
- `npm run lint` em `replymesh-frontend`: OK

Validacao seca:

- `Joao Pizza` gerou `joaopizza`
- `Doceria da Lu` gerou `doceriadalu`
- `Demo Hamburgueria` duplicada gerou `demohamburgueria-2`
- `api` foi bloqueado como slug reservado

Observacao: o arquivo `REPLYMESH_PHASE_16_0_VPS_AUDIT_PLAN.md` citado como
referencia nao foi encontrado na raiz local durante esta fase. A auditoria local
existente `REPLYMESH_PHASE_16_0_LOCAL_DEPLOY_AUDIT.md` foi utilizada.

## Pendencias para VPS

- DNS wildcard `*.replymesh.cloud`
- Traefik/Nginx com roteamento por host
- SSL real
- PostgreSQL de producao
- secrets de producao
- uploads publicos
- health checks
- webhooks publicos Mercado Pago e Evolution
- backup e rollback

## Status

Fase 15.23 concluida localmente como preparacao de dominios.

O sistema local esta preparado para a Fase 16, mas a Fase 16 nao foi iniciada.
