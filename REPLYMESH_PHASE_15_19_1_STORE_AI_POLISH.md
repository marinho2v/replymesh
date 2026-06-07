# Fase 15.19.1 - IA da Loja e Evolution

## Resultado

A IA da Loja foi refinada para atendimento ao consumidor e preparada para
responder mensagens recebidas pela Evolution sem expor credenciais.

## Melhorias

- Metricas de tokens e custos removidas do painel da loja.
- Metricas globais adicionadas ao Painel Master, separando Carina e IA das
  Lojas.
- Respostas humanizadas e curtas.
- IDs, SKUs e nomes tecnicos filtrados.
- Formatter proprio para WhatsApp.
- Busca por produtos semelhantes sem expor produtos de auditoria.
- Consulta de horarios, pagamentos, entrega, promocoes e pedido recente.
- Bloqueio amigavel de assuntos externos.

## Integracao Evolution

Endpoint:

`POST /api/v1/webhooks/evolution/messages`

Fluxo:

1. Evolution envia o evento ao Rails.
2. Rails valida o segredo do webhook.
3. O parser aceita apenas campos conhecidos.
4. Mensagens proprias, grupos e localizacoes sao ignorados.
5. A instancia identifica a empresa.
6. O telefone identifica cliente e pedido recente.
7. RAG e Claude geram a resposta.
8. O formatter prepara o texto.
9. Rails envia pela Evolution e registra auditoria segura.

`Responder automaticamente no WhatsApp` fica desligado por padrao. A
instancia conectada da Demo foi identificada, mas nenhum envio real foi feito.
O pipeline completo foi validado em modo mock.

## Seguranca

- API key global e token da instancia permanecem somente no backend.
- Credenciais nao aparecem no frontend, JSON ou logs de auditoria.
- Eventos duplicados usam chave de idempotencia.
- Logs armazenam somente os ultimos quatro digitos do telefone.
- Eventos de localizacao continuam em fluxo separado e prioritario.

## Validacao local

Perguntas validadas:

- Boa noite.
- Tem hamburguer?
- Qual horario?
- Aceita Pix?
- Meu pedido?
- Quais promocoes?
- Receita de bolo.

Tambem foram validados migrations, rotas, sintaxe Ruby, Zeitwerk, lint, builds,
interfaces do Master e da loja, parser Evolution e pipeline de envio mock.

## Tokens

O RAG da Carina manteve a reducao medida de 86,4% no contexto de teste. A IA
da Loja tambem envia apenas os chunks relevantes e um historico curto.

## Pendente

- Configurar uma URL publica do webhook depois da autorizacao de deploy.
- Habilitar resposta automatica apenas em uma empresa de teste.
- Fazer um envio real controlado para um numero autorizado.
- Monitorar duplicidade, latencia e consumo antes de ampliar o uso.

VPS, deploy e Fase 16 nao foram iniciados.
