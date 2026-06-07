# Fase 15.13 - Auditoria Carina IA Premium

## Objetivo

Transformar a Carina em uma assistente de suporte humana e contextual, capaz de
resolver a maior parte das duvidas operacionais da plataforma sem inventar
funcionalidades.

## Implementacao

- `CarinaAssistantService` ganhou contexto premium, memoria e metricas.
- `ReplymeshKnowledgeService` ganhou busca por sinonimos, intencoes e ranking.
- A base canonica foi criada em
  `replymesh-api/docs/REPLYMESH_AI_KNOWLEDGE_BASE.md`.
- `ai_assistant_logs` ganhou `tokens_used` e `response_time_ms`.

## Contexto seguro

Enviado ao provider:

- Nome e slug da empresa.
- Plano e status.
- Dominio primario.
- Pagina atual.
- Modulos ativos.
- WhatsApp conectado.
- Mercado Pago e Pix.
- Quantidade de produtos e pedidos.
- Caixa, tickets, templates e status da loja.

Nao enviado:

- Access Token Mercado Pago.
- API key Claude.
- Token Evolution.
- Token da instancia WhatsApp.
- Senhas.

## Memoria

Os cinco ultimos logs da mesma empresa e usuario sao convertidos em dez
mensagens, cinco do usuario e cinco da Carina. Nenhuma conversa de outra
empresa entra no contexto.

## Base de conhecimento

- 910 linhas.
- 34 secoes principais.
- 5.764 palavras.
- Caminhos reais do painel.
- Regras reais do backend.
- Erros comuns e solucoes.
- Perguntas e respostas ideais.
- Glossario semantico.
- Historico de versoes.

## Testes conversacionais

- `Boa noite` respondeu naturalmente e chamou o responsavel pelo nome.
- `Como criar produto?` informou `Cardapio > Produtos`.
- `Como adiciono imagem?` entendeu a continuacao sobre produto.
- Mercado Pago explicou provider, token protegido e teste de cobranca.
- Cupom explicou codigo, desconto, validade e teste.
- WhatsApp explicou status, QR e Aparelhos conectados.
- Motoboy explicou cadastro, atribuicao e portal.

## Logs

Os logs reais confirmaram:

- Provider Claude.
- Modelo `claude-haiku-4-5-20251001`.
- Tokens usados.
- Tempo de resposta em milissegundos.
- Empresa e usuario.
- Nenhum segredo encontrado.

## Limites

- A busca semantica atual e local, baseada em sinonimos, intencoes e ranking.
- Nao usa embeddings externos.
- A Carina nao executa acoes.
- VPS, producao e Fase 16 nao foram iniciadas.
