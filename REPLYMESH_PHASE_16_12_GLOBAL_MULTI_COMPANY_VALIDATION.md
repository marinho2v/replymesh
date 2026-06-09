# REPLYMESH FASE 16.12 — Validação Global Multiempresa Automática

Data: 2026-06-09
Ambiente: Produção VPS
Escopo: criar e validar uma nova empresa de homologação multiempresa sem alterar Lanche, Demo, instância Lanche, webhooks reais existentes ou Mercado Pago.

## Resultado geral

Status: OK com correção aplicada na configuração Rails/Evolution.

Empresa criada:
- Nome: Teste Multiempresa
- Slug: testemultiempresa
- Domínio: https://testemultiempresa.replymesh.cloud
- Company ID: 7
- Status: active
- Plano/status: active
- Usuário admin criado: admin@testemultiempresa.replymesh.cloud
- Senha salva somente na VPS: /root/replymesh-secrets/phase-16-12-testemultiempresa-admin.txt

## Correções aplicadas

1. URL de impersonação do Master
- Problema: `Entrar como empresa` ainda gerava URL local `http://127.0.0.1:5174/...`.
- Correção: `login_url` agora usa o subdomínio real da empresa, com fallback para `REPLYMESH_PLATFORM_DOMAIN` ou `replymesh.cloud`.
- Arquivo: replymesh-api/app/controllers/api/v1/master/companies_controller.rb

2. Defaults de identidade no onboarding
- Configurado para novas empresas:
  - logo_url: /logo.png
  - banner_url: /capa.jpeg
  - cover_url: /capa.jpeg
  - visual_template_id: hamburgueria-classic
  - banner padrão em app_banners
- Arquivo: replymesh-api/app/services/company_onboarding_service.rb

3. Chave global Evolution usada pela Rails API
- Problema encontrado: Rails API retornava 401 ao listar/criar instâncias Evolution.
- Causa: `EVOLUTION_GO_API_KEY` da Rails API não correspondia ao `GLOBAL_API_KEY` do container Evolution.
- Correção aplicada: `/etc/replymesh-rails-api.env` atualizado com backup.
- Backup: /root/replymesh-backups/pre-phase-16-12-evolution-env-20260609-015732/replymesh-rails-api.env.bak
- Nenhuma chave foi impressa no chat ou relatório.

## Deploy/recreate executado

- Build criado: replymesh-api:v0.15.24-rc7
- Container recriado: replymesh-rails-api
- Não foram executadas migrations.
- Não foram executadas seeds.
- Não houve alteração em Evolution Go, Traefik, Dokploy, Store, Master, Mercado Pago ou banco estrutural.
- Evolution existente continuou online.

## WhatsApp automático

Instância criada para a empresa nova:
- Nome: replymesh_testemultiempresa
- Provider: evolution_go
- Status Rails: created
- Status remoto: created
- Token automático: OK, presente e salvo no Rails
- Company vinculado: company_id 7
- Webhook automático: OK
- Evento configurado: MESSAGE
- QR Code: OK, gerado em base64

Evolution remota após validação:
- replymesh_demohamburgueria_qr
- replymesh_testemultiempresa
- Lanche

Nenhuma instância existente foi removida, desconectada ou recriada.

## Validações HTTP

API pública:
- GET https://api.replymesh.cloud/api/v1/public/testemultiempresa/store -> 200
- GET https://api.replymesh.cloud/api/v1/public/testemultiempresa/menu -> 200

Store:
- GET https://testemultiempresa.replymesh.cloud -> 200
- GET https://testemultiempresa.replymesh.cloud/admin/login -> 200

CORS:
- Origin https://testemultiempresa.replymesh.cloud -> Access-Control-Allow-Origin OK
- Methods/Headers liberados para endpoints autenticados.

Login loja:
- POST /api/v1/auth/login -> 200
- GET /api/v1/auth/me -> 200
- GET /api/v1/store/whatsapp/instances -> 200
- GET /api/v1/store/whatsapp/templates -> 200
- GET /api/v1/store/orders?limit=1 -> 200
- GET /api/v1/store/motoboys?active=true -> 200

Marketing/recuperador:
- GET /api/v1/store/marketing/customers -> 200
- GET /api/v1/store/marketing/campaigns -> 200
- GET /api/v1/store/sales_recovery/customers -> 200
- GET /api/v1/store/whatsapp/logs -> 200

## Isolamento multiempresa

Demo Hamburgueria:
- company_id: 2
- whatsapp_instances: 1
- whatsapp_templates: 8
- orders: 10
- customers: 3
- motoboys: 2

Teste Multiempresa:
- company_id: 7
- whatsapp_instances: 1
- whatsapp_templates: 8
- orders: 0
- customers: 0
- motoboys: 0
- payment_methods: 4
- delivery_zones: 1
- business_hours: 7
- app_banners: 1
- store_settings: OK

Checks globais:
- WhatsappTemplate sem company_id: 0
- WhatsappLog sem company_id: 0
- Order sem company_id: 0
- Customer sem company_id: 0
- Duplicate instance_name: nenhum

## Hardcodes encontrados

Encontrados e avaliados:

1. replymesh-api/app/services/checkout_service.rb
- Conteúdo: `demohamburgueria empresa-teste`
- Impacto: não bloqueante, método só retorna true em Rails.env.development?. Não afeta produção.

2. store-template/src/services/replymeshApi.js
- Conteúdo: fallback `empresa-teste` quando não há slug/env.
- Impacto: não bloqueante no domínio real, porque o slug é resolvido pelo host/env. Pode ser limpo depois para reduzir confusão.

3. Arquivos `.bak` em produção
- Contêm referências antigas de localhost/empresa-teste.
- Impacto: não carregados pela aplicação. Podem ser arquivados/removidos em fase de limpeza controlada.

Hardcode crítico corrigido:
- `companies_controller.rb` não usa mais `127.0.0.1:5174` para impersonação.

## Pendências

1. O cliente ainda precisa conectar o WhatsApp real via QR Code da instância `replymesh_testemultiempresa`.
2. A empresa nova ainda não tem produtos/categorias reais; para criar pedido real, cadastrar produtos no painel ou importar cardápio.
3. Marketing e recuperador foram validados por endpoints e isolamento, mas envio real não foi disparado por escopo da fase.
4. Limpeza futura recomendada: remover backups `.bak` antigos do source em produção e revisar fallback `empresa-teste` no frontend.

## Arquivos alterados localmente

- replymesh-api/app/controllers/api/v1/master/companies_controller.rb
- replymesh-api/app/services/company_onboarding_service.rb
- replymesh-api/spec/services/company_onboarding_service_spec.rb

Além disso, continuam presentes alterações anteriores das fases 16.10/16.11 ainda não commitadas.

## Sistema pronto para teste real?

Sim, para o teste real da Fase 16.12:
- empresa nova criada;
- loja acessível;
- admin da loja autenticando;
- instância Evolution criada automaticamente;
- token salvo;
- webhook automático configurado para MESSAGE;
- QR Code disponível;
- endpoints principais isolados por empresa.

Não foi feito commit.
