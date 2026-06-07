# Lanche do 2R - Sistema de Cardápio Online

Sistema completo de cardápio online para hamburgueria com React + Supabase.

## 🚀 Tecnologias

- **Frontend**: React, React Router DOM, TailwindCSS, Lucide React, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Formulários**: React Hook Form, Zod
- **UI**: Sonner (toasts), Componentes customizados
- **Integrações**: ViaCEP (CEP), WhatsApp Web

## 📋 Funcionalidades

### Cliente
- Cardápio online com categorias
- Carrinho de compras
- Checkout com busca de CEP automática
- Cálculo de taxa de entrega por bairro
- Cupons de desconto
- Múltiplas formas de pagamento
- Envio de pedido via WhatsApp

### Admin
- Dashboard com estatísticas
- Gestão de pedidos
- Gestão de produtos e categorias
- Gestão de áreas de entrega
- Gestão de clientes com histórico
- Gestão de cupons
- Gestão de usuários
- Configurações da loja
- Templates de WhatsApp
- Relatórios

### Cozinha
- Painel em tempo real
- Colunas por status
- Atualização de status

## 🔧 Setup do Projeto

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em Settings > API e copie:
   - Project URL
   - anon public key

3. Crie o arquivo `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Aplicar Schema SQL

1. No Supabase, vá em SQL Editor
2. Abra o arquivo `supabase-schema.sql`
3. Copie todo o conteúdo e execute no SQL Editor
4. Isso criará todas as tabelas, índices, políticas RLS e dados iniciais

### 4. Criar Usuário Admin

No Supabase SQL Editor, execute:

```sql
-- Crie o usuário via Authentication > Users na interface do Supabase
-- Depois execute para definir como admin:

insert into public.profiles (id, full_name, email, role, is_active)
values (
  'user_id_do_auth',
  'Admin',
  'admin@email.com',
  'admin',
  true
);
```

### 5. Executar o Projeto

```bash
npm run dev
```

Acesse:
- **Site**: http://localhost:5173
- **Admin**: http://localhost:5173/login

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── App.jsx          # Componente principal com providers
│   ├── router.jsx       # Rotas da aplicação
│   └── providers.jsx    # Providers globais
├── components/
│   ├── ui/              # Componentes UI reutilizáveis
│   ├── layout/          # Layouts (Public, Admin)
│   ├── shared/          # Componentes compartilhados
│   └── ...
├── pages/
│   ├── public/          # Páginas públicas
│   ├── auth/            # Login
│   ├── admin/           # Painel administrativo
│   └── kitchen/         # Painel da cozinha
├── services/            # Serviços Supabase
├── hooks/               # Custom hooks
├── contexts/            # Contexts (Auth, Cart)
├── utils/               # Funções utilitárias
└── lib/                 # Constantes e permissões
```

## 👥 Perfis de Usuário

### Admin
- Acesso total ao sistema
- Gestão de usuários
- Configurações da loja
- Relatórios

### Atendente
- Gestão de pedidos
- Gestão de produtos
- Gestão de clientes
- Envio de WhatsApp

### Cozinha
- Painel da cozinha
- Atualização de status
- Sem acesso a dados financeiros

## 💳 Formas de Pagamento

- **Dinheiro**: Com campo para troco
- **Pix**: Chave configurável nas configurações
- **Cartão na entrega**: Pagamento na entrega

## 📱 WhatsApp Integration

O sistema usa WhatsApp Web via link com mensagem pronta. Não utiliza API paga.

Placeholders disponíveis nos templates:
- `{cliente}` - Nome do cliente
- `{pedido}` - Número do pedido
- `{total}` - Valor total
- `{bairro}` - Bairro
- `{endereco}` - Endereço completo
- `{itens}` - Lista de itens
- `{taxa_entrega}` - Taxa de entrega
- `{forma_pagamento}` - Forma de pagamento
- `{cupom}` - Código do cupom
- `{desconto}` - Valor do desconto
- `{subtotal}` - Valor subtotal

## 🎨 Design

- Tema dark premium
- Cor principal: #F60670
- Responsivo (mobile e desktop)
- Animações suaves com Framer Motion
- Componentes modernos

## 📦 Tabelas do Banco de Dados

- `profiles` - Perfis de usuários
- `categories` - Categorias de produtos
- `products` - Produtos
- `delivery_zones` - Áreas de entrega
- `customers` - Clientes
- `coupons` - Cupons de desconto
- `orders` - Pedidos
- `order_items` - Itens do pedido
- `store_settings` - Configurações da loja
- `business_hours` - Horário de funcionamento
- `whatsapp_templates` - Templates de WhatsApp
- `order_status_logs` - Histórico de status

## 🔒 Segurança (RLS)

Políticas de Row Level Security configuradas:
- Público pode ler categorias, produtos, zonas ativas
- Staff pode gerenciar produtos, categorias, zonas
- Admin pode gerenciar tudo
- Cozinha só pode atualizar status operacionais

## 🚀 Deploy

### Vercel

```bash
npm run build
```

Depois faça deploy da pasta `dist` no Vercel.

### Variáveis de Ambiente no Vercel

Adicione as mesmas variáveis do `.env` nas configurações do projeto no Vercel.

## 📝 Notas Importantes

- O sistema não integra gateway de pagamento
- O cliente escolhe a forma de pagamento no checkout
- Pix e cartão são registrados para confirmação manual
- WhatsApp é via link, não envia mensagem automática
- O atendente clica no botão para abrir WhatsApp com mensagem pronta

## 🛠️ Troubleshooting

### Erro de conexão Supabase
- Verifique as variáveis de ambiente
- Confirme que o projeto Supabase está ativo
- Verifique as políticas RLS

### RLS bloqueando operações
- Verifique se o usuário tem perfil criado
- Confirme que o role está correto
- Revise as políticas no SQL Editor

## 📄 Licença

Projeto desenvolvido para Lanche do 2R.
# Replymesh Store Template

Esta pasta e uma copia isolada do frontend Lanches do 2R para a Fase 12 da Replymesh. O projeto original `M:\temple1` permanece intocado.

## Modo hibrido Rails + Supabase

- Os services Supabase originais continuam no projeto para compatibilidade.
- A camada Rails foi adicionada em paralelo:
  - `src/services/replymeshApi.js`
  - `src/services/publicApi.js`
  - `src/services/storeApi.js`
  - `src/hooks/usePublicMenu.js`
  - `src/hooks/usePublicStoreInfo.js`
- A home publica le informacoes da loja via Rails.
- A pagina publica de menu/cardapio le categorias e produtos via Rails.
- Checkout, pedidos, motoboy e caixa ainda nao foram convertidos.

## Ambiente

Copie `.env.example` para `.env` quando quiser configurar localmente:

```env
VITE_REPLYMESH_API_URL=http://127.0.0.1:3000/api/v1
VITE_COMPANY_SLUG=empresa-teste
```

## Rodar localmente

```powershell
cd "W:\sas replymesh\store-template"
npm install
npm run dev -- --host 127.0.0.1 --port 5174
```

Abrir:

```text
http://127.0.0.1:5174/menu
```

---
