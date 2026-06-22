# REPLYMESH DEV — CONFIGURACAO GLOBAL DA IA DAS LOJAS NO MASTER

Status: **CONFIGURACAO GLOBAL DA IA DAS LOJAS IMPLEMENTADA NA DEV**

Data: 2026-06-22  
Branch: `dev`  
Producao/VPS/main: **nao alterados**

## Objetivo

Separar no Painel Master a configuracao da Carina interna e da IA das Lojas, mantendo a tela da loja simples para o lojista.

## Master > Configuracoes > IA

Foi criada a area **IA das Lojas**, separada da Carina, com:

- ativar/desativar globalmente a IA das lojas;
- provider padrao: Groq, Claude, OpenAI ou Disabled;
- modelo padrao;
- chaves Groq, Claude e OpenAI mascaradas;
- limites globais de mensagens, tokens, timeout, produtos no contexto e handoff;
- testes seguros para Groq, Claude, OpenAI e provider padrao.

## Master > Empresas > Editar empresa

Foi criada a area **IA da loja**, com override por empresa:

- IA ativa nesta empresa;
- responder automaticamente no WhatsApp;
- provider desta empresa ou herdar padrao global;
- modelo desta empresa ou herdar padrao global;
- nivel de automacao:
  - Informacoes;
  - Vendas Assistidas;
  - Vendas Automaticas (Beta);
- limites diarios, mensais e tokens por empresa.

## Regra de resolucao no backend

1. Verifica se a IA das lojas esta ativa globalmente.
2. Verifica se a IA esta ativa na empresa.
3. Usa provider/modelo da empresa se configurado.
4. Caso contrario, usa provider/modelo global.
5. Provider `disabled` bloqueia a chamada.
6. Chave ausente retorna erro controlado `ai_provider_not_configured`.

Para preservar lojas existentes em publicacao futura, o padrao global da IA das lojas fica ativo apos a migracao. Assim, nenhuma loja que ja usava IA deixa de funcionar apenas por causa da nova chave global.

## Store / Loja

A loja continua com experiencia simplificada:

- nao mostra provider;
- nao mostra modelo;
- nao mostra Claude/Groq/OpenAI/Llama;
- nao mostra API key.

## Arquivos alterados nesta etapa

- `replymesh-api/app/controllers/api/v1/master/ai_controller.rb`
- `replymesh-api/app/controllers/api/v1/master/companies_controller.rb`
- `replymesh-api/app/models/ai_global_setting.rb`
- `replymesh-api/app/models/store_ai_setting.rb`
- `replymesh-api/app/services/store_ai_service.rb`
- `replymesh-api/config/routes.rb`
- `replymesh-api/db/migrate/20260622024500_add_store_ai_global_settings_to_ai_global_settings.rb`
- `replymesh-api/db/migrate/20260622024600_allow_store_ai_company_provider_to_inherit_global.rb`
- `replymesh-api/db/migrate/20260622024700_enable_store_ai_global_by_default.rb`
- `replymesh-frontend/src/pages/configuracoes/AiSettings.jsx`
- `replymesh-frontend/src/pages/empresas/EmpresaDetalhe.jsx`
- `replymesh-frontend/src/services/api.js`
- `REPLYMESH_DEV_GLOBAL_STORE_AI_PROVIDER_SETTINGS_REPORT.md`

## Seguranca

Nenhuma chave real foi gravada no Git. As chaves sao salvas criptografadas no backend ou lidas via variaveis de ambiente.

## Publicacao

Esta etapa nao fez push, nao fez deploy, nao alterou VPS e nao alterou `main`.
