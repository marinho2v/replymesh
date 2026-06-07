# REPLYMESH - Fase 15.9.2 - Hamburgueria Premium React Funcional

**Data:** 2026-06-05  
**Ambiente:** Local controlado  
**Status:** CONCLUIDA

---

## Escopo

Converter o template visual `hamburgueria V2` para React/Vite funcional dentro do `store-template`, mantendo a loja conectada aos dados Rails e preservando o template classico.

Nao foi iniciado:

- VPS/deploy.
- Fase 16.
- Pagamento online.
- IA.
- Flutter.
- Alteracoes no 2R original.
- Alteracoes em Supabase.

---

## Arquivos originais analisados

Pasta de referencia preservada:

`M:\store-template\src\templates\hamburgueria V2\`

Arquivos usados como referencia:

- `app.jsx` - estrutura visual: Header, Hero, CategoryBar, ProductCard, CartDrawer, Footer.
- `data.jsx` - dados hardcoded usados apenas para entender categorias/produtos do prototipo.
- `icons.jsx` - icones SVG inline.
- `Lanche do 2R (offline).html` - HTML completo offline.
- `uploads/content.png` e imagem UUID - assets de referencia visual.
- `.thumbnail` - thumbnail de referencia.

A pasta original nao foi modificada.

---

## Arquivos React criados/alterados

Criados em `store-template/src/templates/hamburgueria-premium/`:

- `icons.jsx`
- `styles.css`
- `components/PremiumHeader.jsx`
- `components/PremiumHome.jsx`
- `components/PremiumHero.jsx`
- `components/PremiumMenuSection.jsx`
- `components/PremiumProductCard.jsx`
- `components/PremiumFooter.jsx`

Alterados:

- `store-template/src/components/layout/PublicLayout.jsx`
- `store-template/src/pages/public/Home.jsx`
- `store-template/src/pages/public/Menu.jsx`
- `store-template/src/pages/public/ProductDetails.jsx`
- `store-template/src/templates/hamburgueria-premium/metadata.json`
- `store-template/src/templates/index.js`
- `ROADMAP_REPLYMESH.md`
- `README.md`
- `STORE_TEMPLATE_PLAN.md`
- `STORE_VISUAL_TEMPLATES_GUIDE.md`

Removido:

- `store-template/src/templates/hamburgueria-premium/icons.js`

Motivo: continha JSX com extensao `.js`, causando erro no Vite. O arquivo correto e `icons.jsx`.

---

## Dados Rails conectados

O template premium usa dados reais vindos dos hooks e services ja existentes:

- Loja:
  - nome
  - logo
  - banner/capa
  - WhatsApp
  - status aberto/fechado
  - horarios
- Cardapio:
  - categorias Rails
  - produtos Rails
  - imagem
  - descricao
  - preco
  - preco promocional
  - destaque/promocao
  - status ativo
- Carrinho:
  - adicionar produto
  - incrementar quantidade
  - reduzir/remover quantidade
  - contador do carrinho no header/FAB

Nao ficaram hardcoded:

- nome da loja
- telefone
- produtos
- precos
- categorias
- logo/banner

---

## Rotas cobertas

Quando `visual_template_id = hamburgueria-premium`:

- `/loja/:slug`
- `/loja/:slug/menu`
- `/loja/:slug/products/:id`

Quando `visual_template_id = hamburgueria-classic`, o visual antigo continua sendo usado.

---

## Testes executados

- `npm run build` em `W:\sas replymesh\store-template`: OK.
- Browser local:
  - `/loja/demohamburgueria/admin/settings`: selecionado `Hamburgueria Premium` e salvo com sucesso.
  - `/loja/demohamburgueria`: carregou header, hero premium, status da loja, categorias e produtos Rails.
  - `/loja/demohamburgueria/menu`: carregou menu premium com produtos reais Rails.
  - Produto adicionado ao carrinho pelo template premium: OK.
  - `Hamburgueria Classic` restaurado e salvo novamente.
  - `/loja/demohamburgueria`: voltou ao visual classico.
  - Item de teste removido do carrinho local.

Resultado:

- Vite compilou sem erros.
- Componentes premium foram gerados em chunks separados.
- O erro de `icons.js` com JSX foi corrigido.
- Troca visual por `visual_template_id` funcionou no fluxo real de Configuracoes.
- Carrinho continuou funcionando.

---

## Pendencias restantes

- Criar `preview.png` real do template premium depois da validacao visual.
- Se necessario, expandir o premium para carrinho/checkout/roleta com componentes especificos. Hoje esses fluxos continuam preservados no visual base.

---

## Proxima recomendacao

Validar no navegador:

1. Abrir `/loja/demohamburgueria/admin/settings`.
2. Selecionar `Hamburgueria Premium`.
3. Salvar.
4. Abrir `/loja/demohamburgueria`.
5. Abrir `/loja/demohamburgueria/menu`.
6. Adicionar produto ao carrinho.
7. Abrir produto em `/loja/demohamburgueria/products/:id`.
8. Voltar para `Hamburgueria Classic` e confirmar que o visual antigo retorna.

Fase 16 continua pendente e depende de confirmacao explicita.
