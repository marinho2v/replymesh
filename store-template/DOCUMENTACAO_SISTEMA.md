# Sistema de Cardápio Digital - Lanche do 2R

## Descrição Geral
Sistema completo de cardápio digital para lancherias e restaurantes, com gestão de pedidos, controle de estoque, notificações em tempo real e integração com WhatsApp.

---

## Tecnologias Utilizadas

### Frontend
- **React** - Framework JavaScript para interface de usuário
- **React Router DOM** - Roteamento de páginas
- **TailwindCSS** - Framework CSS para estilização
- **Lucide React** - Ícones modernos
- **Sonner** - Sistema de notificações (toast)
- **React Hot Toast** - Notificações alternativas

### Backend
- **Supabase** - Banco de dados PostgreSQL, autenticação e Realtime
- **PostgreSQL** - Banco de dados relacional
- **Supabase Auth** - Sistema de autenticação seguro
- **Supabase Realtime** - Atualizações em tempo real via WebSockets
- **Supabase Storage** - Armazenamento de imagens

### Integrações
- **WhatsApp API** - Envio automático de mensagens para clientes
- **Web Audio API** - Notificações sonoras sem arquivos externos

---

## Funcionalidades do Sistema

### 🛒 Site Público (Cliente)

#### Página Inicial (Home)
- Exibição de banner da loja
- Horários de funcionamento
- Informações de contato
- Acesso rápido ao cardápio

#### Cardápio (Menu)
- Listagem de produtos por categoria
- Filtro por categoria
- Busca de produtos
- Exibição de preço e imagem
- Adição ao carrinho
- Controle de quantidade no carrinho

#### Carrinho (Cart)
- Visualização dos itens selecionados
- Edição de quantidades
- Remoção de itens
- Cálculo de subtotal
- Aplicação de cupom de desconto
- Validação de estoque antes do checkout

#### Checkout
- Formulário de dados do cliente
- Escolha de tipo de pedido (entrega ou retirada)
- Cálculo automático de taxa de entrega por bairro
- Seleção de forma de pagamento (Dinheiro, Pix, Cartão)
- Campo para troco (pagamento em dinheiro)
- Campo de observações
- Validação de horário de funcionamento
- Criação automática do pedido

#### Página de Sucesso
- Confirmação do pedido
- Número do pedido
- Resumo dos itens
- Botão para WhatsApp
- Estimativa de tempo de entrega

---

### 👨‍💼 Painel Administrativo

#### Dashboard
- Visão geral de pedidos (hoje, semana, mês)
- Faturamento total
- Pedidos por status (pendente, aceito, em preparo, pronto, entregue, cancelado)
- Produtos mais vendidos
- Gráficos de vendas por período
- Acesso rápido às ações

#### Gestão de Pedidos (Orders)
- Listagem de todos os pedidos
- Filtro por status, período, cliente
- Busca por número do pedido
- Atualização em tempo real (Supabase Realtime)
- **Notificação sonora** ao chegar novo pedido
- **Notificação visual** (toast) ao chegar novo pedido
- Alteração de status do pedido:
  - Pendente → Aceito
  - Aceito → Em Preparo
  - Em Preparo → Pronto
  - Pronto → Entregue
  - Qualquer status → Cancelado
- **Baixa automática de estoque** ao aceitar pedido
- **Retorno automático ao estoque** ao cancelar pedido
- Detalhes do pedido (itens, cliente, endereço, pagamento)
- Envio de mensagem WhatsApp automática ao mudar status
- Histórico de status do pedido

#### Gestão de Produtos (Products)
- Cadastro de produtos
- Edição de produtos
- Exclusão de produtos
- Categorias
- Preço e preço promocional
- Imagem do produto
- **Controle de estoque** (habilitar/desabilitar)
- **Vinculação com item de estoque**
- Produto em destaque
- Produto promocional
- Produto combo
- Ordenação personalizada
- Ativo/Inativo

#### Gestão de Categorias (Categories)
- Cadastro de categorias
- Edição de categorias
- Exclusão de categorias
- Ordenação personalizada
- Ativo/Inativo

#### Áreas de Entrega (Delivery Zones)
- Cadastro de zonas de entrega
- Definição de bairros por zona
- Taxa de entrega por zona
- Tempo de entrega estimado
- Bloqueio de pedidos fora da área
- Ativo/Inativo

#### Gestão de Clientes (Customers)
- Listagem de todos os clientes
- Busca por nome ou telefone
- Histórico de pedidos por cliente
- Total gasto por cliente
- Último pedido do cliente
- Detalhes do cliente (endereço, contato)

#### Gestão de Cupons (Coupons)
- Cadastro de cupons de desconto
- Código único do cupom
- Tipo de desconto (percentual ou valor fixo)
- Valor do desconto
- Data de validade
- Limite de uso (por cupom ou por cliente)
- Mínimo de pedido para aplicação
- Ativo/Inativo
- Histórico de uso dos cupons

#### Gestão de Usuários (Users)
- Cadastro de usuários do sistema
- **Funções (roles):**
  - **Admin** - Acesso completo ao sistema
  - **Atendente** - Acesso limitado (pedidos, produtos, clientes)
  - **Cozinha** - Acesso apenas ao painel de cozinha
- Gerenciamento de permissões

#### Relatórios (Reports)
- Relatório de vendas por período
- Produtos mais vendidos
- Pedidos por status
- Faturamento total
- Filtros por data
- Exportação de dados

#### Configurações (Settings)
- **Dados da Loja:**
  - Nome da loja
  - CNPJ
  - Telefone
  - WhatsApp
  - Endereço
  - Cidade/Estado
  - Logo da loja

- **Horários de Funcionamento:**
  - Horário de cada dia da semana
  - Opção de loja fechada em dias específicos
  - Mensagem personalizada quando fechado

- **Configurações de Entrega:**
  - Tempo padrão de entrega
  - Bloqueio de pedidos fora da área
  - Taxa mínima de entrega

- **Configurações de WhatsApp:**
  - Número de WhatsApp
  - Habilitar/desabilitar envio automático
  - Templates de mensagens personalizadas

#### Templates de WhatsApp (Whatsapp Templates)
- Criação de templates de mensagens
- Variáveis dinâmicas:
  - `{cliente}` - Nome do cliente
  - `{pedido}` - Número do pedido
  - `{total}` - Valor total
  - `{bairro}` - Bairro do cliente
  - `{endereco}` - Endereço completo
  - `{itens}` - Lista de itens
  - `{taxa_entrega}` - Taxa de entrega
  - `{forma_pagamento}` - Forma de pagamento
  - `{cupom}` - Cupom usado
  - `{desconto}` - Valor do desconto
  - `{subtotal}` - Subtotal
- Templates por status:
  - Novo pedido
  - Pedido confirmado
  - Pedido em preparo
  - Pedido pronto
  - Pedido entregue
  - Pedido cancelado

#### Gestão de Estoque (Inventory)
- Listagem de itens de estoque
- Cadastro de itens de estoque
- Edição de itens de estoque
- Exclusão de itens de estoque
- **Quantidade atual**
- **Quantidade mínima** (alerta de baixo estoque)
- Unidade de medida (un, lata, garrafa, kg, g, ml, l)
- Categoria do item
- Ativo/Inativo
- Alerta de itens com baixo estoque

#### Movimentações de Estoque (Inventory Movements)
- Histórico completo de movimentações
- Filtro por período
- Filtro por tipo (entrada, saída, ajuste)
- Filtro por item de estoque
- Detalhes de cada movimentação:
  - Item
  - Tipo (entrada/saída/ajuste)
  - Quantidade
  - Quantidade antes
  - Quantidade depois
  - Motivo
  - Fonte (manual, pedido, cancelamento)
  - Referência (ID do pedido)
  - Usuário que fez a movimentação
  - Data/hora

---

### 👨‍🍳 Painel de Cozinha (Kitchen Board)

- Visualização de pedidos em tempo real
- Filtro por status (pendente, em preparo, pronto)
- Exibição clara dos itens do pedido
- **Notificação sonora** ao chegar novo pedido
- Marcação de pedido como "Em Preparo"
- Marcação de pedido como "Pronto"
- Tempo de espera do pedido
- Priorização por ordem de chegada
- Interface simplificada para uso rápido

---

## Fluxo de Trabalho

### Para o Cliente
1. Acessa o site
2. Navega pelo cardápio
3. Adiciona itens ao carrinho
4. Aplica cupom de desconto (se tiver)
5. Preenche dados pessoais
6. Escolhe tipo de entrega (entrega ou retirada)
7. Seleciona forma de pagamento
8. Confirma o pedido
9. Recebe confirmação e número do pedido
10. Recebe atualizações via WhatsApp

### Para o Atendente
1. Recebe notificação sonora/visual ao chegar pedido
2. Visualiza pedido na lista
3. Aceita o pedido (baixa automática do estoque)
4. Envia mensagem WhatsApp automática para cliente
5. Acompanha status do pedido
6. Atualiza status conforme necessário
7. Gerencia produtos e estoque
8. Atende clientes no balcão

### Para a Cozinha
1. Recebe notificação ao chegar pedido aceito
2. Visualiza pedido no painel
3. Marca como "Em Preparo" ao iniciar
4. Marca como "Pronto" ao finalizar
5. Pedido fica disponível para entrega

### Para o Admin
1. Acompanha métricas de vendas
2. Gerencia usuários e permissões
3. Configura horários e áreas de entrega
4. Cria e gerencia cupons
5. Analisa relatórios de vendas
6. Gerencia estoque
7. Configura templates de WhatsApp
8. Monitora todo o sistema

---

## Funcionalidades Especiais

### Controle de Estoque Automático
- **Baixa automática** ao aceitar pedido
- **Retorno automático** ao cancelar pedido
- Alerta de baixo estoque
- Vinculação direta com produtos
- Histórico completo de movimentações

### Notificações em Tempo Real
- **Supabase Realtime** para atualizações instantâneas
- Notificação sonora (beep) ao chegar pedido
- Notificação visual (toast) ao chegar pedido
- Atualização automática de listas sem recarregar página

### Integração WhatsApp
- Envio automático de mensagens ao mudar status
- Templates personalizáveis
- Variáveis dinâmicas
- Mensagem formatada e profissional

### Gestão de Cupons
- Códigos únicos
- Desconto percentual ou fixo
- Validação por data
- Limite de uso
- Mínimo de pedido
- Histórico de uso

### Relatórios Avançados
- Vendas por período
- Produtos mais vendidos
- Pedidos por status
- Faturamento total
- Filtros personalizados

---

## Segurança e Permissões

### Sistema de Autenticação
- Login seguro via Supabase Auth
- Proteção de rotas sensíveis
- Sessão gerenciada automaticamente

### Controle de Acesso (Roles)
- **Admin** - Acesso total ao sistema
- **Atendente** - Pedidos, produtos, clientes, estoque
- **Cozinha** - Apenas painel de cozinha

### Row Level Security (RLS)
- Políticas de segurança no banco de dados
- Acesso restrito por usuário
- Proteção de dados sensíveis

---

## Hospedagem e Infraestrutura

- **Supabase** - Banco de dados e autenticação (nuvem)
- **Vercel/Netlify** - Hospedagem do frontend (opcional)
- **CDN** - Distribuição de imagens
- **Backup automático** - Garantia de dados

---

## Responsividade

- Design responsivo para todos os dispositivos
- Otimizado para mobile
- Interface adaptável
- Experiência consistente

---

## Performance

- Otimização de queries
- Lazy loading de imagens
- Cache de dados
- Atualizações incrementais
- Carregamento rápido

---

## Suporte e Manutenção

- Código limpo e documentado
- Estrutura modular
- Fácil manutenção
- Escalável
- Atualizações contínuas

---

## Próximas Funcionalidades (Futuro)

- Integração com gateways de pagamento (Stripe, MercadoPago)
- Sistema de avaliação de pedidos
- Programa de fidelidade
- Integração com redes sociais
- App mobile nativo
- Impressão de comandas
- Integração com delivery apps (iFood, Rappi)
- Dashboard avançado de analytics

---

## Resumo

Este é um sistema completo e profissional de cardápio digital, ideal para lancherias, restaurantes e estabelecimentos de alimentação. Oferece todas as funcionalidades necessárias para gerenciar pedidos, estoque, clientes e vendas de forma eficiente, com integrações modernas e interface intuitiva.

O sistema é **100% gerenciável via painel administrativo**, não necessitando de conhecimento técnico para operação. Basta acesso à internet e um navegador web.
