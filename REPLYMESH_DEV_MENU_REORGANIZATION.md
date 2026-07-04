# REPLYMESH DEV — Reorganizacao do Menu Admin

## Objetivo

Reorganizar visualmente o menu lateral do painel administrativo da loja para separar operacao, comunicacao e inteligencia, sem criar funcionalidades novas e sem alterar regras de negocio.

## Escopo

Executado somente na branch `dev`.

Nao foram alterados:

- rotas;
- URLs;
- APIs;
- permissoes;
- banco de dados;
- componentes internos das paginas;
- producao;
- VPS;
- branch `main`.

## Nova arquitetura do menu

### Dashboard

- Dashboard

### Operacao

- PDV / Balcao
- Pedidos
- Mesas

### Cardapio

- Produtos
- Categorias

### Entrega

- Areas de Entrega
- Motoboys

### Clientes

- Clientes
- Cupons

### Estoque

- Itens de Estoque
- Movimentacoes

### Financeiro

- Caixa
- Relatorios

### Comunicacao

- WhatsApp
- Templates WhatsApp
- Marketing WhatsApp
- Automacao Inteligente
- Aplicativo Android

### Cerebro da ReplyMesh

- Visao Estrategica
- Consultor de Vendas
- Analise do Negocio
- Inteligencia de Clientes
- Inteligencia de Produtos
- Inteligencia Artificial

### Administracao

- Usuarios
- Configuracoes

### Ajuda

- Suporte
- Atualizacoes

## Motivacao

Antes desta reorganizacao, recursos de comunicacao e inteligencia estavam misturados no mesmo grupo. Isso dificultava o crescimento das proximas fases de inteligencia da ReplyMesh.

A nova organizacao deixa claro que:

- `Comunicacao` trata canais, mensagens, templates, marketing e automacoes com clientes;
- `Cerebro da ReplyMesh` concentra analises, recomendacoes, estrategia e inteligencia operacional.

## Preparacao para futuras fases

O grupo `Cerebro da ReplyMesh` fica preparado para receber futuramente:

- Inteligencia de Marketing;
- Inteligencia de Delivery;
- Inteligencia Comercial;
- IA Comercial;
- Inteligencia Financeira;
- Inteligencia Operacional.

Nenhuma dessas telas foi criada nesta etapa.

## Arquivos alterados

- `store-template/src/components/layout/AdminLayout.jsx`
- `store-template/src/utils/permissions.js`
- `README.md`
- `ROADMAP_REPLYMESH.md`
- `STORE_TEMPLATE_PLAN.md`
- `REPLYMESH_DEV_MENU_REORGANIZATION.md`

## Validacoes

Executar:

```bash
npm run build
git diff --check
auditoria simples de segredos
```

## Observacao

Esta fase altera somente a navegacao visual. O acesso direto as rotas existentes continua preservado.
