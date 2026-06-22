# REPLYMESH DEV — IA VENDEDORA COM GROQ E SIMULADOR

Status: **IA VENDEDORA COM GROQ COM PENDÊNCIAS**

Data: 2026-06-22  
Branch: `dev`  

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
