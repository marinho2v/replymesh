# REPLYMESH - Fase 15.19 IA da Loja com RAG

Data: 06/06/2026
Status: concluida localmente em modo seguro

## Objetivo

Preparar uma IA por loja capaz de responder usando somente dados reais da
empresa atual, sem ativar WhatsApp automatico.

## Backend

Criados:

- `StoreAiSetting`
- `StoreAiConversation`
- `StoreAiMessage`
- `AiUsageLog`
- `StoreKnowledgeService`
- `StoreRagService`
- `StoreAiService`
- `Api::V1::Store::StoreAiController`

Migration:

- `20260606130000_create_store_ai_rag_tables.rb`

Endpoints:

- `GET /api/v1/store/store_ai/settings`
- `PATCH /api/v1/store/store_ai/settings`
- `POST /api/v1/store/store_ai/simulate`
- `GET /api/v1/store/store_ai/usage`

## Fontes do RAG

- produtos ativos;
- categorias ativas;
- cupons vigentes;
- horarios;
- configuracoes e status da loja;
- ultimo pedido do telefone informado.

Nenhuma consulta atravessa o `company_id`.

## Interface

Adicionada secao `Inteligencia Artificial` em:

`/loja/:slug/admin/settings`

Disponivel:

- configuracao da IA;
- permissoes por assunto;
- indicadores de mensagens, tokens e custo;
- simulacao local;
- telefone opcional para consulta de pedido;
- visualizacao dos chunks recuperados;
- tempo e tokens estimados.

## Validacoes

Testes na Demo Hamburgueria:

- `Tem Combo Casal X-tudo?`: produto e preco retornados;
- `Qual horario da loja?`: horarios retornados;
- `Tem cupom?`: cupons ativos priorizados;
- `Como esta meu pedido?`: ultimo pedido encontrado pelo telefone;
- `receita de bolo`: bloqueada;
- `futebol`: bloqueado;
- `politica`: bloqueada.

Tambem validado:

- login da Demo;
- endpoint de configuracao;
- endpoint de simulacao;
- secao visual no navegador;
- chunks exibidos no frontend;
- console sem erro;
- isolamento entre Demo Hamburgueria e outra empresa;
- build do `store-template`.

## Preparacao para WhatsApp

As conversas armazenam:

- empresa;
- cliente opcional;
- telefone;
- canal;
- contexto;
- ultimas mensagens.

O canal WhatsApp esta apenas preparado no modelo. Nenhuma mensagem e
interceptada ou enviada pela Evolution nesta fase.

## Seguranca

- IA desligada por padrao.
- API key nao existe na configuracao da loja.
- Provider usa somente credencial global do backend.
- Pedido exige telefone e permanece filtrado pela empresa.
- Nenhum token ou chave e retornado ao frontend.

## Pendencias Futuras

- definir planos autorizados para ativacao;
- integrar webhook Evolution somente em fase confirmada;
- ignorar mensagens proprias, grupos e localizacao;
- handoff para atendente;
- custo por provider/modelo configuravel;
- testes automatizados de request e service.
