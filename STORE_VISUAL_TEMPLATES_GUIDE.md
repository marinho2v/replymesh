# STORE VISUAL TEMPLATES GUIDE

Guia completo para criar, registrar e aplicar templates visuais da loja pública no Replymesh.

**Última atualização:** 2026-06-05 — Fase 15.9.2

---

## O que é um template visual?

Um template visual define a aparência completa da loja pública de uma empresa cliente.
Cada empresa pode escolher um template diferente nas Configurações > Template da loja.
O template muda apenas o visual — pedidos, pagamentos, WhatsApp, motoboy e multiempresa não são afetados.

---

## Templates disponíveis

| ID | Nome | Categoria | Status |
|---|---|---|---|
| `hamburgueria-classic` | Hamburgueria Classic | hamburgueria | ✅ Ativo (padrão) |
| `hamburgueria-premium` | Hamburgueria Premium | hamburgueria | ✅ Ativo (React funcional) |
| `pizzaria-dark` | Pizzaria Dark | pizzaria | 🔜 Em breve |
| `doceria-clean` | Doceria Clean | doceria | 🔜 Em breve |
| `bebidas-neon` | Bebidas Neon | bebidas | 🔜 Em breve |

---

## Estrutura de arquivos

```
store-template/src/templates/
├── index.js                              ← Registro central de todos os templates
├── hamburgueria-classic/
│   └── metadata.json                     ← Metadados do template
├── hamburgueria-premium/
│   ├── metadata.json
│   ├── icons.jsx
│   ├── styles.css
│   └── components/
│       ├── PremiumHeader.jsx
│       ├── PremiumHome.jsx
│       ├── PremiumHero.jsx
│       ├── PremiumMenuSection.jsx
│       ├── PremiumProductCard.jsx
│       └── PremiumFooter.jsx
├── pizzaria-dark/
│   └── metadata.json
├── doceria-clean/
│   └── metadata.json
├── bebidas-neon/
│   └── metadata.json
└── hamburgueria V2/                      ← HTML/JSX prototype (referência, não usar no Vite)
    ├── app.jsx
    ├── data.jsx
    ├── icons.jsx
    └── Lanche do 2R.html

store-template/public/templates/
└── {template-id}/
    └── preview.png                       ← Screenshot 800×450px (opcional)
```

---

## Arquivos obrigatórios por template

### `metadata.json`

```json
{
  "id": "pizzaria-dark",
  "name": "Pizzaria Dark",
  "category": "pizzaria",
  "description": "Template escuro com acento vermelho intenso.",
  "preview": "/templates/pizzaria-dark/preview.png",
  "version": "1.0",
  "status": "active",
  "colors": {
    "background": "#100810",
    "surface": "#180a18",
    "card": "#200c20",
    "border": "#3d1a1a",
    "accent": "#DC2626",
    "accentHover": "#EF4444",
    "text": "#F9FAFB",
    "textMuted": "#9CA3AF",
    "green": "#22C55E"
  },
  "fonts": {
    "primary": "Poppins"
  },
  "features": {
    "darkMode": true,
    "showBanner": true,
    "compactMenu": false,
    "showRoleta": true,
    "heroFullBleed": true,
    "goldAccent": false
  }
}
```

**Campos obrigatórios:**
- `id` — kebab-case único, sem espaços. Ex: `pizzaria-dark`
- `name` — nome exibido no painel admin
- `category` — hamburgueria | pizzaria | doceria | bebidas | acai | restaurante
- `description` — descrição exibida no painel
- `version` — "1.0"
- `status` — `active` | `preview` | `coming_soon`

**Campos opcionais mas recomendados:**
- `colors` — paleta completa do template
- `fonts.primary` — fonte principal (deve ser uma Google Font)
- `features` — boolean flags do template
- `preview` — path para imagem 800×450px
- `sourceFiles` — pasta de referência do protótipo original

---

## Como registrar um novo template em `index.js`

```js
// 1. Importar o metadata
import novoTemplateMeta from './novo-template/metadata.json'

// 2. Adicionar no array VISUAL_TEMPLATES
export const VISUAL_TEMPLATES = [
  // ... templates existentes ...
  {
    ...novoTemplateMeta,
    previewGradient: 'from-[#100810] via-[#200c20] to-[#3d1a1a]',  // gradiente do preview CSS
    previewAccentColor: '#DC2626',    // cor de destaque no preview
    previewTextColor: '#F9FAFB',      // cor do texto no preview
  },
]
```

`previewGradient`, `previewAccentColor` e `previewTextColor` são usados para gerar o preview CSS visual no painel admin, enquanto não houver um `preview.png`.

---

## Funções do registry

```js
import {
  getAllTemplates,          // retorna todos os templates
  getTemplateById,          // getTemplateById('pizzaria-dark') → template | default
  getTemplatesByCategory,   // getTemplatesByCategory('pizzaria') → array
  getTemplateCategories,    // retorna todas as categorias com labels
  isValidTemplateId,        // isValidTemplateId('foo') → boolean
  DEFAULT_TEMPLATE_ID,      // 'hamburgueria-classic'
  VISUAL_TEMPLATES,         // array completo
  TEMPLATE_CATEGORIES,      // array de { id, label }
} from '../templates'
```

---

## Como converter um template HTML/CSS/JS para React (Vite)

### Quando usar este processo

Use quando você tiver um protótipo em HTML que:
- Usa React via CDN + Babel Standalone (`app.jsx`, `data.jsx`, etc.)
- Usa CSS inline ou `<style>` no HTML
- Tem dados hardcoded (produtos, categorias, preços)

### Passo 1 — Extrair a paleta de cores do CSS

No arquivo HTML, procure o bloco `:root { ... }`:

```css
:root {
  --bg: #0c0c0e;           → background
  --card: #1a1a1d;         → card
  --line: #26262a;         → border
  --gold: #f7a325;         → accent
  --text: #f4f3f1;         → text
  --muted: #9a9aa0;        → textMuted
  --green: #1fbf5a;        → green
}
```

Preencha o `colors` no `metadata.json` com esses valores.

### Passo 2 — Criar a pasta do template

```
store-template/src/templates/{id}/
├── metadata.json                       ← obrigatório
└── components/                         ← opcional, para quando implementar em React
    ├── HomeTemplate.jsx
    ├── MenuTemplate.jsx
    ├── ProductTemplate.jsx
    ├── CartTemplate.jsx
    ├── CheckoutTemplate.jsx
    ├── SuccessTemplate.jsx
    └── WheelTemplate.jsx
```

### Passo 3 — Converter HTML → JSX

| HTML | JSX |
|---|---|
| `class="..."` | `className="..."` |
| `onclick={...}` | `onClick={...}` |
| `style="color:red"` | `style={{ color: 'red' }}` |
| `<img src="...">` | `<img src="..." />` |
| `for="..."` | `htmlFor="..."` |
| `<!-- comentário -->` | `{/* comentário */}` |

**Não usar:**
- `document.querySelector` / `document.getElementById`
- `window.addEventListener` direto (usar `useEffect`)
- Variáveis globais via `window.XXX = ...`

**Usar em vez disso:**
- `useState`, `useEffect`, `useRef` do React
- Contextos do Replymesh para dados

### Passo 4 — Substituir dados hardcoded pelos dados reais

| Dado hardcoded | Fonte real no Replymesh |
|---|---|
| Nome da loja (`"Lanche do 2R"`) | `store.store_name` via `usePublicStoreInfo()` |
| Logo | `store.logo_url` |
| Telefone / WhatsApp | `store.whatsapp_number` |
| Endereço | `store.address` |
| Categorias | `useCategories()` hook |
| Produtos | `useProducts()` hook |
| Preço | `product.price` / `price_cents / 100` |
| Imagem do produto | `product.image_url` (pode ser null) |
| Status da loja | `store.store_status` |
| Horário | `businessHours` via `usePublicStoreInfo()` |
| Carrinho | `useCart()` contexto |
| Cupons | API pública de cupons |
| Roleta | API pública da roleta |

```jsx
// Exemplo de substituição correta:

// ❌ ERRADO — dado hardcoded
function Logo() {
  return <span>Lanche do 2R</span>
}

// ✅ CORRETO — dado da API
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'

function Logo() {
  const { store } = usePublicStoreInfo()
  return <span>{store?.store_name || 'Minha Loja'}</span>
}
```

### Passo 5 — Usar o contexto de template

```jsx
import { useStoreTemplate } from '../../contexts/StoreTemplateContext'

function MyComponent() {
  const { template } = useStoreTemplate()

  return (
    <div style={{ backgroundColor: template.colors.background }}>
      <span style={{ color: template.colors.accent }}>
        {/* conteúdo */}
      </span>
    </div>
  )
}
```

### Passo 6 — Registrar e testar

1. Adicionar em `index.js`
2. Rodar `npm run build` — deve passar sem erros
3. Selecionar o template nas Configurações
4. Abrir a loja pública e validar

---

## Como criar um preview real

1. Selecione o template nas Configurações
2. Abra a loja pública em `localhost:5173/loja/{slug}`
3. Tire screenshot em 800×450px (usar DevTools > Device Toolbar)
4. Salve em `public/templates/{id}/preview.png`
5. O campo `"preview"` no `metadata.json` já aponta para esse path

---

## Campo no banco de dados

Campo: `store_settings.visual_template_id`  
Tipo: `string`, NOT NULL, default: `hamburgueria-classic`  
Isolamento: por `company_id`  
Migration: `20260605160000_add_visual_template_to_store_settings.rb`

---

## Fluxo completo de seleção

```
Admin > Configurações > Template da loja
  → filtrar por categoria (Todos / Hamburgueria / Pizzaria / ...)
  → clicar em "Usar este template"
  → clicar em "Salvar configurações"
  → PUT /api/v1/company/settings { visual_template_id: "..." }
  → Rails salva em store_settings por company_id
  → GET /api/v1/public/:slug/store retorna visual_template_id
  → PublicLayout > StoreTemplateProvider > useStoreTemplate()
  → componentes públicos consomem template.colors, template.features, etc.
```

---

## Convenção de nomenclatura

| Tipo | Formato | Exemplo |
|---|---|---|
| ID do template | kebab-case | `pizzaria-dark` |
| Pasta | igual ao ID | `src/templates/pizzaria-dark/` |
| Nome exibido | Title Case | `Pizzaria Dark` |
| Categoria | lowercase | `pizzaria` |
| Status | snake_case | `active`, `preview`, `coming_soon` |

---

## Categorias disponíveis

| ID | Label exibido |
|---|---|
| `hamburgueria` | Hamburgueria |
| `pizzaria` | Pizzaria |
| `doceria` | Doceria |
| `bebidas` | Bebidas |
| `acai` | Açaí |
| `restaurante` | Restaurante |

Para adicionar nova categoria: edite `TEMPLATE_CATEGORIES` em `src/templates/index.js`.

---

## Controles visuais do template premium

O template `hamburgueria-premium` possui controles por loja em `store_settings`:

| Campo | Uso |
|---|---|
| `hero_image_url` | Imagem principal do hero. |
| `hero_image_position` | Posicao da imagem: `center`, `top`, `bottom`, `left`, `right`. |
| `hero_image_zoom` | Zoom visual da imagem, recomendado entre 80 e 160. |
| `hero_overlay_opacity` | Escurecimento do hero, recomendado entre 0 e 90. |
| `hero_height` | Altura do hero em pixels, recomendado entre 360 e 760. |
| `theme_primary_color` | Cor primaria/acento do template. |

Esses campos sao editados em:

`/loja/:slug/admin/settings` > Identidade visual.

Regras:

- Se `hero_image_url` estiver vazio, usar `banner_url`, depois `cover_url`, depois fallback local.
- Se `theme_primary_color` estiver vazio, usar `primary_color`, depois fallback do template.
- O frontend nunca deve hardcodar imagem/cor de uma loja especifica.

---

## Próximos templates planejados

| ID | Nome | Categoria | Origem |
|---|---|---|---|
| `hamburgueria-classic` | Hamburgueria Classic | hamburgueria | ✅ Ativo |
| `hamburgueria-premium` | Hamburgueria Premium | hamburgueria | ✅ React funcional baseado em `hamburgueria V2/` |
| `pizzaria-dark` | Pizzaria Dark | pizzaria | 🔜 Criar do zero |
| `doceria-clean` | Doceria Clean | doceria | 🔜 Criar do zero |
| `bebidas-neon` | Bebidas Neon | bebidas | 🔜 Criar do zero |
| `acai-fresh` | Açaí Fresh | acai | 🔜 Criar do zero |
| `restaurante-premium` | Restaurante Premium | restaurante | 🔜 Criar do zero |

---

*Última atualização: 2026-06-05 — Fase 15.9.2*
