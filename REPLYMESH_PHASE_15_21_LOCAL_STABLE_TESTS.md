# Replymesh Fase 15.21 - Testes locais e congelamento

Data: 06/06/2026

Versao candidata: `Replymesh Local Stable v0.15.21`

## Escopo executado

Foi criada uma bateria minima de regressao para os fluxos mais sensiveis do
backend, sem iniciar VPS, deploy ou novos modulos.

## Testes Rails

Resultado: **22 exemplos, 0 falhas**.

Cobertura minima adicionada:

- login master;
- login de usuario da loja;
- bloqueio de usuario da loja em endpoints master;
- bloqueio de master sem permissao;
- isolamento de produtos, pedidos, clientes e cupons por empresa;
- checkout delivery e retirada;
- cupom, entrega, troco e recalculo no backend;
- bloqueio de checkout quando a loja esta fechada;
- Pix pendente, aprovado, expirado e cancelado;
- template WhatsApp ativo, inativo e numero invalido;
- login, listagem, finalizacao e historico do motoboy;
- credito e premio da roleta;
- cumprimento e bloqueio de assunto externo pela Carina;
- resposta de produto no simulador da IA da loja.

## Smoke scripts

Arquivos:

- `scripts/smoke_backend.ps1`
- `scripts/smoke_frontend.ps1`
- `scripts/audit_secrets.ps1`
- `scripts/smoke_all.ps1`

Execucao completa:

```powershell
W:\sas replymesh\scripts\smoke_all.ps1
```

Resultado:

- `rails db:test:prepare`: OK
- `rails db:migrate`: OK
- `rails routes`: OK
- sintaxe dos principais arquivos Ruby: OK
- RSpec: 22/22
- build `store-template`: OK
- build `replymesh-frontend`: OK
- lint `replymesh-frontend`: OK
- rotas HTTP locais principais: OK
- auditoria de segredos: OK

Os builds exibem apenas aviso de chunks JavaScript maiores que 500 kB. Esse
aviso nao bloqueia a versao local, mas deve virar tarefa de performance futura.

## Rotas verificadas

Painel Master:

- `/dashboard`
- `/empresas`
- `/tickets`
- `/configuracoes/ia`
- `/aplicativos-android`

Store-template:

- `/loja/demohamburgueria`
- `/loja/demohamburgueria/menu`
- `/loja/demohamburgueria/cart`
- `/loja/demohamburgueria/checkout`
- `/loja/demohamburgueria/admin/dashboard`
- `/loja/demohamburgueria/admin/orders`
- `/loja/demohamburgueria/motoboy/login`

As rotas protegidas foram verificadas como entradas validas do SPA. Autorizacao
e isolamento foram cobertos pelos testes Rails.

## Auditoria de segredos

A varredura cobre codigo, configuracoes publicaveis e documentacao, excluindo
arquivos locais `.env`. Ela procura formatos conhecidos de chaves Claude/OpenAI,
Mercado Pago, Evolution, JWT e Bearer tokens.

Nenhum segredo hardcoded foi encontrado nas areas publicaveis. O script nunca
imprime o valor de uma eventual chave, apenas regra, arquivo e linha.

## Testes manuais consolidados

Os fluxos abaixo ja foram executados durante as fases anteriores e permanecem
registrados nas auditorias do projeto:

- criar empresa e entrar como empresa;
- criar/editar produto e refletir no cardapio;
- criar pedido publico e acompanhar status;
- Pix mock e Pix Mercado Pago local;
- aceitar pedido e atribuir motoboy;
- finalizar entrega e mover para historico;
- gerar credito/giro da roleta;
- abrir e responder ticket;
- conversar com a Carina;
- simular IA da loja para produto;
- consultar recuperador de vendas;
- abrir dashboard master.

Nesta rodada de congelamento nao foram repetidos envios externos reais,
pagamentos reais ou webhooks publicos.

## Bugs encontrados e corrigidos

1. O teste do historico do motoboy esperava a chave `orders`, mas o contrato
   real usa `history`. A expectativa foi corrigida sem alterar a API.
2. O primeiro smoke frontend passava incorretamente os argumentos ao `npm`.
   O script foi corrigido para chamar `npm.cmd` de forma explicita.
3. A protecao de loja fechada foi confirmada no `CheckoutService` e ganhou
   teste de regressao.

## Conclusao

A bateria minima passa integralmente. A versao local pode ser congelada como
`Replymesh Local Stable v0.15.21`.

Isso autoriza o planejamento da Fase 16, mas nao substitui homologacao de
infraestrutura, webhooks e pagamentos no ambiente publico.
