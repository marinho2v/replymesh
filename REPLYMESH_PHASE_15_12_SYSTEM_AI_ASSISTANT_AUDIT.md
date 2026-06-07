# Fase 15.12 — IA Assistente do Sistema Replymesh

Data: 06/06/2026

## Escopo implementado

- Criada assistente interna do sistema Replymesh para ajudar donos, admins e atendentes a usar o painel.
- A IA nao atende clientes no WhatsApp e nao interfere em mensagens automaticas, pagamentos, pedidos ou localizacao.
- A configuracao global fica no Painel Master.
- Cada loja pode ativar/desativar a assistente e ajustar nome, avatar e mensagem inicial.
- A Demo Hamburgueria ficou ativada localmente com a assistente Carina.

## Backend

Endpoints criados:

- `GET /api/v1/master/ai/settings`
- `PATCH /api/v1/master/ai/settings`
- `POST /api/v1/master/ai/test`
- `GET /api/v1/store/ai/settings`
- `PATCH /api/v1/store/ai/settings`
- `POST /api/v1/store/ai/chat`

Tabelas criadas:

- `ai_global_settings`
- `ai_company_settings`
- `ai_assistant_logs`

Services criados:

- `ClaudeAiService`
- `ReplymeshAiKnowledgeService`
- `AiAssistantService`

Base criada:

- `replymesh-api/AI_KNOWLEDGE_BASE.md`

## Segurança

- Claude API key fica somente no backend.
- Frontend recebe apenas `api_key_masked` e `api_key_configured`.
- Chaves e tokens nao sao salvos nos logs da IA.
- Logs guardam empresa, usuario, pergunta, resumo da resposta, status, pagina, tokens estimados e erro amigavel.
- Chat filtra por `current_company`.
- IA nao responde se global estiver desativado ou se a loja estiver desativada.
- Criado limite simples diario por loja e por minuto por usuario.

## Frontend Master

Criada tela:

- `Configurações > IA`
- rota `/configuracoes/ia`

Funcoes:

- ativar/desativar global
- provider Claude
- modelo
- chave Claude mascarada
- nome/avatar/mensagem inicial
- prompt base
- limites
- teste de conexao

## Frontend Loja

Criada tela:

- `Comunicação > IA`
- rota `/loja/:slug/admin/ai`

Funcoes:

- ativar/desativar IA da loja
- nome da assistente
- avatar
- mensagem inicial
- botao flutuante
- teste de conversa

Criado botao flutuante no admin da loja para:

- Dashboard
- Pedidos
- Produtos
- Configuracoes
- WhatsApp
- Caixa
- Estoque
- Clientes
- Mesas
- Suporte
- demais telas dentro do `AdminLayout`

## Testes executados

- `rails db:migrate` OK
- `rails routes` OK para rotas de IA
- `ruby -c` nos arquivos Rails novos OK
- `npm run build` em `store-template` OK
- `npm run build` em `replymesh-frontend` OK
- `npm run lint` em `replymesh-frontend` OK
- HTTP `GET /api/v1/master/ai/settings` OK
- HTTP `GET /api/v1/store/ai/settings` OK
- HTTP `POST /api/v1/store/ai/chat` OK

## Resultado do teste local

Pergunta:

`Como cadastro um produto?`

Resposta local:

`Para cadastrar produto, acesse Cardapio > Produtos, clique em Novo Produto, informe nome, categoria, preco e salve. Produtos inativos nao aparecem no cardapio publico.`

Fonte:

- `knowledge_base`

## Pendencias

- Configurar uma Claude API key real no Painel Master para testar resposta externa.
- Testar erro de chave invalida pelo botao `Testar Claude`.
- Refinar a base de conhecimento conforme o suporte real receber perguntas.
- Criar painel futuro de metricas de uso de IA se necessario.

## Nao feito nesta fase

- Nao foi criada IA de atendimento ao cliente no WhatsApp.
- Nao foi ativado envio por WhatsApp.
- Nao foi feito deploy.
- Nao foi iniciada Fase 16.
- Nao foi alterado o 2R original.
