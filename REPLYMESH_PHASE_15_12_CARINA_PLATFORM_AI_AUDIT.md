# Fase 15.12 - Auditoria Carina IA da Plataforma

## Resultado

A Carina foi centralizada como assistente oficial de suporte da Replymesh.
Sua configuracao existe somente no Painel Master. A loja utiliza apenas o chat
flutuante e nao recebe acesso a provider, prompt ou credenciais.

## Arquitetura

- `AiProviderService`: fabrica de providers.
- `ClaudeAiService`: integracao HTTPS com a API Claude.
- `CarinaAssistantService`: contexto, limites, provider, fallback e logs.
- `ReplymeshKnowledgeService`: respostas locais e controle de escopo.
- `AiGlobalSetting`: configuracao global e segredo criptografado.
- `AiAssistantLog`: auditoria por empresa e usuario.

## Seguranca

- A API key fica criptografada no banco e nunca e retornada em texto aberto.
- O Painel Master recebe apenas indicador e valor mascarado.
- O frontend da loja recebe somente estado, nome, avatar e mensagem inicial.
- Logs nao armazenam API key, tokens Evolution ou credenciais Mercado Pago.
- O contexto usa a empresa autenticada e nao mistura dados entre lojas.

## Contexto seguro

O Rails pode informar a Carina sobre empresa, plano, pagina atual, modulos,
WhatsApp, Pix, Mercado Pago, produtos, pedidos do dia, caixa, tickets,
templates e estado da loja. Segredos e dados sensiveis ficam fora do prompt.

## Escopo e fallback

Perguntas sobre a plataforma sao respondidas pelo Claude ou pela base local.
Perguntas fora do escopo sao bloqueadas antes da chamada ao provider. Quando
o Claude falha, a base local permanece disponivel.

## Validacao

- Claude respondeu pelo servidor Rails usando
  `claude-haiku-4-5-20251001`.
- O identificador legado do modelo e normalizado pelo backend.
- Dez perguntas de modulos da Replymesh tiveram resposta.
- Cinco perguntas fora do escopo foram bloqueadas.
- O chat da Demo Hamburgueria registrou empresa, usuario, pagina, provider,
  modelo e status sem registrar segredo.
- A antiga pagina de configuracao da loja foi removida.
- A listagem de empresas inativas foi validada sem erro.
- Migrations, rotas, sintaxe Ruby, builds e lint passaram.

## Limites desta fase

A Carina apenas responde e orienta. Ela nao altera dados, nao atende clientes
finais, nao envia WhatsApp e nao interfere em pedidos ou pagamentos.

Fase 16, VPS e deploy nao foram iniciados.
