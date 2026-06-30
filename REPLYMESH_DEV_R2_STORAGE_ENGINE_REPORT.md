# REPLYMESH DEV — Cloudflare R2 Storage Engine

Data: 2026-06-30
Branch: dev

## Objetivo

Implementar a base do motor de armazenamento em Cloudflare R2 para imagens da Replymesh, mantendo compatibilidade com URLs antigas e sem migrar automaticamente arquivos existentes.

## Implementado

### Backend Rails

- Criado `CloudStorageService` para upload, substituição, exclusão segura, geração de URL pública e fallback para URL antiga.
- Criado concern `CloudStorageBacked` para limpar imagens antigas do R2 quando houver substituição ou remoção do registro.
- Criado endpoint autenticado da loja:
  - `POST /api/v1/store/media`
  - `DELETE /api/v1/store/media`
- Adicionadas colunas `*_storage_key` para imagens de:
  - configurações da loja;
  - produtos;
  - categorias;
  - banners;
  - cupons;
  - roleta;
  - usuários/avatar.
- Serializers e controllers passaram a retornar imagem via R2 quando houver `storage_key`, com fallback para URL antiga.
- Mantida compatibilidade com campos legados como `logo_url`, `banner_url`, `image_url`, `cover_url` e semelhantes.
- Uploads são isolados por empresa no padrão:
  - `companies/:company_id/logo/`
  - `companies/:company_id/banner/`
  - `companies/:company_id/products/`
  - `companies/:company_id/categories/`
  - `companies/:company_id/gallery/`
  - `companies/:company_id/avatars/`
  - `companies/:company_id/promotions/`
  - `companies/:company_id/coupons/`

### Segurança e validação

- Aceita somente PNG, JPG, JPEG e WEBP.
- Limite de 10 MB por arquivo.
- Bloqueio de SVG, HTML, JS, XML e extensões perigosas.
- Nome original do arquivo não é usado no armazenamento.
- Nome final usa UUID.
- Exclusão protege isolamento multiempresa: só remove chave dentro de `companies/:company_id/`.
- As credenciais do R2 são lidas apenas por variáveis de ambiente.
- Nenhuma credencial foi gravada no código, relatório ou commit.

### Processamento de imagem

- Imagens são convertidas para WEBP.
- Qualidade configurada em 82.
- Tamanhos máximos por tipo:
  - logo: 512px;
  - banner/capa/hero: 1920x1080;
  - produto: 800px;
  - categoria: 600px;
  - avatar: 400px.

### Frontend da loja

- Criado `CloudImageUploader`.
- Criado serviço `store-template/src/services/media.js`.
- Atualizadas telas:
  - Configurações da loja;
  - Produtos;
  - Banners do aplicativo.
- O lojista pode:
  - enviar imagem para R2;
  - manter/usar URL externa manual;
  - remover imagem;
  - visualizar preview antes de salvar.

## Variáveis de ambiente esperadas

Não foram gravados valores reais no repositório.

- `CLOUDFLARE_R2_BUCKET` ou `R2_BUCKET`
- `CLOUDFLARE_R2_ENDPOINT` ou `R2_ENDPOINT`
- `CLOUDFLARE_R2_ACCESS_KEY_ID` ou `R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY` ou `R2_SECRET_ACCESS_KEY`
- `REPLYMESH_CDN_BASE_URL` ou `CLOUDFLARE_R2_CDN_URL` ou `CLOUDFLARE_R2_PUBLIC_BASE_URL` quando houver URL pública/CDN configurada

## Validações executadas

- `ruby -c` nos arquivos Ruby alterados: OK.
- `npm run build` em `store-template`: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `git diff --check`: OK, apenas avisos de line ending do Windows.
- Auditoria de segredos buscando token, access key, secret key e endpoint real: OK, sem ocorrências.
- Migrations aplicadas no ambiente local/dev Docker: OK.
- API local voltou a responder após aplicar migrations e reiniciar o container Rails.

## Pendências / observações

- `bundle exec rspec` foi executado e a suíte geral não passou: 200 exemplos, 73 falhas. As falhas observadas são majoritariamente de ambiente/test setup já existente, como HostAuthorization retornando 403, dados duplicados de teste, expectativa antiga de domínio `.replymesh.cloud` versus `.localhost` e alguns testes de IA já divergentes. Não foi identificado erro específico do R2 nessa execução.
- Upload real para Cloudflare R2 não foi testado com credenciais nesta sessão para evitar gravar ou expor chaves locais.
- Antes de ativar em produção, configurar variáveis de ambiente no servidor, rodar migrations e testar upload com uma empresa de QA.
- Como credenciais foram compartilhadas no chat, recomenda-se rotacionar o token/chaves no Cloudflare antes de uso definitivo em produção.

## Arquivos principais alterados

- `replymesh-api/app/services/cloud_storage_service.rb`
- `replymesh-api/app/models/concerns/cloud_storage_backed.rb`
- `replymesh-api/app/controllers/api/v1/store/media_controller.rb`
- `replymesh-api/db/migrate/20260630033000_add_cloud_storage_keys_to_media_fields.rb`
- `store-template/src/components/media/CloudImageUploader.jsx`
- `store-template/src/services/media.js`
- `store-template/src/pages/admin/Settings.jsx`
- `store-template/src/pages/admin/Products.jsx`
- `store-template/src/pages/admin/AppBanners.jsx`

