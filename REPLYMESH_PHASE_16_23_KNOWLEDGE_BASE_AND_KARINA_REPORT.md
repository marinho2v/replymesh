# REPLYMESH FASE 16.23 — Central de Ajuda + RAG Karina + Termos Legais

**Data:** 2026-06-12  
**Versão:** v0.15.39 RC1  
**Status:** ✅ CONCLUÍDA

---

## 1. Resumo Executivo

A Fase 16.23 transformou o ReplyMesh em uma **plataforma autoexplicativa**. O usuário agora consegue:
- Aprender o sistema sozinho pela Central de Ajuda
- Pesquisar dúvidas com busca full-text
- Receber respostas contextualizadas da assistente Karina (RAG)
- Acessar Termos de Uso e Política de Privacidade (LGPD)

---

## 2. Auditoria de Funcionalidades

**Arquivo criado:** `REPLYMESH_FEATURE_MAP.md`

Mapeadas **21 categorias** de funcionalidades com status, plano e roles:
- Dashboard, Pedidos, Mesas, Produtos, Estoque, Caixa, PDV
- Relatórios, WhatsApp, Marketing, Recuperador, Cupons, Roleta
- Motoboys, App Android, Garçom, Configurações, Usuários, Integrações
- Central de Ajuda (novo), Páginas Legais (novo)

**Feature gates documentados:** 10 gates mapeados por plano (START/PRO)

---

## 3. Central de Ajuda

**Arquivo:** `store-template/src/pages/admin/Help.jsx`  
**Rota:** `/admin/help`  
**Roles permitidos:** admin, cashier, attendant (não público)

### Funcionalidades implementadas:
- Sidebar com **17 tópicos** navegáveis com ícones
- Conteúdo renderizado por tópico com seções e passo a passo
- Busca full-text em tempo real (títulos, seções, FAQ)
- Resultados com destaque do tópico origem
- Responsivo — sidebar mobile com overlay
- **Menu item "Ajuda"** adicionado no AdminLayout (`BookOpen` icon)

### Tópicos disponíveis:
| # | Tópico | Seções | FAQs |
|---|--------|--------|------|
| 1 | Introdução ao ReplyMesh | 3 | 3 |
| 2 | Primeiros Passos | 2 | 2 |
| 3 | Dashboard | 2 | 2 |
| 4 | Pedidos | 4 | 3 |
| 5 | Gestão de Mesas | 4 | 3 |
| 6 | Controle de Estoque | 3 | 2 |
| 7 | Caixa | 4 | 3 |
| 8 | PDV / Balcão | 5 | 4 |
| 9 | Motoboys | 4 | 2 |
| 10 | WhatsApp | 4 | 4 |
| 11 | Marketing WhatsApp | 2 | 2 |
| 12 | Recuperador de Vendas | 2 | 2 |
| 13 | Cupons de Desconto | 2 | 2 |
| 14 | Roleta de Prêmios | 2 | 2 |
| 15 | Relatórios | 2 | 2 |
| 16 | Configurações | 2 | 2 |
| 17 | Usuários e Permissões | 2 | 2 |

**Total:** 49 seções de conteúdo, 41 FAQs

---

## 4. Base de Conhecimento

### Arquivo JS (usado pelo RAG):
**`store-template/src/knowledge_base/index.js`**
- 17 entradas com: title, keywords[], description, sections[], faq[]
- `searchKnowledge(query)` — busca por similaridade de keywords
- `buildKarinaContext(query)` — formata contexto para envio ao backend da IA

### Arquivos Markdown (documentação):
```
store-template/src/knowledge_base/
├── index.js          ← módulo JS (RAG)
├── dashboard.md
├── pedidos.md
├── mesas.md
├── estoque.md
├── caixa.md
├── pdv.md
├── motoboy.md
├── whatsapp.md
├── marketing.md
├── relatorios.md
└── configuracoes.md
```

Cada arquivo contém: descrição, funcionalidades, fluxo, exemplos, dúvidas frequentes.

---

## 5. RAG da Karina

**Arquivo modificado:** `store-template/src/components/ai/AiFloatingChat.jsx`

### Como funciona:
1. Usuário digita uma pergunta no chat da Karina
2. `buildKarinaContext(pergunta)` busca na knowledge base por correspondência de keywords
3. Se encontrar contexto relevante, a mensagem enviada ao backend é:
   ```
   [Contexto do sistema: {conteúdo do tópico}]
   
   ---
   Pergunta do usuário: {pergunta original}
   ```
4. O backend da IA responde com base no contexto oficial

### Exemplos de correspondência:
| Pergunta | Tópico ativado |
|----------|----------------|
| "Como faço uma venda no PDV?" | PDV / Balcão |
| "Como conectar WhatsApp?" | WhatsApp |
| "Como funciona a roleta?" | Roleta de Prêmios |
| "Como abrir o caixa?" | Caixa |
| "Motoboy não está recebendo pedidos" | Motoboys |
| "Como exportar relatório?" | Relatórios |

### Comportamento da Karina com RAG:
- Responde como especialista ReplyMesh usando documentação oficial
- Não inventa funções inexistentes (contexto limita às features reais)
- Informa quando recurso depende de plano (conteúdo inclui essa info)
- Tom: amigável, objetivo, profissional

---

## 6. FAQ Implementado

FAQs estão distribuídos por tópico na Central de Ajuda (accordion). Cobertos:

| Pergunta | Tópico |
|----------|--------|
| Como conectar WhatsApp | WhatsApp |
| Como criar produto | Primeiros Passos / Configurações |
| Como abrir caixa | Caixa |
| Como usar PDV | PDV / Balcão |
| Como fechar caixa | Caixa |
| Como cadastrar motoboy | Motoboys |
| Como funciona recuperação de vendas | Recuperador |
| Como funciona marketing WhatsApp | Marketing |
| Como gerar relatório | Relatórios |
| Como criar cupom | Cupons |
| Como configurar mesas | Mesas |

---

## 7. Termos de Uso

**Rotas adicionadas:**
- `store-template`: `/termos-de-uso` e `/loja/:slug/termos-de-uso`
- `replymesh-frontend`: `/termos-de-uso`

**Arquivos criados:**
- `store-template/src/pages/public/TermosDeUso.jsx`
- `replymesh-frontend/src/pages/TermosDeUso.jsx`

**Conteúdo (14 seções):**
1. Aceitação dos Termos
2. Descrição do Serviço (SaaS, Delivery, PDV, WhatsApp, Integrações)
3. Cadastro e Conta
4. Uso do Sistema — Delivery e PDV
5. WhatsApp e Comunicações
6. Integrações
7. Planos e Pagamentos
8. Cancelamento
9. Disponibilidade do Sistema (SLA 99,5%)
10. Suporte
11. Propriedade Intelectual
12. Limitação de Responsabilidade
13. Alterações nos Termos
14. Foro e Legislação (Rio de Janeiro - RJ)

---

## 8. Política de Privacidade

**Rotas adicionadas:**
- `store-template`: `/politica-de-privacidade` e `/loja/:slug/politica-de-privacidade`
- `replymesh-frontend`: `/politica-de-privacidade`

**Arquivos criados:**
- `store-template/src/pages/public/PoliticaDePrivacidade.jsx`
- `replymesh-frontend/src/pages/PoliticaDePrivacidade.jsx`

**Conteúdo (14 seções — LGPD compliant):**
1. Introdução (LGPD — Lei 13.709/2018)
2. Quem somos (Controladora x Operadora)
3. Dados Coletados (lojistas, clientes finais, pedidos, WhatsApp)
4. Finalidade do Tratamento
5. Base Legal (art. 7º LGPD)
6. Cookies
7. Compartilhamento de Dados
8. Segurança dos Dados
9. Retenção de Dados
10. Direitos do Titular
11. Encarregado de Dados (DPO)
12. Transferência Internacional
13. Alterações na Política
14. Contato (privacidade@replymesh.com.br)

---

## 9. Landing Page

**Arquivo modificado:** `replymesh-frontend/src/pages/LandingPage.jsx`

| Alteração | Antes | Depois |
|-----------|-------|--------|
| Localização | São Paulo - SP | Rio de Janeiro - RJ |
| Link Termos | `<a href="#">` | `<Link to="/termos-de-uso">` |
| Link Privacidade | `<a href="#">` | `<Link to="/politica-de-privacidade">` |

---

## 10. Arquivos Modificados

### Novos arquivos criados (11):
```
store-template/src/knowledge_base/index.js
store-template/src/knowledge_base/dashboard.md
store-template/src/knowledge_base/pedidos.md
store-template/src/knowledge_base/mesas.md
store-template/src/knowledge_base/estoque.md
store-template/src/knowledge_base/caixa.md
store-template/src/knowledge_base/pdv.md
store-template/src/knowledge_base/motoboy.md
store-template/src/knowledge_base/whatsapp.md
store-template/src/knowledge_base/marketing.md
store-template/src/knowledge_base/relatorios.md
store-template/src/knowledge_base/configuracoes.md
store-template/src/pages/admin/Help.jsx
store-template/src/pages/public/TermosDeUso.jsx
store-template/src/pages/public/PoliticaDePrivacidade.jsx
replymesh-frontend/src/pages/TermosDeUso.jsx
replymesh-frontend/src/pages/PoliticaDePrivacidade.jsx
REPLYMESH_FEATURE_MAP.md
REPLYMESH_PHASE_16_23_KNOWLEDGE_BASE_AND_KARINA_REPORT.md (este arquivo)
```

### Arquivos modificados (6):
```
store-template/src/app/router.jsx           — rotas help + legais + SluggedStaticPage
store-template/src/components/layout/AdminLayout.jsx  — item "Ajuda" no menu
store-template/src/components/ai/AiFloatingChat.jsx   — RAG buildKarinaContext
replymesh-frontend/src/pages/LandingPage.jsx          — RJ + links legais
replymesh-frontend/src/router/routes.jsx              — rotas /termos + /privacidade
REPLYMESH_PHASE_16_21C_PDV_PERMISSIONS_CASHIER_REPORT.md — consolidação atualizada
```

---

## 11. Validações

| Validação | Resultado |
|-----------|-----------|
| `npm run build` — store-template | ✅ 2993 módulos, sem erros |
| `npm run build` — replymesh-frontend | ✅ 1791 módulos, sem erros |
| `git diff --check` — whitespace errors | ✅ Sem erros (só avisos CRLF Windows) |
| Auditoria de segredos | ✅ Nenhum segredo exposto |
| Help.jsx compilado | ✅ `Help-build-20260530-CDB6Cv0T.js` |
| TermosDeUso compilado | ✅ Ambos os projetos |
| PoliticaDePrivacidade compilado | ✅ Ambos os projetos |
| RAG importa knowledge base | ✅ Import confirmado no build |
| Roles da Central de Ajuda | ✅ admin, cashier, attendant |
| Páginas legais são públicas | ✅ Sem ProtectedRoute |

---

## 12. Regras Respeitadas

| Regra | Status |
|-------|--------|
| Não alterar Evolution | ✅ Não tocado |
| Não alterar Mercado Pago | ✅ Não tocado |
| Não alterar Delivery | ✅ Não tocado |
| Não alterar PDV | ✅ Não tocado |
| Não alterar Motoboy | ✅ Não tocado |
| Não alterar IA principal | ✅ Não tocado (só adicionado contexto RAG no frontend) |
| Não alterar Financeiro/Caixa | ✅ Não tocado |
| Não fazer deploy antes dos testes | ✅ Apenas build local validado |
