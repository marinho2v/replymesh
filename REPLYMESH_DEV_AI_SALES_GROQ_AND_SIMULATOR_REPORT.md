# REPLYMESH DEV — IA VENDEDORA COM GROQ E SIMULADOR

Status: **IA VENDEDORA COM GROQ COM PENDÊNCIAS**

Data: 2026-06-22
Branch: `dev`

## IA Delivery Pro Max em 2026-06-27

Status: **IA DELIVERY PRO MAX IMPLEMENTADA NA DEV**

### Motor por camadas

- adicionada camada `AiMessageNormalizer` para normalizar portugues informal, abreviacoes, girias, acentos e erros comuns;
- adicionada camada `AiIntentRouter` com intencoes, score e confianca para perguntas de cardapio, produto, horario, entrega, pagamento, status, confirmacao, humano e reclamacao;
- adicionada camada `AiProductSearch` para busca inteligente no cardapio por nome, descricao, categoria, termo relacionado e fuzzy matching simples;
- a IA vendedora passou a usar o motor novo sem alterar o classificador legado da Carina/Store AI tradicional;
- acoes criticas continuam deterministicas no backend: produto, preco, taxa, pagamento, pedido e status.

### Conversa e venda

- perguntas como `quais opcoes de lanches voce tem`, `manda cardapio`, `tem refri`, `tem bacon`, `tem costela` e `qual voce recomenda` passam a abrir lista real de produtos;
- depois de pedido concluido, perguntas de cardapio iniciam nova descoberta de produto em vez de repetir status do pedido;
- `pedido aberto?` volta a explicar carrinho/pedido em andamento quando existir conversa ativa;
- busca de produto prioriza dados reais da empresa atual e nao inventa preco/produto;
- handoff continua reservado para pedido humano, reclamacao ou repeticao real de desconhecido.

### Logs seguros

- logs internos do fluxo vendedor incluem mensagem original mascarada, mensagem normalizada, intencao, confianca, stage e motivo de erro/handoff;
- telefone continua mascarado por ultimos 4 digitos;
- nenhum token, senha ou chave de provider e registrado.

### Testes adicionados

- nova suite `ai_delivery_pro_max_intent_spec.rb` com mais de 100 frases reais de clientes brasileiros;
- nova suite `ai_product_search_spec.rb` validando busca por giria, descricao, categoria e erro de digitacao;
- suite da IA vendedora validada junto com Pix manual, Pix Mercado Pago, dinheiro, cartao, pedido real, endereco salvo, status e multiempresa do fluxo vendedor.

### Validacao

- `ruby -c` aprovado nos novos servicos e no `StoreAiSalesService`;
- `bundle exec rspec spec/services/ai_delivery_pro_max_intent_spec.rb spec/services/ai_product_search_spec.rb spec/services/store_ai_sales_payment_flow_spec.rb` aprovado com 31 exemplos e 0 falhas;
- `npm run build` do `store-template` aprovado;
- `git diff --check` aprovado nos arquivos do escopo;
- auditoria textual de segredos nos diffs do escopo sem achados.

### Observacao de escopo

- nao houve deploy;
- nao houve alteracao em `main`;
- nao houve alteracao na VPS;
- o fluxo legado `StoreAiService`/Carina/Evolution nao foi refatorado nesta fase para evitar misturar riscos com a IA vendedora.

## Fase 2 da IA vendedora em 2026-06-24

Status: **IA VENDEDORA DE DELIVERY VALIDADA NA DEV**

### Experiencia comercial

- saudacoes agora identificam cliente existente ou solicitam o nome do cliente novo;
- clientes recebem de 3 a 5 recomendacoes reais com nome e preco;
- recomendacoes priorizam quantidade vendida, destaque, promocao e produtos recentes;
- selecao numerada continua vinculada somente aos produtos da empresa atual;
- apos o primeiro item, a IA oferece no maximo um adicional relevante, priorizando bebida, acompanhamento, sobremesa ou combo;
- recusa do adicional segue imediatamente para identificacao/endereco, sem insistencia.

### Busca e fotos

- busca ampliada para nome, descricao, categoria, ingredientes descritos e palavras relacionadas;
- termos como coca, refri, batata, lanche, hamburguer, costela, bacon, cheddar, doce e combo recebem expansao segura;
- links publicos com `produto=slug` selecionam somente produto ativo da empresa atual;
- foto sempre usa URL publica da pagina do produto, com descricao e preco atualizado;
- caminhos internos de imagem nunca sao enviados ao cliente.

### Logs por empresa

- nova pagina: `Admin > Inteligencia Artificial > Ver logs`;
- nova rota: `/admin/ai/logs`;
- filtros: Hoje, Ontem e 7 dias;
- exibe cliente, telefone mascarado, pergunta, resposta, tempo, tokens, provider, status, pedido criado, erro e motivo de handoff;
- endpoint e consulta permanecem isolados pela empresa autenticada;
- nenhum token, chave ou telefone completo e exibido.

### Validacao

- 24 exemplos do fluxo vendedor, checkout e pagamentos aprovados;
- 1 exemplo da API multiempresa de logs aprovado;
- build completo do Store aprovado com a nova tela;
- sintaxe Ruby e `git diff --check` aprovados;
- Carina, WhatsApp manual, Evolution, Mercado Pago, Painel Master, main e VPS nao foram alterados.

## Correcao do fechamento de pedido real e pagamentos em 2026-06-23

Status: **IA VENDEDORA CRIANDO PEDIDOS NA DEV**

Foi concluida a integracao dos dois requisitos complementares:

1. fechamento seguro de pedido real pela IA vendedora;
2. separacao entre Pix automatico Mercado Pago e Pix manual da loja.

### Pedido real

- o pedido somente e criado depois da resposta final `CONFIRMAR`, incluindo variacoes seguras como `confirma`, `confirmo`, `finalizar` e `pode confirmar`;
- a criacao reutiliza `CheckoutService`, o mesmo servico seguro do checkout publico;
- produtos, precos, taxa, cliente e endereco sao recalculados/validados no backend;
- a origem e registrada como `whatsapp_ai`;
- o pedido entra na tabela normal de pedidos e passa a ser visto pelo polling do painel, contador, dashboard e aviso sonoro;
- a conversa e encerrada por 30 minutos depois da criacao, permitindo que o fluxo normal de status assuma;
- falhas tecnicas recebem log seguro e mensagem amigavel, sem stacktrace para o cliente.

### Cliente

- cliente existente e localizado pelo telefone e pode reutilizar endereco salvo;
- cliente novo informa o nome antes do endereco;
- o cadastro do novo cliente ocorre somente dentro da confirmacao final do checkout;
- o telefone continua com unicidade por empresa, evitando duplicacao.

### Pagamentos

- dinheiro pergunta sobre troco e grava `needs_change`/`change_for_cents`;
- cartao pergunta credito ou debito e grava o tipo na observacao do pedido;
- Pix automatico somente e usado quando Mercado Pago esta ativo, configurado e liberado para a empresa;
- Pix automatico reutiliza `MercadoPagoPixService`, grava o pedido como `pending_payment` e envia copia e cola/link;
- webhook existente confirma pagamento e nao cria um segundo pedido;
- Pix manual usa a chave/payload e beneficiario configurados na loja, permanece `pending` e exige confirmacao humana;
- o painel identifica `Pix manual` com o alerta `Aguardando confirmacao da loja`;
- sem qualquer Pix configurado, a IA oferece dinheiro ou cartao.

### Produtos e foto

- busca considera nome, descricao, categoria, nome parcial e link publico do produto;
- recomendacoes priorizam quantidade vendida, destaque, promocao e ordenacao real da loja;
- respostas sempre usam produtos ativos e precos atuais;
- pedido de foto usa link publico completo do produto e nunca expoe caminho interno da imagem.

### Validacoes desta correcao

- 21 exemplos deterministas aprovados;
- cenarios cobertos: Pix Mercado Pago, Pix manual, Pix indisponivel, webhook, dinheiro sem troco, dinheiro com troco, cartao credito/debito, cliente novo, recomendacao, link/foto e checkout normal;
- `ruby -c` aprovado nos Ruby alterados;
- build do Store aprovado;
- `git diff --check` aprovado;
- producao, VPS e branch `main` nao foram alteradas.

Observacao: a suite antiga baseada em resposta textual livre do provider apresentou 7 comparacoes literais variaveis. Elas sao a mesma pendencia de determinismo ja registrada neste relatorio e nao afetaram os 21 testes de estado, pedido e pagamento.

## Validacao final em 2026-06-22

Status mais recente: **IA GROQ VALIDADA NO SIMULADOR E DEV PRONTA PARA ENVIO**

### Ambiente seguro utilizado

- empresa QA isolada: `qa-ai-lanches`;
- WhatsApp da empresa: desativado;
- criacao real de pedido: desativada;
- Pix automatico: desativado;
- modo da loja: Vendas Assistidas;
- provider global: Groq;
- modelo global: `llama-3.1-8b-instant`;
- limites de uso reduzidos para teste;
- `GROQ_API_KEY` mantida somente no ambiente local e nunca exibida ou gravada no Git.

### Massa de teste

- X-Bacon - R$ 25,90;
- Smash Duplo - R$ 29,90;
- Costela Artesanal - R$ 34,90;
- Batata Frita - R$ 14,90;
- Coca-Cola - R$ 8,00;
- bairro Centro - taxa R$ 7,00.

### Conversa validada no simulador

1. `Oi, quero um hamburguer`: listou somente os cinco produtos da empresa e seus precos reais;
2. `Quero o de costela`: adicionou Costela Artesanal ao carrinho temporario e avancou para endereco;
3. `Qual a taxa para o bairro Centro?`: aplicou R$ 7,00 e avancou para pagamento;
4. `Vou pagar no Pix`: registrou Pix no carrinho temporario e solicitou confirmacao;
5. `Falar com atendente`: mudou para handoff humano.

Resultado de seguranca:

- zero pedidos reais criados;
- zero mensagens reais de WhatsApp enviadas;
- nenhum produto ou preco inventado;
- conversa e carrinho vinculados exclusivamente a `qa-ai-lanches`;
- nenhuma empresa ou cliente real utilizado;
- conexao real com a API Groq confirmada com sucesso, sem imprimir a chave;
- a orquestracao de Vendas Assistidas permaneceu deterministica no simulador, enquanto o provider Groq foi validado separadamente pela camada `AiProviderService`.

### Interface e CORS local

A tela `/admin/ai` foi validada no navegador com a experiencia simplificada para lojistas. O simulador respondeu corretamente pela interface. Foi permitido, somente em `development`, o acesso por subdominios `*.localhost` nas portas locais 5173 e 5174. Origens externas continuam sem permissao e producao nao foi ampliada.

### Validacoes executadas

- migrations de IA: todas aplicadas;
- build `store-template`: aprovado;
- build `replymesh-frontend`: aprovado;
- sintaxe Ruby do initializer alterado: aprovada;
- `git diff --check`: aprovado;
- auditoria de segredos nos arquivos rastreados: zero ocorrencias;
- teste CORS local: origem `qa-ai-lanches.localhost` permitida apenas em desenvolvimento;
- teste CORS externo: origem sem permissao.

### Observacao sobre a suite legada

Uma verificacao adicional, fora da lista obrigatoria, executou 35 exemplos antigos e encontrou 6 falhas de comparacao textual. Essas expectativas exigem frases exatas, enquanto a chave Groq local faz o modelo responder com redacao variavel. Os testes seguros do simulador, isolamento multiempresa, builds e validacoes obrigatorias foram aprovados. Recomenda-se tornar esses specs deterministicos com stubs do provider em uma tarefa separada.
Produção/VPS: **não alterada**

## Resumo

Foi criada uma primeira base segura para evoluir a IA da Loja em direção a uma IA vendedora no WhatsApp.

A implementação mantém o fluxo atual protegido:

- o modo vendedor vem desligado por padrão;
- criação real de pedido vem desligada por padrão;
- geração automática de Pix Mercado Pago vem desligada por padrão;
- WhatsApp manual/automático continua respeitado pelo webhook atual;
- Evolution não foi alterado no fluxo de envio real, apenas continua chamando `StoreAiService`.

## Arquivos alterados

### Backend

- `replymesh-api/app/controllers/api/v1/store/store_ai_controller.rb`
- `replymesh-api/app/models/ai_usage_log.rb`
- `replymesh-api/app/models/company.rb`
- `replymesh-api/app/models/store_ai_cart.rb`
- `replymesh-api/app/models/store_ai_conversation.rb`
- `replymesh-api/app/models/store_ai_setting.rb`
- `replymesh-api/app/services/ai_provider_service.rb`
- `replymesh-api/app/services/disabled_ai_service.rb`
- `replymesh-api/app/services/groq_ai_service.rb`
- `replymesh-api/app/services/open_ai_compatible_chat_service.rb`
- `replymesh-api/app/services/openai_ai_service.rb`
- `replymesh-api/app/services/store_ai_sales_service.rb`
- `replymesh-api/app/services/store_ai_service.rb`
- `replymesh-api/app/services/whatsapp_message_builder.rb`
- `replymesh-api/db/schema.rb`

### Frontend Store

- `store-template/src/pages/admin/StoreAiSettings.jsx`

### Migrations

- `replymesh-api/db/migrate/20260622023000_add_sales_ai_settings_to_store_ai_settings.rb`
- `replymesh-api/db/migrate/20260622023100_create_store_ai_carts.rb`

## Provider Groq

Foi adicionada uma camada multiprovedor:

- `anthropic`
- `groq`
- `openai`
- `disabled`

Também foi mantida compatibilidade com o provider legado `claude`.

Variáveis usadas:

- `GROQ_API_KEY`
- `GROQ_BASE_URL`, com default `https://api.groq.com/openai/v1`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`, com default `https://api.openai.com/v1`

Nenhuma chave foi gravada no Git.

## Configurações por empresa

Foram adicionados campos por loja em `store_ai_settings` para:

- provedor/modelo;
- modo de atendimento;
- limites diários/mensais;
- cliente;
- pedido;
- pagamento;
- handoff humano.

Modos previstos:

- `answers`: somente respostas;
- `sales_assistant`: assistente de vendas;
- `auto_seller`: vendedor automático.

## Fluxo de venda

Foi criado `StoreAiSalesService` com carrinho temporário por empresa e telefone.

Estados previstos:

- `greeting`
- `product_discovery`
- `product_selection`
- `options_selection`
- `upsell`
- `customer_identification`
- `address_collection`
- `address_confirmation`
- `delivery_calculation`
- `payment_selection`
- `pix_generation`
- `order_confirmation`
- `waiting_payment`
- `completed`
- `handoff`

O fluxo já prepara:

- identificação por telefone;
- busca de produtos relevantes;
- seleção numerada;
- carrinho temporário;
- coleta/confirmação de endereço;
- cálculo básico de entrega;
- seleção de pagamento;
- confirmação de pedido;
- criação real de pedido somente se `create_order_after_confirmation` estiver ativo;
- Pix Mercado Pago somente se configurado e `auto_generate_mercadopago_pix` estiver ativo;
- pausa/handoff em pedidos de atendente.

## Carrinho temporário

Criada tabela `store_ai_carts` com:

- `company_id`
- `customer_phone`
- `conversation_id`
- `stage`
- `items`
- `selected_options`
- `delivery_address`
- `delivery_fee_cents`
- `payment_method`
- `subtotal_cents`
- `discount_cents`
- `total_cents`
- `expires_at`
- `metadata_json`

## Simulador

Na tela `Admin > Inteligência Artificial`, foi adicionado bloco:

**Testar IA sem WhatsApp real**

Campos:

- telefone de teste;
- mensagem do cliente;
- botão `Simular resposta`.

A simulação:

- usa dados reais da empresa atual;
- não chama Evolution;
- não envia WhatsApp;
- mostra resposta;
- mostra stage;
- mostra produtos encontrados;
- mostra carrinho;
- mostra próxima ação;
- não cria pedido real quando o modo seguro estiver desligado.

## WhatsApp / Evolution

O webhook atual continua exigindo:

- empresa correta pela instância WhatsApp;
- WhatsApp em modo automático;
- IA da loja ativa;
- resposta automática ativa;
- rate limit;
- conversa não pausada.

Não foi implementado envio real de botões/listas/mídia.
Foi criada a abstração `WhatsappMessageBuilder` com fallback textual numerado.

## Mercado Pago / Pix

O fluxo de Pix foi preparado para usar `MercadoPagoPixService` quando:

- pedido real for criado;
- pagamento for Pix;
- loja tiver Mercado Pago configurado;
- `auto_generate_mercadopago_pix` estiver ativo.

Se Mercado Pago não estiver configurado, a IA não força Pix automático.

## Limitações local DEV

Local DEV pode testar:

- tela da IA;
- provider Groq com variável local;
- simulador;
- busca de produtos;
- carrinho temporário;
- cálculo básico de entrega;
- criação simulada;
- fluxo sem WhatsApp real.

Local DEV não valida 100%:

- webhook real da Evolution;
- recebimento real de WhatsApp;
- envio real pelo número conectado;
- mídia real;
- confirmação real via webhook Mercado Pago;
- comportamento real com instância da VPS.

## Validações executadas

Executado com sucesso:

- `ruby -c` nos arquivos Ruby alterados;
- `npm run build` em `store-template`;
- `npm run build` em `replymesh-frontend`;
- `git diff --check`;
- auditoria de segredos por busca textual.

Resultado da auditoria:

- não foi encontrada chave real;
- somente referências aos nomes das variáveis (`GROQ_API_KEY`, `OPENAI_API_KEY`).

## Pendências

1. `bundle exec rails db:migrate` não rodou localmente porque este workspace está sem gems instaladas:
   - `puma`
   - `bcrypt`
   - `bootsnap`
   - `msgpack`
   - outras dependências do bundle.

2. Criar empresa QA `qa-ai-lanches` e massa de produtos após ambiente Ruby/DB local estar funcional.

3. Testar cenários QA:
   - cliente novo pede hambúrguer;
   - cliente existente confirma endereço;
   - taxa de entrega;
   - pedido de foto;
   - Pix com Mercado Pago configurado;
   - Pix sem Mercado Pago;
   - pedido de atendente;
   - loja fechada;
   - produto inexistente.

4. Validar criação real de pedido apenas em QA.

5. Criar tela futura `IA > Logs` se desejar observabilidade visual.

6. Teste controlado futuro na VPS com empresa QA e WhatsApp separado.

## Plano futuro de rollback para VPS

Antes de qualquer publicação futura:

1. registrar commit atual;
2. backup do banco;
3. backup da API;
4. backup do Store;
5. backup do Master;
6. criar imagem/tag anterior;
7. publicar primeiro em empresa QA;
8. testar WhatsApp real → Evolution → webhook → IA → resposta;
9. se falhar, rollback imediato para imagem/tag anterior e restore se necessário.

## Observação de segurança

Esta fase não alterou produção, não alterou `main`, não fez deploy e não usou dados reais de cliente em teste.
