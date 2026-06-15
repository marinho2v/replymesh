# Replymesh - Hotfix de subdominios e rotas limpas

Data: 2026-06-14

## Resultado executivo

A validacao de empresa e as rotas limpas foram corrigidas e publicadas.

Existe uma pendencia de infraestrutura para subdominios arbitrarios nunca
cadastrados: o Traefik nao possui certificado wildcard
`*.replymesh.cloud`. Nesses hosts, o navegador encontra o
`TRAEFIK DEFAULT CERT` antes de conseguir renderizar a nova pagina
"Loja nao encontrada".

## Causa

- A API publica ja retornava 404 para slug desconhecido.
- `usePublicStoreInfo` convertia qualquer falha em `store = null`, mas o
  `PublicLayout` continuava renderizando o template visual padrao.
- O bundle ainda possuia `empresa-teste` como fallback de slug.
- Empresa inexistente e empresa inativa recebiam a mesma resposta 404.
- O router catch-all do Traefik envia qualquer subdominio para a Store, mas
  somente empresas cadastradas recebem router e certificado individuais.

## Correcao aplicada

- Removido o fallback fixo `empresa-teste`.
- A Store exige slug vindo do subdominio, da rota ou de configuracao explicita.
- A consulta de `/public/:slug/store` acontece antes das consultas auxiliares.
- Slug inexistente recebe:
  - HTTP 404;
  - `code: store_not_found`;
  - tela "Loja nao encontrada".
- Empresa existente mas inativa recebe:
  - HTTP 423;
  - `code: store_unavailable`;
  - tela "Loja indisponivel".
- O `company_id` local antigo e removido antes de resolver uma nova empresa,
  evitando reaproveitamento visual de outro tenant.
- Nenhuma empresa e criada automaticamente pelo frontend.

## Arquivos alterados

- `store-template/src/services/replymeshApi.js`
- `store-template/src/services/publicApi.js`
- `store-template/src/hooks/usePublicStoreInfo.js`
- `store-template/src/components/layout/PublicLayout.jsx`
- `store-template/src/contexts/CompanySlugContext.jsx`
- `store-template/src/app/router.jsx`
- `replymesh-api/app/controllers/api/v1/public/base_controller.rb`
- `replymesh-api/spec/requests/api/v1/public/store_availability_spec.rb`

## Rotas limpas

Validado no navegador:

- `https://lanchedo2r.replymesh.cloud/` abre Lanche do 2R.
- `https://lanchedo2r.replymesh.cloud/admin/settings` abre configuracoes.
- `/loja/lanchedo2r/admin/settings` redireciona para `/admin/settings`.
- Links internos publicados usam `/admin/...`.

## Empresa QA

Empresa criada pelo onboarding normal:

- Nome: Teste Rotas Global
- Slug: `teste-rotas-global`
- Plano: PRO
- Status final: active
- StoreSetting: criado
- Dominio: criado
- Instancia WhatsApp: nao criada

A opcao `create_whatsapp_instance: false` foi usada para nao alterar a
Evolution.

Validacoes:

- API publica da QA: HTTP 200.
- Home publica da QA: HTTP 200.
- Router individual: criado automaticamente.
- Certificado individual Let's Encrypt: valido.
- Rotas da QA usam caminhos limpos.

## Estados validados

### Loja ativa

`lanchedo2r` e `teste-rotas-global` retornaram HTTP 200 e renderizaram seus
proprios dados.

### Loja inativa

A QA foi temporariamente marcada como inativa:

- API retornou HTTP 423 e `store_unavailable`.
- Navegador mostrou "Loja indisponivel".
- A QA foi restaurada para `active` ao final.

### Loja inexistente

- `lanchesdo2rr` retornou HTTP 404 e `store_not_found` na API.
- Para validar a tela com TLS valido, o slug da QA foi ocultado
  temporariamente sem apagar dados.
- O navegador mostrou "Loja nao encontrada".
- O slug original foi restaurado e a QA voltou a responder HTTP 200.

## Traefik e SSL

O catch-all ativo usa `HostRegexp` e encaminha subdominios para
`replymesh-store`.

O ACME atual possui certificados individuais, mas nao possui:

`*.replymesh.cloud`

Consequencia:

- Empresas cadastradas: certificado individual valido.
- Host inventado nunca cadastrado: `TRAEFIK DEFAULT CERT`.

Para que qualquer hostname inexistente mostre a pagina 404 sem alerta SSL, e
necessario emitir wildcard por desafio DNS-01. A VPS nao possui credencial de
provedor DNS configurada. Essa alteracao nao foi improvisada porque exige
acesso seguro ao DNS e renovacao automatica.

## Backup

Backup validado antes da publicacao:

`/opt/replymesh/backups/pre-subdomain-hotfix-20260614-232856`

Conteudo:

- Store e configuracao nginx;
- dump PostgreSQL em formato custom;
- lista `pg_restore`;
- controller anterior;
- inspect dos containers;
- inventario Traefik;
- checksums SHA256.

## Testes

- `npm run build` em `store-template`: PASSOU.
- `ruby -c` nos arquivos Ruby: PASSOU.
- `git diff --check`: PASSOU, apenas avisos LF/CRLF.
- Auditoria de segredos no diff: PASSOU.
- Bundle publicado sem fallback `empresa-teste`.
- API `/up`: HTTP 200.
- Containers Store e API: ativos, sem erro fatal recente.
- RSpec local: nao executado por gems nativas ausentes no Windows. Nenhuma
  dependencia foi instalada.

## Restricoes respeitadas

- Sem migration, seed, reset ou drop.
- Sem alteracao em Mercado Pago.
- Sem alteracao na Evolution.
- Sem commit ou tag.
- Somente Store e API foram reiniciadas.

## Status

- Logica multiempresa e telas de erro: CORRIGIDAS.
- Rotas limpas e compatibilidade legada: CORRIGIDAS.
- HTTPS de qualquer subdominio arbitrario: PENDENTE DE CERTIFICADO WILDCARD.
