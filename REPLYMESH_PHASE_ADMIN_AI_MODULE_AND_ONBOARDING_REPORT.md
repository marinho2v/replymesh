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
