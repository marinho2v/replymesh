# Replymesh - Hotfix Tenant Visual Isolation and Company Logo

Data: 2026-06-15

## Resultado

Status: PASSOU

O isolamento visual por empresa foi corrigido e validado em producao sem alterar
Evolution, Mercado Pago ou a estrutura do banco.

## Causas encontradas

1. O HTML base usava favicon estatico, permitindo que um asset antigo do 2R
   aparecesse antes da identificacao da empresa.
2. Existiam fallbacks globais para `/logo.png`, inclusive no onboarding, embora
   esse caminho pudesse conter uma imagem especifica de outro cliente.
3. A informacao publica da loja era carregada em pontos diferentes da arvore,
   permitindo a renderizacao temporaria com dados neutros antigos ou estado
   anterior antes da resposta do tenant atual.
4. O Master recebia caminhos relativos como `/logo.png`. O navegador resolvia
   esse caminho em `app.replymesh.cloud`, em vez do subdominio da empresa.

## Correcao aplicada

### Store

- Favicon inicial neutro Replymesh.
- Favicon dinamico por tenant, versionado com `updated_at`.
- Prioridade: `favicon_url`, depois `logo_url`, depois favicon neutro.
- Remocao dos fallbacks globais de logo/capa pertencentes a cliente.
- Provider unico para os dados publicos da empresa.
- Estado de carregamento neutro antes de renderizar o tenant.
- Validacao de `loadedSlug` para impedir reaproveitamento visual entre empresas.
- Fallback de logo por icone neutro, sem asset do 2R.
- Textos padrao genericos no template premium.

### API

- Onboarding novo nao grava mais `/logo.png` como logo padrao.
- Serializer publico retorna favicon seguro e `updated_at`.
- Serializer Master retorna logo, banner e capa.
- Assets relativos do Master agora sao transformados em URL absoluta usando o
  dominio da propria empresa.

### Master

- Lista e detalhe exibem a logo quando existe.
- Falha de carregamento de imagem revela as iniciais.
- Empresa sem logo continua usando iniciais.
- Campos visuais existentes foram reutilizados; nenhuma migration ou upload
  novo foi criado.

## Limpeza de dado legado

Foi removido somente um placeholder legado `/logo.png` de empresa sem logo real.
O valor do `lanchedo2r` foi preservado porque o arquivo pertence ao proprio
tenant e responde corretamente no seu subdominio.

## Arquivos alterados

### Store

- `store-template/index.html`
- `store-template/public/replymesh-favicon.svg`
- `store-template/src/contexts/PublicStoreInfoContext.jsx`
- `store-template/src/hooks/usePublicStoreInfo.js`
- `store-template/src/components/layout/PublicLayout.jsx`
- `store-template/src/components/shared/BrandLogo.jsx`
- `store-template/src/hooks/useNotificationSound.js`
- `store-template/src/pages/admin/Settings.jsx`
- `store-template/src/pages/motoboy/MotoboyLayout.jsx`
- `store-template/src/pages/public/Wheel.jsx`
- `store-template/src/services/publicApi.js`
- `store-template/src/services/settings.js`
- `store-template/src/templates/hamburgueria-premium/components/PremiumHero.jsx`
- `store-template/src/utils/tenantBranding.js`

### API

- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/app/controllers/api/v1/public/stores_controller.rb`
- `replymesh-api/app/services/company_onboarding_service.rb`
- `replymesh-api/spec/services/company_onboarding_service_spec.rb`

### Master

- `replymesh-frontend/src/components/ui/CoAvatar.jsx`
- `replymesh-frontend/src/pages/empresas/EmpresaDetalhe.jsx`
- `replymesh-frontend/src/pages/empresas/EmpresasList.jsx`

## Build e validacoes locais

- Store `npm run build`: PASSOU
- Master `npm run build`: PASSOU
- Ruby syntax: PASSOU
- `git diff --check` no escopo: PASSOU
- Auditoria de segredos: PASSOU
- Busca por assets globais `/logo.png`, `/favicon.png` e `/capa.jpeg`: sem
  referencias ativas indevidas
- Busca por `localhost` e `127.0.0.1` nos builds: sem ocorrencias
- RSpec local: nao iniciou por gems nativas ausentes no Windows; nenhuma gem foi
  instalada para evitar alterar o ambiente

## Backup e deploy

- Backup completo inicial:
  `/opt/replymesh/backups/hotfix-tenant-visual-20260615-163902`
- Backup pontual do serializer:
  `/opt/replymesh/backups/hotfix-tenant-visual-master-logo-20260615-164826`
- Imagem API ativa:
  `replymesh-api:v1.0.0-tenant-visual-isolation-rc2`
- Container anterior preservado:
  `replymesh-rails-api.pre-tenant-rc2-20260615-165131`
- API `/up`: HTTP 200
- Nenhuma migration, seed, reset ou drop executado
- Nenhum commit ou tag criado

## Evidencias de producao

### Lanche do 2R

- Store: HTTP 200
- Logo: `https://lanchedo2r.replymesh.cloud/logo.png`
- Favicon: logo do proprio tenant com versao por `updated_at`
- Imagem carregada: PASSOU
- Console: sem erros
- Rota limpa: PASSOU

### Pizza Show

- Store: HTTP 200
- Logo e favicon: imagem propria da Pizza Show
- Nenhum texto ou asset 2R: PASSOU
- Console: sem erros
- Rota limpa: PASSOU

### Empresa sem logo

- Tenant: `teste-rotas-global`
- Favicon neutro Replymesh: PASSOU
- Header sem imagem de outro cliente: PASSOU
- Master usa iniciais `TR`: PASSOU
- Console: sem erros

### Master

- Pizza Show recebe logo absoluta propria.
- Lanche do 2R recebe
  `https://lanchedo2r.replymesh.cloud/logo.png`, sem buscar em
  `app.replymesh.cloud`.
- Empresa sem logo recebe `null` e usa iniciais.

### Loja inexistente

- API publica: HTTP 404
- Codigo: `store_not_found`
- Nenhuma loja vazia ou fallback de outro tenant foi criado.

## Pendencias

- `favicon_url` nao possui coluna dedicada no modelo atual. A regra segura usa
  `logo_url` como favicon e, na ausencia dela, o favicon neutro Replymesh.
- Uma coluna dedicada pode ser proposta futuramente em migration separada, mas
  nao e necessaria para este hotfix.

## Conclusao

O favicon, logo, banner, cores e estado de carregamento agora respeitam o tenant
atual. Nao foi encontrada reutilizacao visual entre as empresas testadas.
