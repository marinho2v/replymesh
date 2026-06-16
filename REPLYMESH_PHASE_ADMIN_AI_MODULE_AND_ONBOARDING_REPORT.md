# ReplyMesh - IA fora das configuracoes + onboarding admin

Data: 2026-06-16

## Escopo executado

- Removido o bloco "Inteligencia Artificial" da pagina `/admin/settings`.
- Criada pagina propria para IA em `/admin/ai`.
- Criado alias de rota `/admin/inteligencia-artificial`.
- Criado item de menu lateral "Inteligencia Artificial" em Comunicacao.
- Adicionado bloqueio neutro quando a feature de IA nao esta habilitada.
- Adicionado onboarding inicial no Dashboard do admin com checklist por empresa em `localStorage`.

## Arquivos alterados

- `store-template/src/pages/admin/Settings.jsx`
- `store-template/src/pages/admin/StoreAiSettings.jsx`
- `store-template/src/app/router.jsx`
- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/pages/admin/Dashboard.jsx`

## Resultado por bloco

### Bloco A - IA como modulo separado

PASSOU em codigo local.

- `/admin/settings` nao importa mais os endpoints `railsGetStoreAiSettings` e `railsUpdateStoreAiSettings`.
- `/admin/settings` nao renderiza mais o componente de IA.
- `/admin/ai` renderiza a tela propria de IA.
- `/admin/inteligencia-artificial` renderiza a mesma tela propria.
- Se `store_ai` estiver liberado, a pagina carrega e salva configuracoes da IA.
- Se `store_ai` estiver bloqueado, a pagina mostra:
  - "Atendimento automatico indisponivel no momento."
  - "Entre em contato com o suporte para habilitar este recurso."
- O menu da IA nao usa o bloqueio generico de feature para evitar modal com texto comercial de plano.

### Bloco B - Onboarding / tutorial do admin

PASSOU em codigo local.

- Card "Comece por aqui!" criado no Dashboard.
- Exibe somente para perfis administrativos.
- Nao exibe para perfis operacionais fora do Dashboard admin.
- Estado salvo por empresa em:
  - `replymesh:onboarding:<company_slug>:state`
- Checklist criado:
  - Configurar sua loja -> `/admin/settings`
  - Cadastrar cardapio -> `/admin/products`
  - Configurar entregas -> `/admin/delivery-zones`
  - Conectar WhatsApp -> `/admin/whatsapp`
  - Fazer pedido teste -> `/menu`
  - Abrir caixa / testar PDV -> `/admin/pos`
- O item "Fazer pedido teste" tambem e marcado automaticamente quando houver pedidos nas estatisticas ou pedidos recentes.

### Bloco C - Feature gates

PASSOU em codigo local.

- IA usa a feature principal `store_ai`.
- Tambem reconhece aliases defensivos:
  - `ai`
  - `whatsapp_ai`
  - `artificial_intelligence`
  - `ai_assistant`
- Bloqueio de IA nao bloqueia mais `/admin/settings`.
- O evento global `replymesh:feature-unavailable` ignora `store_ai` quando o usuario esta em `/admin/ai`, deixando a pagina propria exibir o bloqueio neutro.

## Validacoes executadas

- `npm run build` em `store-template`: PASSOU.
- `git diff --check` nos arquivos tocados: PASSOU, somente avisos CRLF existentes.
- Auditoria de segredos nos arquivos tocados: PASSOU, sem correspondencias.

## Validacoes pendentes

- Nao foi feito deploy/publicacao da Store nesta etapa.
- Motivo: o worktree possui varias alteracoes antigas nao relacionadas. Publicar o `dist` agora poderia levar junto mudancas pendentes de outras fases.
- Validacao em producao/QA deve ser feita apos deploy seletivo ou consolidacao do pacote correto.

## Status

IA/ONBOARDING COM PENDENCIAS

Pendencia unica: deploy controlado da Store e validacao visual em uma empresa QA/producao.

---

## Complemento pos-publicacao

Data: 2026-06-16

### Commits publicados

- `8bce2e7136a43124c67e30629b3baf49a9b14c86` - `Replymesh Move AI Settings And Add Admin Onboarding`
- `839e028fa28685e270cdfab636da1cb3248b727c` - `Replymesh Restore Store Domain Helpers For Clean Build`

Observacao:

- O commit `839e028` foi necessario porque o build limpo na VPS falhou com `companyBasePath is not exported by src/utils/companyDomain.js`.
- A correcao foi limitada aos exports usados pela Store:
  - `companyBasePath`
  - `cleanLegacyCompanyPath`

### Deploy

- Deploy realizado somente da Store.
- Build executado a partir de worktree limpo do commit `839e028fa28685e270cdfab636da1cb3248b727c`.
- Build directory:
  - `/opt/replymesh/builds/store-ai-onboarding-20260616-144602`
- Backup antes da publicacao:
  - `/opt/replymesh/backups/store-ai-onboarding-20260616-144602/store-current.tgz`
- Container recriado:
  - `replymesh-store`
- Motivo do recreate:
  - O bind mount estava preso ao diretorio antigo apos recriacao de `/opt/replymesh/store`, deixando `/usr/share/nginx/html` vazio dentro do container.
  - Recriar somente `replymesh-store` remontou corretamente a pasta publicada.

### Validacao producao

- `https://api.replymesh.cloud/up`: 200
- `https://lanchedo2r.replymesh.cloud/`: 200
- `https://lanchedo2r.replymesh.cloud/admin/settings`: 200
- `https://lanchedo2r.replymesh.cloud/admin/ai`: 200
- `https://lanchedo2r.replymesh.cloud/admin/inteligencia-artificial`: 200
- Bundle publicado contem:
  - `StoreAiSettings`
  - `Inteligencia Artificial`
  - `Atendimento automatico indisponivel no momento.`
  - `Comece por aqui!`
- Grep no bundle publicado para `127.0.0.1` e `localhost`: sem ocorrencias.
- `replymesh-store`: ativo com imagem `nginx:alpine`.
- `replymesh-rails-api`: permaneceu ativo, sem rebuild/recreate nesta fase.
- `dokploy-traefik`: permaneceu ativo, sem alteracao.

### Validacao funcional observavel

- `/admin/settings` carrega o SPA e nao depende mais do modulo de IA.
- `/admin/ai` e `/admin/inteligencia-artificial` carregam o SPA com bundle da pagina propria.
- O bloqueio de IA fica restrito a pagina propria e usa mensagem neutra.
- O card de onboarding existe no bundle do Dashboard e usa `localStorage` por empresa.
- A restricao para nao aparecer a perfis operacionais foi implementada por checagem de role no Dashboard.

### Pendencias

- Validacao visual autenticada em navegador com usuario admin ainda depende de login manual para confirmar estado real de feature ativa/inativa e console do browser.
- Nao houve alteracao em Evolution, Mercado Pago, banco, migrations, seeds, reset ou drop.

## Status final

IA/ONBOARDING PUBLICADO
