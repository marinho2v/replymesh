# Guia de Configuração Rápida - Lanche do 2R

## ✅ O que já foi feito

- ✅ Estrutura completa do projeto criada
- ✅ Todas as dependências instaladas
- ✅ Schema SQL completo criado (supabase-schema.sql)
- ✅ Todas as páginas implementadas
- ✅ Todos os serviços criados
- ✅ Autenticação configurada
- ✅ Painel admin completo
- ✅ Painel cozinha com realtime
- ✅ Integração WhatsApp Web
- ✅ Tema dark premium

## 🔧 Próximos Passos (O que você precisa fazer)

### 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha organização e região
4. Defina senha do banco
5. Aguarde criação (2-3 minutos)

### 2. Copiar Credenciais

No seu projeto Supabase:
1. Vá em Settings > API
2. Copie **Project URL**
3. Copie **anon public key**

### 3. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 4. Aplicar Schema SQL

1. No Supabase, vá em SQL Editor
2. Abra o arquivo `supabase-schema.sql` deste projeto
3. Copie TODO o conteúdo
4. Cole no SQL Editor do Supabase
5. Clique em "Run" para executar
6. Isso criará todas as tabelas, índices, RLS e dados iniciais

### 5. Criar Usuário Admin

**Opção A - Via Interface do Supabase:**

1. No Supabase, vá em Authentication > Users
2. Clique em "Add user"
3. Email: admin@lanchedo2r.com (ou seu email)
4. Senha: defina uma senha
5. Clique em "Auto Confirm User"
6. Copie o User ID

**Opção B - Via SQL:**

No SQL Editor do Supabase, execute:

```sql
-- Primeiro crie o usuário via Authentication > Users
-- Depois execute este SQL para definir como admin:

insert into public.profiles (id, full_name, email, role, is_active)
values (
  'COLE_O_USER_ID_AQUI',
  'Administrador',
  'admin@lanchedo2r.com',
  'admin',
  true
);
```

### 6. Executar o Projeto

```bash
npm run dev
```

Acesse:
- **Site**: http://localhost:5173
- **Admin**: http://localhost:5173/login

### 7. Primeiro Acesso

1. Faça login em http://localhost:5173/login
2. Vá em Configurações
3. Configure:
   - Nome da loja
   - WhatsApp
   - Horário de funcionamento
   - Taxas de entrega
4. Vá em Áreas de Entrega e configure seus bairros
5. Vá em Produtos e edite/adicione seus produtos

## 📱 Testar o Fluxo

1. Acesse a home pública
2. Navegue pelo cardápio
3. Adicione itens ao carrinho
4. Vá para checkout
5. Preencha dados (teste com CEP real)
6. Finalize pedido
7. Acesse o painel admin
8. Veja o pedido na lista
9. Abra o detalhe e envie WhatsApp
10. Acesse o painel cozinha (crie user kitchen)
11. Atualize status do pedido

## 🎨 Personalizar

### Cores

Edite `tailwind.config.js` para mudar a cor primária.

### Logo

Configure nas Configurações do admin ou edite `src/components/layout/PublicLayout.jsx`.

### Templates WhatsApp

Vá em Templates WhatsApp no painel admin e personalize as mensagens.

## 🚀 Deploy

### Vercel

1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Configure variáveis de ambiente no painel do Vercel

### Netlify

1. Execute: `npm run build`
2. Arraste a pasta `dist` para o Netlify
3. Configure variáveis de ambiente

## 🐛 Problemas Comuns

### Erro de conexão Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme que o projeto Supabase está ativo (não pausado)

### RLS bloqueando
- Verifique se criou o perfil do usuário admin
- Confirme que o role está correto na tabela profiles

### WhatsApp não abre
- Verifique se o número está formatado corretamente
- Confirme que o template está configurado

## 📞 Suporte

Se tiver problemas:
1. Verifique o console do navegador
2. Verifique os logs no Supabase (Database > Logs)
3. Revise as políticas RLS no SQL Editor

## ✨ Pronto!

Seu sistema Lanche do 2R está pronto para uso!
