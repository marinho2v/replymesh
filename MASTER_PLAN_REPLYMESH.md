# MASTER PLAN — Replymesh SaaS

> Documento de arquitetura, decisões técnicas e fluxos do sistema.
> Leia este arquivo no início de cada sessão de desenvolvimento.

---

## 1. Visão Geral

A **Replymesh** é uma plataforma SaaS B2B voltada para o segmento de alimentação: lanchonetes, restaurantes, hamburguerias, pizzarias e delivery. O modelo de negócio é assinatura mensal (MRR).

O **Painel Master** é a interface de controle central usada pelo administrador da Replymesh para:

- Cadastrar e ativar empresas clientes
- Provisionar recursos automaticamente (WhatsApp, domínio, configurações)
- Monitorar saúde das instâncias e serviços
- Gerenciar planos, assinaturas e financeiro
- Visualizar logs, alertas e tickets

Cada empresa cliente recebe acesso ao seu próprio **Painel da Loja** (a ser desenvolvido), onde gerencia cardápio, pedidos, motoboys, clientes e caixa.

---

## 2. Arquitetura Multi-Tenant

### Abordagem escolhida: Banco único com company_id

A Replymesh utiliza **um único banco PostgreSQL** para todos os clientes.
Cada empresa é identificada por um `company_id` presente em todas as tabelas operacionais.

```
replymesh_development (banco único)
├── companies          ← todas as empresas
├── users              ← todos os usuários (master + loja)
├── company_members    ← vínculo usuário ↔ empresa
├── orders             ← pedidos de todas as empresas (company_id obrigatório)
├── products           ← produtos de todas as empresas (company_id obrigatório)
└── ...                ← todas as tabelas com company_id
```

**Por que não um banco por cliente?**
- Operacionalmente mais simples (1 conexão, 1 migração, 1 backup)
- Escalável para centenas de clientes sem overhead de conexões
- Facilita relatórios consolidados no Painel Master

**Isolamento garantido por:**
- Todos os controllers de loja filtram por `current_company`
- Policies (Pundit ou CanCanCan) verificam `company_id`
- O `super_admin` (Admin Master) acessa tudo via scope especial

### Exemplo de isolamento

```ruby
# Controller da loja — SEMPRE filtra por company
def index
  @orders = current_company.orders.recent
end

# Controller master — acessa qualquer empresa
def index
  @companies = Company.all
end
```

---

## 3. Roles e Permissões

### global_role (campo em users)

| Role         | Acesso                                      |
|--------------|---------------------------------------------|
| `super_admin`| Painel Master completo — acessa tudo        |
| `user`       | Somente o Painel da Loja da sua empresa     |

### role (campo em company_members)

| Role             | Acesso no Painel da Loja          |
|------------------|-----------------------------------|
| `store_admin`    | Administrador da loja — tudo      |
| `employee`       | Atendente — pedidos e cardápio    |
| `kitchen`        | Cozinha — visualiza pedidos       |
| `motoboy`        | App motoboy — suas entregas       |
| `support_viewer` | Suporte — somente leitura         |

---

## 4. Stack Técnica — Decisões

### Backend: Ruby on Rails (API mode)

- **Por quê Rails?** Produtividade, convenções maduras, ActiveRecord robusto, ecossistema rico
- `--api` mode: sem assets, sem views, resposta JSON pura
- Autenticação: JWT via gem `jwt` (sem Devise inicialmente)
- Autorização: Pundit (policies por recurso)
- Jobs: Sidekiq + Redis (onboarding assíncrono se necessário)
- Testes: RSpec + FactoryBot

### Nota: Drive M: (desenvolvimento local)

O caminho `W:\sas replymesh` contém um espaço que causa falha na compilação de gems nativas Ruby. A solução é mapear o projeto para o drive `M:` sem espaço:

```powershell
subst M: "W:\sas replymesh"
```

Execute `tools\mount-m-drive.ps1` ao iniciar cada sessão de desenvolvimento, ou adicione ao startup do Windows para persistência automática. O Rails e as gems são instalados via `M:\tools\ruby\bin`.

---

### Frontend: React 18 + Vite

- **Por quê Vite?** Build rápido, HMR eficiente, suporte nativo a ESM
- **Por quê não Next.js?** Painel admin não precisa de SSR; React SPA é suficiente
- CSS: arquivo único extraído do protótipo (sem Tailwind, sem CSS Modules por enquanto)
- Roteamento: React Router v6 (substituindo hash routing do protótipo)
- State: useState/useContext (sem Redux enquanto a complexidade permitir)
- HTTP: fetch nativo ou axios para chamadas à API

### Banco: PostgreSQL

- Versão mínima: 15
- Tipos usados: `text`, `integer`, `bigint`, `boolean`, `jsonb`, `timestamptz`, `enum`
- Valores monetários: sempre em **centavos** (`price_cents`) para evitar ponto flutuante

---

## 5. Fluxo de Criação de Empresa

Ao submeter o formulário "Nova Empresa", o backend executa tudo dentro de uma **transaction**:

```
POST /api/v1/master/companies
         │
         ▼
CompanyOnboardingService.call(params)
         │
         ├─ 1. Validar slug único
         ├─ 2. Validar e-mail único
         │
         └─ ActiveRecord::Base.transaction do
               3.  Criar Company
               4.  Criar User (admin da loja)
               5.  Criar CompanyMember (user → company, role: store_admin)
               6.  Criar Subscription (vincula ao Plan selecionado)
               7.  Criar StoreSetting (configurações padrão)
               8.  Criar Domain (subdomínio .replymesh.cloud)
               9.  Criar PaymentMethods padrão (dinheiro, pix, cartão)
               10. Criar WhatsappTemplates padrão (clonar templates globais)
               11. [Opcional] Criar WhatsappInstance (chamar EvolutionGoClient)
               12. [Opcional] Criar categorias padrão
               13. Criar ActivityLog (ação: company_created)
               14. [Em falha] Criar SystemAlert e fazer rollback
            end
         │
         ▼
    Retornar JSON com empresa criada
```

**Se qualquer etapa crítica (3–10) falhar → rollback total.**
As etapas opcionais (11, 12) têm tratamento de erro isolado — falha não cancela o onboarding.

---

## 6. Endpoint Principal

### POST /api/v1/master/companies

**Payload:**
```json
{
  "company": {
    "name": "Pizzaria do João",
    "slug": "pizzariadojoao",
    "responsible_name": "João Silva",
    "responsible_email": "joao@email.com",
    "responsible_phone": "21999999999",
    "document_number": "00000000000",
    "plan_slug": "profissional",
    "status": "trial",
    "admin_password": "senha_segura"
  },
  "options": {
    "create_whatsapp_instance": true,
    "create_default_settings": true,
    "create_default_templates": true,
    "create_default_payment_methods": true,
    "create_default_categories": false,
    "enable_public_site": true,
    "enable_admin_panel": true,
    "enable_motoboy_area": false,
    "enable_customer_app": false,
    "enable_motoboy_app": false
  }
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "company": {
    "id": 2,
    "name": "Pizzaria do João",
    "slug": "pizzariadojoao",
    "subdomain": "pizzariadojoao.replymesh.cloud",
    "status": "trial"
  },
  "admin_user": {
    "id": 10,
    "email": "joao@email.com"
  },
  "created_resources": {
    "store_settings": true,
    "subscription": true,
    "domain": true,
    "whatsapp_instance": true,
    "whatsapp_templates": true,
    "payment_methods": true,
    "categories": false
  }
}
```

**Resposta (422 Unprocessable Entity):**
```json
{
  "success": false,
  "errors": ["Slug já está em uso", "E-mail já cadastrado"]
}
```

---

## 7. Integração Evolution Go (WhatsApp)

A Evolution Go é a plataforma de API WhatsApp utilizada.

**Regras obrigatórias:**
- A API Key da Evolution Go **nunca** é exposta no frontend
- Todas as chamadas à Evolution Go são feitas pelo backend Rails
- O frontend recebe apenas o QR Code (base64) e o status da instância

### Service EvolutionGoClient

```ruby
# app/services/evolution_go_client.rb
class EvolutionGoClient
  def initialize(base_url:, api_key:)

  def test_connection      # GET /instance/fetchInstances
  def list_instances       # GET /instance/fetchInstances
  def create_instance(name) # POST /instance/create
  def get_qr_code(name)    # GET /instance/connect/{name}
  def get_status(name)     # GET /instance/connectionState/{name}
  def disconnect(name)     # DELETE /instance/logout/{name}
  def restart(name)        # PUT /instance/restart/{name}
end
```

**Modo mock:** Se `EVOLUTION_GO_BASE_URL` não estiver configurado, o service retorna dados simulados — útil para desenvolvimento sem Evolution Go rodando.

---

## 8. Protótipo Visual → React/Vite

### Arquivos do protótipo (referência, não alterar)

| Arquivo          | Conteúdo                                      |
|------------------|-----------------------------------------------|
| `index.html`     | CSS inline completo + carrega os .jsx         |
| `shell.jsx`      | Sidebar, Topbar, roteamento por hash, App()   |
| `lib.jsx`        | Badge, Switch, Avatar, LineChart, Donut, utils|
| `dashboard.jsx`  | Página Visão Geral                            |
| `empresas.jsx`   | Lista de empresas + formulário Nova Empresa   |
| `whatsapp.jsx`   | Instâncias, QR Code, Templates, Logs          |

### Mapeamento protótipo → React/Vite

```
shell.jsx → Sidebar.jsx + Topbar.jsx + AppLayout.jsx + routes.jsx
lib.jsx   → Badge.jsx + Switch.jsx + CoAvatar.jsx + LineChart.jsx + Donut.jsx + utils.js
dashboard.jsx → Dashboard.jsx (+ StatCard.jsx extraído)
empresas.jsx  → EmpresasList.jsx + NovaEmpresa.jsx
whatsapp.jsx  → WAInstances.jsx + WAQrCode.jsx + WATemplates.jsx + WALogs.jsx
<style> em index.html → src/styles/main.css (cópia fiel)
```

### Regras da conversão

1. Preservar 100% das classes CSS (`.page`, `.card`, `.badge`, `.tbl`, `.toolbar`, `.seg` etc.)
2. Preservar as CSS variables (`:root { --sidebar, --bg, --green... }`)
3. Substituir hash routing por React Router v6 (`/`, `/empresas`, `/empresas/nova`)
4. Instalar via npm: `react`, `react-dom`, `react-router-dom`, `lucide-react`
5. Fontes Geist: manter via Google Fonts CDN ou instalar `@fontsource/geist`
6. Manter dados mock como `useState` até ter API real
7. Sidebar colapsável: manter comportamento idêntico ao protótipo

---

## 9. Planos Padrão

| Slug          | Nome           | Preço/mês   | Ciclo   |
|---------------|----------------|-------------|---------|
| `essencial`   | Essencial       | R$ 300,00   | mensal  |
| `profissional`| Profissional    | R$ 500,00   | mensal  |
| `premium_ia`  | Premium IA      | Sob consulta| mensal  |

Criados via `db/seeds.rb`.

---

## 10. Templates WhatsApp Padrão

Criados globalmente (sem `company_id`) e copiados para cada empresa no onboarding:

| template_key          | Título                    |
|-----------------------|---------------------------|
| `pedido_recebido`     | Pedido Recebido           |
| `pedido_aceito`       | Pedido Aceito             |
| `pedido_cancelado`    | Pedido Cancelado          |
| `saiu_para_entrega`   | Saiu para Entrega         |
| `pedido_finalizado`   | Pedido Finalizado         |
| `marketing`           | Mensagem de Marketing     |

---

## 11. Regras de Segurança

1. Toda tabela operacional tem `company_id` com FK e índice
2. Nenhuma empresa acessa dados de outra (escopo no ActiveRecord)
3. O `super_admin` tem acesso irrestrito via scope especial
4. API Key da Evolution Go fica somente no `.env` — nunca no frontend
5. Senhas armazenadas com `bcrypt` (`has_secure_password`)
6. JWT tokens têm expiração configurável (padrão: 24h)
7. CORS configurado para aceitar apenas origens conhecidas
8. Índices em: todos os `company_id`, `slug`, `email`, `domain`, `status`

---

## 12. Tabelas Futuras (não implementar agora)

Após o Painel Master estar funcional, serão adicionadas:

- `categories` — categorias do cardápio
- `products` — produtos
- `customers` — clientes da loja
- `customer_addresses` — endereços dos clientes
- `orders` — pedidos
- `order_items` — itens dos pedidos
- `motoboys` — entregadores
- `delivery_history` — histórico de entregas
- `inventory_items` / `inventory_movements` — estoque
- `cash_sessions` / `cash_movements` — caixa
- `coupons` — cupons de desconto
- `dining_tables` — mesas (dine-in)
- `app_banners` — banners do app

**Todas com `company_id` obrigatório.**

---

## 13. Referência: Sistema Lanches do 2R

O sistema Lanches do 2R será usado apenas como referência de funcionalidades futuras.

- **Não alterar** nenhum arquivo do 2R
- **Não importar** código do 2R para a Replymesh agora
- **Não alterar** o banco/Supabase do 2R
- Fase 9 do Roadmap define o plano de migração (somente análise, não execução)
