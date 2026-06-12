# REPLYMESH — MAPA DE FUNCIONALIDADES

**Data:** 2026-06-12  
**Versão:** v0.15.38  
**Fase:** 16.23 — Central de Ajuda + Base de Conhecimento

---

## 1. DASHBOARD

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Visão geral do dia (pedidos, faturamento) | ✅ | Todos | admin, cashier |
| Gráfico de vendas por período | ✅ | Todos | admin, cashier |
| Top produtos vendidos | ✅ | Todos | admin, cashier |
| Clientes recentes | ✅ | Todos | admin, cashier |
| Alertas de pedidos pendentes | ✅ | Todos | admin, cashier |

---

## 2. PEDIDOS

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Listagem de pedidos em tempo real | ✅ | Todos | admin, attendant, cashier |
| Filtros por status, tipo, data, pagamento | ✅ | Todos | admin, attendant, cashier |
| Confirmar / cancelar pedido | ✅ | Todos | admin, attendant |
| Atualização de status step-by-step | ✅ | Todos | admin, attendant |
| Detalhes do cliente e endereço | ✅ | Todos | admin, attendant, cashier |
| Impressão de pedido | ✅ | Todos | admin, attendant |
| Histórico com paginação | ✅ | Todos | admin |

**Tipos de pedido suportados:** Delivery, Retirada, Mesa, PDV/Balcão

---

## 3. MESAS / GESTÃO DE MESAS

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Cadastro de mesas | ✅ | START+ | admin |
| QR Code único por mesa | ✅ | START+ | admin |
| Autoatendimento via QR (cliente pede sem app) | ✅ | START+ | — |
| Abertura/fechamento de comanda | ✅ | START+ | admin, attendant, waiter, cashier |
| Visualização de itens da comanda | ✅ | START+ | admin, waiter, cashier |
| Desconto na comanda | ✅ | START+ | admin, cashier |
| Fechamento com múltiplas formas de pagamento | ✅ | START+ | admin, cashier |
| KDS (Tela de Cozinha) — separação visual por tipo | ✅ | START+ | kitchen |

---

## 4. PRODUTOS E CATEGORIAS

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Cadastro de produtos com foto, descrição, preço | ✅ | Todos | admin |
| Preço promocional | ✅ | Todos | admin |
| Adicionais/opções de produto | ✅ | Todos | admin |
| Gestão de categorias | ✅ | Todos | admin |
| Ativar/desativar produto | ✅ | Todos | admin |
| Vinculação com estoque | ✅ | Todos | admin |

---

## 5. ESTOQUE

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Cadastro de itens de estoque | ✅ | PRO | admin |
| Registro de entradas (compras) | ✅ | PRO | admin |
| Registro de saídas (consumo) | ✅ | PRO | admin |
| Alerta de estoque mínimo | ✅ | PRO | admin |
| Exportação CSV | ✅ | PRO | admin |
| Baixa automática na venda | ✅ | PRO | — |
| Relatório de movimentações | ✅ | PRO | admin |

---

## 6. CAIXA (CASH REGISTER)

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Abertura de caixa com saldo inicial | ✅ | Todos | admin, cashier |
| Suprimento (adicionar dinheiro) | ✅ | Todos | admin, cashier |
| Sangria (retirar dinheiro) | ✅ | Todos | admin, cashier |
| Fechamento com conferência de saldo | ✅ | Todos | admin, cashier |
| Relatório de fechamento | ✅ | Todos | admin, cashier |
| Histórico de sessões de caixa | ✅ | Todos | admin, cashier |

---

## 7. PDV / BALCÃO

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Interface de venda rápida | ✅ | START+ | admin, cashier |
| Busca de produtos | ✅ | START+ | admin, cashier |
| Carrinho com quantidade ajustável | ✅ | START+ | admin, cashier |
| Desconto (valor ou percentual) | ✅ | START+ | admin, cashier |
| Pagamento Dinheiro/PIX/Cartão | ✅ | START+ | admin, cashier |
| Cálculo automático de troco | ✅ | START+ | admin, cashier |
| Comprovante/recibo imprimível | ✅ | START+ | admin, cashier |
| Bloqueio se caixa fechado | ✅ | START+ | — |
| Requer feature gate `pos_counter` | ✅ | START+ | — |

---

## 8. RELATÓRIOS

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Vendas por período | ✅ | PRO | admin, cashier |
| Vendas por produto | ✅ | PRO | admin, cashier |
| Vendas por forma de pagamento | ✅ | PRO | admin, cashier |
| Vendas por canal (delivery/mesa/PDV) | ✅ | PRO | admin, cashier |
| Exportação CSV | ✅ | PRO | admin, cashier |
| Requer feature gate `advanced_reports` | ✅ | PRO | — |

---

## 9. WHATSAPP

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Conexão via QR Code (Evolution API) | ✅ | Todos | admin |
| Notificações automáticas por status do pedido | ✅ | Todos | — |
| Templates personalizáveis | ✅ | PRO | admin |
| Logs de envio | ✅ | PRO | admin |
| Requer feature gate `whatsapp_templates` (templates) | ✅ | PRO | — |

---

## 10. MARKETING WHATSAPP

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Criação de campanhas de disparo em massa | ✅ | PRO | admin |
| Segmentação de público | ✅ | PRO | admin |
| Agendamento de envio | ✅ | PRO | admin |
| Relatório de entrega/leitura | ✅ | PRO | admin |
| Requer feature gate `marketing_whatsapp` | ✅ | PRO | — |

---

## 11. RECUPERADOR DE VENDAS

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Detecção de carrinho abandonado | ✅ | PRO | — |
| Envio automático de mensagem WhatsApp | ✅ | PRO | — |
| Configuração de tempo de espera | ✅ | PRO | admin |
| Mensagem personalizável | ✅ | PRO | admin |
| Requer feature gate `sales_recovery` | ✅ | PRO | — |

---

## 12. CUPONS DE DESCONTO

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Criação de cupons (percentual, valor, frete grátis) | ✅ | PRO | admin |
| Código personalizado | ✅ | PRO | admin |
| Validade e limite de uso | ✅ | PRO | admin |
| Limite 1 uso por cliente | ✅ | PRO | admin |
| Requer feature gate `coupons` | ✅ | PRO | — |

---

## 13. ROLETA DE PRÊMIOS

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Configuração de fatias e prêmios | ✅ | PRO | admin |
| Regra para ganhar giros | ✅ | PRO | admin |
| Prêmios gerados como cupons | ✅ | PRO | — |
| Interface pública para o cliente | ✅ | PRO | — |
| Requer feature gate `roulette` | ✅ | PRO | — |

---

## 14. MOTOBOYS

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Cadastro de motoboys | ✅ | Todos | admin |
| Atribuição de entregas | ✅ | Todos | admin, attendant |
| App mobile web do motoboy | ✅ | Todos | motoboy |
| Histórico de corridas | ✅ | Todos | admin |
| Financeiro por motoboy | ✅ | Todos | admin |

---

## 15. APLICATIVO ANDROID (MOTOBOY APP)

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Build de APK para Android | ✅ | PRO | — |
| Configuração de banners do app | ✅ | PRO | admin |
| Distribuição do APK | ✅ | PRO | admin |
| Requer feature gate `motoboy_app` | ✅ | PRO | — |

---

## 16. GARÇOM / WAITER

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Acesso à tela de Mesas | ✅ | START+ | waiter |
| Visualização de comandas | ✅ | START+ | waiter |
| Atualização de status de itens | ✅ | START+ | waiter |
| Restrição: sem acesso a PDV, relatórios, configurações | ✅ | — | — |

---

## 17. CONFIGURAÇÕES

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Dados da loja (nome, endereço, CNPJ) | ✅ | Todos | admin |
| Horários de funcionamento | ✅ | Todos | admin |
| Métodos de pagamento | ✅ | Todos | admin |
| Tema e template do cardápio | ✅ | Todos | admin |
| Áreas de entrega e taxas | ✅ | Todos | admin |
| Domínio personalizado | ✅ | PRO | admin |
| Configurações de IA (Karina) | ✅ | Todos | admin |

---

## 18. USUÁRIOS E PERMISSÕES

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Cadastro de usuários da loja | ✅ | Todos | admin |
| Perfis: admin, cashier, attendant, waiter, kitchen, motoboy | ✅ | Todos | admin |
| Reset de senha | ✅ | Todos | admin |
| Controle de acesso por rota (frontend + backend) | ✅ | Todos | — |

---

## 19. INTEGRAÇÕES

| Integração | Status | Plano | Observação |
|---|---|---|---|
| WhatsApp Business (Evolution API) | ✅ | Todos | Instância gerenciada |
| Mercado Pago (PIX automático) | ✅ | PRO | Configurar em Configurações |
| Google Maps (endereço/entrega) | ✅ | Todos | Via viacep e geocoding |
| Supabase (auth e realtime) | ✅ | Infra | Backend auth |
| Rails API (replymesh-api) | ✅ | Infra | Backend principal |

---

## 20. CENTRAL DE AJUDA (FASE 16.23 — NOVO)

| Funcionalidade | Status | Plano | Roles |
|---|---|---|---|
| Página /admin/help | ✅ | Todos | admin, cashier, attendant |
| 17 tópicos com tutoriais | ✅ | Todos | — |
| Busca por palavras-chave | ✅ | Todos | — |
| FAQ accordion por tópico | ✅ | Todos | — |
| RAG da Karina com base de conhecimento | ✅ | Todos | — |

---

## 21. PÁGINAS LEGAIS (FASE 16.23 — NOVO)

| Página | Status | URL |
|---|---|---|
| Termos de Uso | ✅ | /termos-de-uso |
| Política de Privacidade | ✅ | /politica-de-privacidade |
| Ambas acessíveis via links do rodapé da Landing Page | ✅ | — |

---

## FEATURE GATES (feature flags por plano)

| Gate Key | Funcionalidade | Plano mínimo |
|---|---|---|
| `pos_counter` | PDV / Balcão | START |
| `inventory` | Estoque | PRO |
| `inventory_movements` | Movimentações de Estoque | PRO |
| `advanced_reports` | Relatórios avançados | PRO |
| `whatsapp_templates` | Templates WhatsApp | PRO |
| `marketing_whatsapp` | Marketing WhatsApp | PRO |
| `sales_recovery` | Recuperador de Vendas | PRO |
| `coupons` | Cupons de Desconto | PRO |
| `roulette` | Roleta de Prêmios | PRO |
| `motoboy_app` | App Android Motoboy | PRO |

---

*Gerado automaticamente na FASE 16.23 — 2026-06-12*
