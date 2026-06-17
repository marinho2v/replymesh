# Replymesh - Production Stabilization 2R Final Report

Data: 2026-06-17

## Objetivo

Estabilizar a producao real do Lanche do 2R antes da abertura do cliente, sem mexer em Evolution, Mercado Pago, banco estrutural, migrations, seeds, reset/drop ou dados comerciais.

## Backup e inventario

Backup/auditoria criado na VPS:

`/opt/replymesh/backups/production-stabilization-audit-20260617-002706`

Estado identificado:

- API container: `replymesh-rails-api`
- API image ativa: `replymesh-api:master-users-settings-hotfix-20260616`
- Store container: `replymesh-store`
- Store image: `nginx:alpine`
- Master container: `replymesh-master`
- Master image: `nginx:alpine`
- VPS source: `/opt/replymesh/source`
- Store publicada: `/opt/replymesh/store`
- Master publicado: `/opt/replymesh/master`

Observacao importante: o worktree local e o source da VPS continuam com drift/arquivos sujos de fases anteriores. Por isso a Store foi publicada a partir de uma copia temporaria limpa do source real da VPS, nao a partir do build local sujo.

Worktree temporario usado:

`W:\tmp\replymesh-prod-stabilization-store\store-template`

## Correcao aplicada

### /admin/settings sem IA

Problema:

- `/admin/settings` ainda carregava chamadas/componentes de IA.
- Quando `/api/v1/store/store_ai/settings` retornava 403, a pagina de Configuracoes podia mostrar modal de plano/feature.

Acao:

- Publicado build da Store com `Settings.jsx` limpo.
- `StoreAiSettings.jsx` permanece separado para `/admin/ai`.
- `/admin/settings` nao deve mais chamar `store_ai/settings`.

Evidencia na VPS:

- Chunk publicado: `Settings-build-20260617-status-hotfix-DENvSPDl.js`
- Chunk separado de IA: `StoreAiSettings-build-20260617-status-hotfix-CATVzz5V.js`
- Busca no chunk de Settings por `store_ai/settings`, `StoreAiSection`, `railsGetStoreAiSettings` e `railsUpdateStoreAiSettings`: sem ocorrencias.

### Dominio custom 2R

Problema:

- `https://lanchesdo2r.com.br/login` precisava funcionar igual ao subdominio `https://lanchedo2r.replymesh.cloud/login`.

Estado validado:

- API publica resolve `lanchesdo2r.com.br` para a loja `Lanche do 2R`.
- API publica resolve `www.lanchesdo2r.com.br` para a loja `Lanche do 2R`.
- API publica resolve `lanchedo2r` para a loja `Lanche do 2R`.

## Validacoes executadas

### API

- `https://api.replymesh.cloud/up` -> 200
- `https://api.replymesh.cloud/api/v1/public/lanchesdo2r.com.br/store` -> 200
- `https://api.replymesh.cloud/api/v1/public/www.lanchesdo2r.com.br/store` -> 200
- `https://api.replymesh.cloud/api/v1/public/lanchedo2r/store` -> 200

### Store 2R

- `https://lanchesdo2r.com.br/` -> 200
- `https://lanchesdo2r.com.br/login` -> 200
- `https://lanchesdo2r.com.br/admin/login` -> 200
- `https://lanchesdo2r.com.br/admin/settings` -> 200
- `https://lanchesdo2r.com.br/promocoes` -> 200
- `https://lanchedo2r.replymesh.cloud/` -> 200
- `https://lanchedo2r.replymesh.cloud/admin/settings` -> 200

### Master

- `https://app.replymesh.cloud/dashboard` -> 200
- `https://app.replymesh.cloud/configuracoes/geral` -> 200
- Tela publicada de configuracoes do Master usa `/master/companies/:id/store_settings`.

## Builds

Executado em copia temporaria limpa:

- `npm ci` em `store-template`: OK
- `npm run build` em `store-template`: OK

Observacao:

- `npm audit` reportou vulnerabilidades ja existentes no pacote, mas nenhuma correcao automatica foi aplicada para evitar mudanca fora do escopo.

## Publicacao

Store publicada via pacote `.tgz` para evitar mistura de assets:

- backup anterior da Store: `/opt/replymesh/store.previous-prod-stabilization`
- destino final: `/opt/replymesh/store`
- `index.html` atual aponta para:
  - `index-build-20260617-status-hotfix-Cg1BFOoJ.js`
  - `ui-build-20260617-status-hotfix-DZdAWy52.js`
  - `react-build-20260617-status-hotfix-BSKsflDV.js`

## Drift / pendencias

O worktree local ainda contem muitas alteracoes de fases anteriores e nao deve ser commitado em massa.

Arquivos/areas sujas observadas incluem, entre outras:

- alteracoes antigas de Supabase cleanup
- relatorios de varias fases
- arquivos de roleta/pizzaria
- motoboy financeiro
- order status
- hooks/services removidos
- scripts temporarios

Por seguranca, nenhum commit foi feito nesta etapa.

## Pendencias para concluir 100%

1. Validacao visual autenticada de `/admin/settings` no navegador, com usuario real do 2R, confirmando ausencia do modal PRO e salvamento de configuracoes.
2. Validacao visual autenticada do login pelo dominio custom:
   - admin
   - motoboy
   - cozinha, se aplicavel
3. Validacao visual do fluxo de pedidos no navegador:
   - `pending -> accepted -> preparing -> ready -> out_for_delivery -> completed`
   - sem 422
   - botoes corretos
   - console sem erro
4. Consolidar em Git somente depois dessas validacoes reais.

## Status final

Parcialmente estabilizado:

- Store publica e dominio custom respondem 200.
- API responde 200.
- Master responde 200.
- `/admin/settings` foi publicado sem dependencia direta de IA.
- Dominio custom resolve pela API para a loja correta.

Ainda nao concluido:

- validacao autenticada no navegador;
- teste real do fluxo visual de pedidos;
- commits finais.

Resultado:

`PRODUCAO 2R AINDA COM PENDENCIAS`

---

## Hotfix 2026-06-17 - Fluxo delivery 2R e login em dominio custom

### Objetivo

Corrigir dois pontos observados em producao no Lanche do 2R:

- O painel continuava exibindo as etapas `Em preparo` e `Pronto` mesmo com os templates/etapas desativados.
- O login via dominio custom `https://lanchesdo2r.com.br/login` retornava erro de acesso ativo para usuario da loja.

### Arquivos alterados

- `replymesh-api/app/services/order_status_service.rb`
- `store-template/src/utils/orderStatus.jsx`
- `store-template/src/utils/companyDomain.js`

### Backup

Backup criado na VPS antes da publicacao:

- `/opt/replymesh/backups/hotfix-2r-flow-custom-login-20260617-005447`

### Publicacao

API:

- Imagem criada: `replymesh-api:2r-flow-custom-login-20260617`
- Container recriado: `replymesh-rails-api`
- Nenhuma migration executada.
- Nenhum seed/reset/drop executado.
- Evolution e Mercado Pago nao foram alterados.

Store:

- Build publicado em `/opt/replymesh/store`
- Assets publicados com sufixo `20260617-status-hotfix`
- `index.html` atualizado para o novo build.

### Validacoes executadas

Health/API:

- `https://api.replymesh.cloud/up` -> 200

Store/domínios:

- `https://lanchesdo2r.com.br/login` -> 200
- `https://lanchesdo2r.com.br/admin/orders` -> 200
- `https://lanchedo2r.replymesh.cloud/admin/orders` -> 200

Bundle:

- `orderStatus-build-20260617-status-hotfix-JZGI4EbI.js`
- Flags confirmadas no bundle:
  - `preparing: false`
  - `ready: false`

Fluxo do pedido:

- Empresa: `lanchedo2r`
- Pedido analisado: `#512`
- Status atual do pedido no momento da validacao: `preparing`
- Sequencia ativa calculada pelo backend:
  - `pending > accepted > out_for_delivery > completed`
- Proxima etapa calculada para o pedido `#512`:
  - `out_for_delivery`

Templates/etapas relevantes no banco:

- `pedido_aceito`: ativo
- `pedido_em_preparo`: inativo
- `pedido_pronto`: inativo
- `saiu_para_entrega`: ativo
- `pedido_finalizado`: ativo

### Resultado do hotfix

O fluxo normal da loja 2R agora respeita as etapas habilitadas no painel de Templates WhatsApp.

Para novos pedidos, o fluxo esperado ficou:

`pending -> accepted -> out_for_delivery -> completed`

O pedido `#512` ja havia sido movido para `preparing` antes do hotfix, mas a proxima acao agora passa diretamente para `out_for_delivery`, sem exigir `Pronto`.

### Observacoes

Se o navegador ainda mostrar botao antigo, fazer reload forcado da aba ou abrir em janela anonima para carregar o bundle novo.

Nenhum commit foi feito nesta etapa, conforme combinado.

Resultado atualizado:

`PRODUCAO 2R ESTABILIZADA PARA REVALIDACAO VISUAL`

---

## Hotfix 2026-06-17 - Login pelo dominio custom lanchesdo2r.com.br

### Problema

O login com usuario da empresa funcionava em:

- `https://lanchedo2r.replymesh.cloud/login`

Mas falhava em:

- `https://lanchesdo2r.com.br/login`

A API publica ja resolvia corretamente o dominio custom para a empresa `lanchedo2r`, mas o frontend mantinha temporariamente o identificador do host customizado (`lanchesdo2r.com.br`) como slug de autenticacao. Com isso, a validacao de sessao podia comparar o usuario contra o identificador errado.

### Arquivos alterados

- `store-template/src/contexts/CompanySlugContext.jsx`
- `store-template/src/services/storeAuthStorage.js`

### Correção aplicada

- O `CompanySlugProvider` agora atualiza o contexto para o slug canonico retornado pela API publica.
- Em dominio custom, a sessao passa a usar `lanchedo2r` como tenant de autenticacao.
- O resolvedor de sessao da Store nao prioriza dominio custom como se fosse slug quando ja existe slug canonico salvo.

### Backup

Backup criado antes da publicacao:

- `/opt/replymesh/backups/hotfix-custom-domain-login-20260617-123837`

### Build e publicacao

- `npm run build` em `store-template`: OK
- Store publicada novamente em `/opt/replymesh/store`
- API nao foi alterada nesta etapa.
- Evolution e Mercado Pago nao foram alterados.
- Nenhum seed, migration, reset ou drop executado.

Assets publicados:

- `Login-build-20260617-status-hotfix-Bxm7SXyY.js`
- `index-build-20260617-status-hotfix-BTUWjR8l.js`

### Validacoes

HTTP:

- `https://api.replymesh.cloud/up` -> 200
- `https://lanchesdo2r.com.br/login` -> 200
- `https://lanchesdo2r.com.br/` -> 200

Simulacao do fluxo de login:

- Dominio custom `lanchesdo2r.com.br` resolve para store slug `lanchedo2r`.
- Usuario informado possui membership ativo em `lanchedo2r`.
- Validacao autenticada em `/api/v1/store/features` retornou 200.

### Resultado

Login pelo dominio custom corrigido para usar o tenant canonico `lanchedo2r`.

Resultado atualizado:

`PRODUCAO 2R ESTABILIZADA PARA COMMIT`
