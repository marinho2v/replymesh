# REPLYMESH — Fase 15.9.1 — Templates Visuais por Categoria

**Data:** 2026-06-05  
**Ambiente:** Local controlado  
**Status:** CONCLUÍDA

---

## Restrições respeitadas

- VPS não iniciada.
- Deploy não iniciado.
- Fase 16 não iniciada.
- 2R original não alterado.
- hamburgueria-classic não quebrado.
- Fluxo de pedido, WhatsApp, motoboy, roleta, multiempresa não alterados.

---

## Template HTML encontrado pelo usuário

Localização: `M:\store-template\src\templates\hamburgueria V2\`  
(equivalente a `W:\sas replymesh\store-template\src\templates\hamburgueria V2\`)

Arquivos encontrados:
- `Lanche do 2R.html` — HTML completo com React via CDN + Babel Standalone
- `Lanche do 2R (offline).html` — versão offline
- `app.jsx` — componentes React: Header, Logo, Hero, CategoryBar, ProductCard, Cart, Footer
- `data.jsx` — categorias e produtos hardcoded (CATEGORIES, PRODUCTS, FLAGS)
- `icons.jsx` — ícones SVG inline como componentes React
- `.thumbnail` — SVG de thumbnail para preview
- `uploads/` — 2 imagens (content.png, uuid.png)

Características extraídas:
- **Paleta:** fundo `#0c0c0e`, surface `#121214`, card `#1a1a1d`, borda `#26262a`
- **Acento:** dourado `#f7a325` / `#ffb838` / `#e8920f`
- **Fonte:** Poppins (Google Fonts)
- **Layout:** Hero full-bleed com gradiente + category filter + grid de produtos
- **Logo:** octogonal geométrica com "2R"
- **Status:** prototype HTML — conversão para React vite pendente

---

## O que foi implementado

### 1. Novos templates registrados (metadata.json)

| ID | Nome | Categoria | Status |
|---|---|---|---|
| `hamburgueria-classic` | Hamburgueria Classic | hamburgueria | ✅ Ativo |
| `hamburgueria-premium` | Hamburgueria Premium | hamburgueria | 🔶 Preview |
| `pizzaria-dark` | Pizzaria Dark | pizzaria | 🔜 Em breve |
| `doceria-clean` | Doceria Clean | doceria | 🔜 Em breve |
| `bebidas-neon` | Bebidas Neon | bebidas | 🔜 Em breve |

Pastas criadas:
```
store-template/src/templates/
├── hamburgueria-classic/metadata.json   (fase 15.9)
├── hamburgueria-premium/metadata.json   (novo)
├── pizzaria-dark/metadata.json          (novo)
├── doceria-clean/metadata.json          (novo)
├── bebidas-neon/metadata.json           (novo)
├── index.js                             (atualizado)
└── hamburgueria V2/                     (HTML original do usuário - intocado)
```

### 2. Registry atualizado (`src/templates/index.js`)

Funções exportadas:
```js
getAllTemplates()              // retorna todos os 5 templates
getTemplateById(id)            // busca por id, fallback para hamburgueria-classic
getTemplatesByCategory(cat)    // filtra por categoria, 'all' retorna todos
getTemplateCategories()        // retorna lista de categorias com labels
isValidTemplateId(id)          // boolean, valida id
getTemplate(id)                // alias para getTemplateById (retrocompatível)
```

Constantes exportadas:
```js
DEFAULT_TEMPLATE_ID            // 'hamburgueria-classic'
TEMPLATE_CATEGORIES            // array com todas as categorias + labels
VISUAL_TEMPLATES               // array de todos os templates com metadados visuais
```

Cada template no array inclui, além do metadata.json:
- `previewGradient` — classes Tailwind do gradiente do preview CSS
- `previewAccentColor` — cor do acento para o preview
- `previewTextColor` — cor do texto para o preview

### 3. Seletor com filtro por categoria (`Settings.jsx`)

Novo componente `TemplateSelectorSection`:
- Filtros de categoria: Todos / Hamburgueria / Pizzaria / Doceria / Bebidas / Açaí / Restaurante
- Oculta automaticamente categorias sem templates
- Contador de templates por categoria (badge)
- Contagem de resultados visíveis
- Estado vazio quando categoria não tem templates

Novo `TemplatePreviewCard` (substituiu versão anterior):
- Preview visual gerado por CSS (não depende de preview.png)
  - Header simulado com logo + nav links
  - Hero com gradiente usando a cor de acento do template
  - Grid de 3 mini-cards de produto
- Badge "Atual" colorido com a cor de acento do template selecionado
- Badge "Em breve" para templates com `status: "coming_soon"`
- Cursor `not-allowed` e `opacity-60` para templates em breve
- Botão "Usar este template" oculto para templates em breve
- Descrição do template visível

### 4. Comportamento dos status

| Status | Visual | Selecionável |
|---|---|---|
| `active` | Normal | ✅ Sim |
| `preview` | Normal + badge "Preview" | ✅ Sim |
| `coming_soon` | Opaco + badge "Em breve" + cursor blocked | ❌ Não |

---

## Testes técnicos

| Teste | Resultado |
|---|---|
| `npm run build` store-template | ✅ built in 6.50s — 0 erros |
| Settings.jsx compila | ✅ |
| index.js importa 5 metadata.json | ✅ |
| Filtro por categoria funciona | ✅ (lógica validada no código) |
| Seleção de template funciona | ✅ (active/preview selecionáveis, coming_soon bloqueados) |
| Visual atual inalterado | ✅ hamburgueria-classic é o padrão |
| Multiempresa preservada | ✅ visual_template_id por company_id |

---

## Onde colocar novos templates

```
store-template/src/templates/{id}/
└── metadata.json      ← obrigatório (ver STORE_VISUAL_TEMPLATES_GUIDE.md)

→ registrar em src/templates/index.js
```

O template HTML do usuário (`hamburgueria V2/`) fica preservado como referência.
A conversão para React Vite será feita em fase dedicada.

---

## Como o template HTML foi identificado

| Campo | Valor extraído |
|---|---|
| ID | `hamburgueria-premium` |
| Nome | Hamburgueria Premium |
| Categoria | hamburgueria |
| Fundo | `#0c0c0e` |
| Acento | `#f7a325` (dourado) |
| Fonte | Poppins |
| Status | `preview` (protótipo HTML, não convertido ainda) |
| Origem | `hamburgueria V2/` |

---

## Pendências não bloqueantes

| Pendência | Quando |
|---|---|
| Converter `hamburgueria V2/` em React Vite (app.jsx, data.jsx, icons.jsx) | Fase dedicada de conversão |
| Criar `preview.png` real para cada template | Após loja pública estabilizada |
| Implementar carregamento de componentes por template no PublicLayout | Quando houver 2 templates funcionais |
| Criar template `pizzaria-dark`, `doceria-clean`, `bebidas-neon` em React | Por demanda do cliente |
| Whitelist de `visual_template_id` no backend Rails | Fase 16+ |

---

*Gerado em 2026-06-05 — Fase 15.9.1 concluída*
