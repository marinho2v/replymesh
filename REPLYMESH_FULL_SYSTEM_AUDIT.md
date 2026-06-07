# Auditoria Geral Replymesh

Data da auditoria: 06/06/2026  
Escopo: inventario estatico do codigo e da documentacao local  
Ambientes: Rails `3000`, Painel Master `5173`, Store Template `5174`

## Criterios

| Status | Significado |
|---|---|
| Concluido | Codigo, rota e interface existem, com validacao local documentada. |
| Parcial | Estrutura existe, mas ha fluxo incompleto, legado paralelo ou validacao limitada. |
| Depende VPS | Precisa de DNS, Nginx, SSL, scheduler, URL publica, secrets ou deploy. |
| Depende webhook | Precisa que um provedor externo entregue eventos em URL publica. |
| Pendente | Nao existe ou existe apenas como planejamento/preview. |

Esta auditoria nao executou migrations, alteracoes de banco, deploy ou mudancas
de codigo. As conclusoes cruzam rotas, controllers, models, services, paginas,
menus e relatorios de fases existentes.

## Resumo Executivo

- Backend Rails: amplo e funcional localmente, com APIs master, loja, publicas,
  motoboy e webhooks.
- Painel Master: administracao principal implementada, incluindo empresas,
  assinaturas, equipe, auditoria, suporte, Carina e dashboard executivo.
- Painel da Loja: operacao principal implementada em Rails. Ainda existem
  services Supabase legados preservados em paralelo.
- Loja publica: cardapio, carrinho, checkout, pedidos, Pix, cupons, roleta e QR
  de mesa implementados.
- Evolution Go: leitura, QR, mensagens e instancia da Demo foram validados. Os
  webhooks automaticos precisam de URL publica e configuracao na VPS.
- Mercado Pago: fluxo local completo e API real preparada. Webhook e scheduler
  de expiracao precisam de producao.
- Aplicativos Android: solicitacao, assets, banners e mensagens preparados.
  Geracao de APK/Flutter e push nativo nao existem.
- Subdominios: modelo e resolucao por hostname preparados. DNS wildcard, Nginx
  e SSL dependem da VPS.

## Painel Master

| Modulo | Status | Evidencia e observacoes |
|---|---|---|
| Dashboard | Concluido | `GET /api/v1/master/dashboard`, `MasterDashboardService`, filtros, cards, graficos, alertas, empresas e atividades reais. |
| Empresas | Concluido | Listagem, filtros, cadastro, detalhe, edicao, ativacao, suspensao e onboarding. |
| Planos | Concluido | CRUD real em `/assinaturas/planos` e API Rails. |
| Assinaturas | Concluido | Listagem, alteracao de plano/status, inadimplencia e MRR. |
| Usuarios Master | Concluido | CRUD, status, senha e vinculo com cargos internos. |
| Permissoes | Concluido | `MasterRole`, permissoes granulares e verificacao de acesso. |
| Convites | Parcial | Convite local, token, expiracao, reenvio e cancelamento existem; email real depende de infraestrutura. |
| Perfil | Concluido | Dados pessoais, avatar e troca de senha. |
| Tema claro/escuro | Concluido | Persistencia local documentada no master. |
| Central de Atualizacoes | Concluido | CRUD, publicacao global/plano/empresa e leituras. |
| Notificacoes | Concluido | Sino real, leitura individual/coletiva e links. |
| Carina IA | Concluido local | Claude, fallback local, RAG, memoria, logs e bloqueio de assuntos externos. |
| Configuracoes IA | Concluido local | Configuracao global, modelo, prompt, chave mascarada, teste e metricas. |
| Aplicativos Android | Parcial | Solicitacoes e acompanhamento existem; APK, Flutter e push nativo nao existem. |
| Auditoria | Concluido | `MasterAuditLog`, filtros, detalhes sanitizados e permissoes. |
| Impersonacao | Concluido local | Sessao revogavel, 30 minutos, empresa unica, banner e auditoria. |
| Suporte/Tickets | Concluido | Listagem global, conversa, status e isolamento por empresa. |
| Relatorios Master | Parcial | Dashboard e financeiro agregam metricas; nao existe uma area dedicada completa de relatorios/exportacoes master. |
| Dominios | Parcial | CRUD, primario e estados existem; verificacao DNS/SSL ainda e mock. |
| WhatsApp Master | Parcial real | Instancias, sincronizacao, QR, templates e logs existem; operacoes reais dependem da Evolution e configuracao segura. |
| Financeiro Master | Concluido local | MRR, cobrancas e inadimplencia existem; repasses possui item de menu sem rota dedicada explicita. |

## Painel da Loja

| Modulo | Status | Evidencia e observacoes |
|---|---|---|
| Dashboard | Concluido | Estatisticas e pedidos recentes via Rails. |
| Pedidos | Concluido | Lista, detalhe, impressao, status, cancelamento, pagamento e atribuicao de motoboy. |
| Produtos | Concluido | CRUD, ativacao, destaque, imagem, categoria e reflexo no cardapio publico. |
| Categorias | Concluido | CRUD, ativacao e ordenacao basica. |
| Clientes | Concluido | Lista, busca, detalhe, historico e enderecos. |
| Cupons | Concluido | CRUD e validacao publica. |
| Roleta | Concluido local | Premios, giros, cupons e creditos por pedido. |
| Marketing WhatsApp | Parcial real | Clientes Rails, envio individual e campanhas controladas; disparo em producao exige politica, infraestrutura e Evolution real. |
| Recuperador de Vendas | Concluido local | Endpoint Rails e filtros 7/15/30/60/90 dias. Estado vazio atual e coerente com dados recentes. |
| Relatorios | Parcial | Tela e dados existem, mas parte dos services legados Supabase permanece no repositorio e volume real ainda e limitado. |
| Caixa | Concluido local | Abrir, movimentar, fechar, historico e pagamentos. Automacao operacional completa deve ser revalidada em producao. |
| Estoque | Concluido local | Itens, entrada, saida/ajuste, movimentos e estoque baixo. |
| Motoboys | Concluido local | CRUD, entregas, relatorio, ranking, financeiro e ajustes agora usam Rails. |
| Mesas | Concluido local | CRUD, ativacao, QR, regeneracao, sessao e pedido vinculado. |
| QR Mesa | Concluido local | Rota publica por token e pedido associado a mesa. |
| Suporte | Concluido | Loja cria e responde; somente master altera status. |
| Configuracoes | Concluido | Accordion para geral, identidade, entrega, pagamentos, horarios, impressao, WhatsApp e IA da loja. |
| Identidade Visual | Concluido | Logo, banner, hero, cores e template visual. |
| Templates WhatsApp | Concluido local | Templates por empresa e ativacao por evento. |
| Aplicativo Android | Parcial | Solicitacao, banners e mensagens reunidos; APK e push nativo pendentes. |
| IA da Loja | Parcial | Configuracao, simulador, RAG e auto-reply existem; resposta real automatica depende do webhook Evolution publico. |
| Mercado Pago | Parcial real | Pix, polling, cancelamento e processamento existem; webhook/scheduler publico ainda pendentes. |
| WhatsApp | Parcial real | Instancia unica, status, QR, templates, logs e envio testado; webhook e operacao continua dependem da VPS. |
| Notificacoes | Concluido | Listagem, leitura e limpeza. |
| Atualizacoes | Concluido | Feed real, filtros e leitura por usuario. |
| Usuarios da loja | Concluido local | CRUD e papeis de admin/atendente/cozinha. |

### Divida tecnica do Store Template

O frontend preserva o modo hibrido solicitado. Ainda existem imports Supabase
em autenticacao e services legados como `orders.js`, `reports.js`,
`products.js`, `categories.js`, `deliveryZones.js`, `whatsappService.js`,
`useRealtimeOrders.js` e `motoboyPortal.js`.

As telas principais migradas usam services Rails, mas antes da producao e
necessario confirmar que nenhuma rota ativa cai acidentalmente nesses caminhos
legados quando o Supabase nao estiver configurado.

## Loja Publica

| Item | Status | Evidencia e observacoes |
|---|---|---|
| Home | Concluido | Branding, hero, status, horarios e menu Rails. |
| Cardapio | Concluido | Categorias e produtos ativos por empresa. |
| Categorias | Concluido | Scroll e filtro por categoria. |
| Produto | Concluido | Detalhe, preco, promocao e opcionais. |
| Carrinho | Concluido | Quantidade, remocao, adicionais, cupom e subtotal local. |
| Checkout | Concluido local | Cliente, telefone, enderecos, zona, taxa, cupom, troco e pedido Rails. |
| Pix Manual | Concluido | Payload/configuracao por loja. |
| Pix Mercado Pago | Parcial real | QR e copia/cola implementados; producao depende de credencial real, webhook e scheduler. |
| Cupons | Concluido | Validacao server-side e desconto recalculado. |
| Roleta | Concluido local | Perfil, premios e giro por empresa. |
| QR Mesa | Concluido local | Identificacao por token, sessao e pedido de mesa. |
| Pedido | Concluido | Criacao publica e token aleatorio. |
| Acompanhamento | Concluido | Timeline, polling, dados e envio do resumo por WhatsApp. |
| Templates visuais | Parcial | Classic e Premium ativos; Pizzaria Dark, Doceria Clean e Bebidas Neon estao `coming_soon`. |
| Subdominios | Parcial | Resolucao por hostname preparada; DNS/Nginx/SSL dependem VPS. |
| Dominio proprio | Pendente parcial | Campos existem, mas verificacao DNS e SSL automatica nao existem. |

## Motoboy

| Item | Status | Observacoes |
|---|---|---|
| Login | Concluido local | JWT separado do admin. |
| Perfil | Concluido local | Endpoint e tela. |
| Historico | Concluido local | Entregas concluidas via Rails. |
| Pedidos | Concluido local | Pedidos atribuidos da empresa/motoboy. |
| Finalizar entrega | Concluido local | Entrega vira `delivered`, pedido `completed`, historico e WhatsApp conforme template. |
| Maps | Concluido local | Usa pin salvo; fallback por endereco. |
| Waze | Concluido local | Usa pin salvo; fallback por endereco. |
| Localizacao WhatsApp | Parcial | Parser e webhook Rails validados com payload simulado; recebimento real depende webhook publico. |
| Historico de entregas | Concluido local | API, filtros e relatorio. |
| Financeiro | Concluido basico | Taxas, diarias, bonus, vales, descontos e total a pagar; repasse avancado pendente. |
| Rastreamento em tempo real | Pendente | Nao iniciado por decisao de escopo. |

## WhatsApp e Evolution

| Fluxo | Status | Dependencia |
|---|---|---|
| Pedido recebido | Preparado, desativado por padrao | Template por empresa. |
| Pedido aceito | Funcionando real na Demo | Evolution conectada e template ativo. |
| Saiu para entrega | Funcionando real na Demo | Evolution conectada e template ativo. |
| Pedido finalizado | Funcionando real na Demo | Evolution conectada e template ativo. |
| Pedido cancelado | Preparado, desativado por padrao | Ativacao do template. |
| Marketing individual | Parcial real | Evolution conectada, autorizacao do contato e controle operacional. |
| Campanhas | Parcial | Rascunho e confirmacao existem; producao exige limites e compliance. |
| Recuperador | Parcial | Segmentacao existe; envio usa Marketing WhatsApp. |
| IA Cliente | Parcial | Pipeline existe; auto-reply desligado e webhook publico pendente. |
| Webhook Evolution | Depende webhook | Endpoints Rails existem, mas precisam URL publica/configuracao na Evolution. |
| Localizacao WhatsApp | Depende webhook | Parser, vinculacao e Maps/Waze existem; falta entrega real da Evolution ao Rails publico. |
| QR/Conexao | Funcionando real na Demo | Uma instancia por empresa. |

## IA

| Componente | Status | Observacoes |
|---|---|---|
| Claude | Concluido local | Provider backend e teste documentado. |
| RAG Carina | Concluido local | Chunks relevantes; reducao documentada de 86,4% em um teste. |
| Memoria Carina | Concluido local | Ultimas dez mensagens. |
| Base de conhecimento | Concluido | Base canonica em `replymesh-api/docs`. |
| Suporte da plataforma | Concluido local | Carina orienta sem executar alteracoes. |
| IA do cliente/loja | Parcial | RAG, configuracao e simulador existem. |
| WhatsApp IA | Depende webhook | Auto-resposta requer webhook publico Evolution. |
| Autoatendimento | Parcial | Assuntos permitidos/bloqueados e contexto existem; ativacao real pendente. |
| Custos | Concluido local | `AiUsageLog`, tokens e custo estimado no master. |
| Logs | Concluido local | Empresa, usuario/telefone, pergunta, resposta, modelo, tokens e tempo. |
| Embeddings/vetor | Pendente por escolha | RAG lexical local; nenhum banco vetorial. |

## Mercado Pago

| Item | Status | Observacoes |
|---|---|---|
| Configuracao | Concluido local | Chaves no backend e token mascarado. |
| Pix automatico | Parcial real | Client HTTP real existe; desenvolvimento pode usar mock por token `TEST-`/`DEV-`. |
| Webhook | Depende webhook | Endpoint e validacao existem; precisa URL publica configurada no Mercado Pago. |
| Confirmacao | Concluido local | Polling/processador atualiza pagamento e pedido. |
| Expiracao | Parcial | Service e rake task existem; scheduler permanente depende VPS. |
| Cancelamento | Concluido local | Cancelamento publico seguro para pendente. |
| Atualizacao do pedido | Concluido local | `paid/accepted`, `expired/cancelled`, `failed/cancelled`. |
| WhatsApp apos pagamento | Parcial real | `pedido_aceito` dispara apos aprovado; entrega depende Evolution/telefone valido. |
| Producao financeira | Pendente validacao | Necessita teste real de cobranca, webhook, idempotencia e conciliacao na VPS. |

## Multiempresa

| Escopo | Status |
|---|---|
| `company_id` nos recursos operacionais | Validado no schema e controllers. |
| Isolamento das rotas `/store` | Validado por `current_company`. |
| Isolamento das rotas publicas | Validado por `company_slug`. |
| Lojas e branding | Validado com empresas diferentes. |
| Clientes | Validado por empresa. |
| Pedidos | Validado por empresa. |
| Produtos/categorias | Validado por empresa. |
| Cupons/roleta | Validado por empresa. |
| IA | Configuracao, conversas e contexto vinculados por empresa. |
| WhatsApp | Instancia e templates vinculados por empresa. |
| Risco restante | Services Supabase legados e testes de concorrencia/carga antes da producao. |

Conclusao: o isolamento Rails esta bem estruturado e foi validado localmente,
mas a garantia de producao exige testes automatizados multi-tenant e revisao
das rotas legadas.

## Subdominios

| Item | Status | Observacoes |
|---|---|---|
| Slug | Concluido | Normalizacao e duplicidade com sufixo. |
| Subdomain | Concluido no banco | Usa `slug.replymesh.cloud`. |
| `replymesh.cloud` | Concluido no codigo | Sufixo oficial atualizado. |
| Resolucao no frontend | Parcial | Hostname pode fornecer o slug. |
| DNS wildcard | Depende VPS | Configurar `*.replymesh.cloud`. |
| Nginx wildcard | Depende VPS | Encaminhar master, API e lojas. |
| SSL wildcard | Depende VPS | Certificado e renovacao. |
| Dominio proprio | Parcial | Campos preparados; verificacao e SSL pendentes. |

## Templates Visuais

| Template | Estado |
|---|---|
| Hamburgueria Classic | Ativo e funcional. |
| Hamburgueria Premium | Ativo e funcional. |
| Pizzaria Dark | Preview/`coming_soon`. |
| Doceria Clean | Preview/`coming_soon`. |
| Bebidas Neon | Preview/`coming_soon`. |

O sistema de registry, selecao por empresa e metadados existe. Os tres
templates `coming_soon` ainda precisam de componentes React completos,
responsividade, assets e validacao funcional.

## Aplicativos

| Item | Status | Observacoes |
|---|---|---|
| App Cliente | Pendente | Nenhum aplicativo nativo funcional. |
| App Motoboy | Pendente | Existe portal web responsivo, nao app nativo. |
| Solicitacao Android | Concluido local | Loja solicita e master acompanha status. |
| Painel Master Android | Concluido local | Lista, busca, detalhe e alteracao de status. |
| Assets | Parcial | Logo, banner, cores e observacoes sao coletados. |
| Splash | Parcial | Dados podem ser solicitados, mas nao ha geracao final. |
| Icone | Parcial | Asset/configuracao preparada, sem empacotamento. |
| Banners do App | Concluido como gestao | Integrados na pagina Android. |
| Mensagens para usuarios | Parcial | Hoje usam WhatsApp/Evolution; push nativo nao existe. |
| Flutter/APK | Pendente | Nao iniciado. |

## Modulos Concluidos

- Autenticacao JWT e contexto de empresa.
- Onboarding base multiempresa.
- Empresas, planos, assinaturas e financeiro master.
- Usuarios master, cargos, permissoes, convites locais e perfil.
- Dashboard executivo master.
- Auditoria, impersonacao, tickets e atualizacoes.
- Catalogo, clientes, cupons, roleta, estoque, caixa, mesas e pedidos.
- Loja publica, cardapio, carrinho, checkout e acompanhamento.
- Portal motoboy e financeiro basico.
- Notificacoes da loja e master.
- Carina com RAG local.
- QR/instancia WhatsApp da Demo e mensagens de status testadas.

## Modulos Parcialmente Concluidos

- Relatorios master dedicados.
- Relatorios da loja com remanescentes legados.
- Dominio proprio e verificacao DNS/SSL.
- Mercado Pago real em producao.
- IA da loja automatica via WhatsApp.
- Marketing e recuperacao com operacao real em escala.
- Aplicativo Android.
- Templates Pizzaria, Doceria e Bebidas.
- Convites por email.
- Financeiro/repasses avancados de motoboy.

## Dependentes da VPS

- Deploy Rails e frontends.
- PostgreSQL de producao, backups e secrets.
- DNS `app.replymesh.cloud`, `api.replymesh.cloud` e wildcard.
- Nginx, SSL e hosts multiempresa.
- Scheduler para expiracao Pix e tarefas recorrentes.
- Armazenamento publico de uploads/assets.
- Email transacional.
- Observabilidade, logs, alertas e health checks externos.

## Dependentes de Webhook

- Confirmacao assicrona Mercado Pago.
- Localizacao WhatsApp Evolution.
- IA automatica de atendimento via Evolution.
- Recebimento de mensagens/eventos Evolution em geral.

## Modulos Faltantes

- Aplicativo Android/Flutter real e push nativo.
- Rastreamento de motoboy em tempo real.
- Verificacao automatica de dominio proprio e emissao SSL.
- Templates visuais Pizzaria, Doceria e Bebidas funcionais.
- Suite automatizada robusta de testes de integracao, multiempresa e carga.
- Operacao de producao: CI/CD, backup, monitoramento e rollback validados.

## Prioridade Antes da Fase 16

1. Eliminar ou isolar de forma definitiva os caminhos Supabase ainda
   importados por rotas ativas do `store-template`.
2. Criar uma bateria minima automatizada para autenticacao, isolamento
   multiempresa, checkout, pedido, pagamento, WhatsApp e motoboy.
3. Validar Mercado Pago com credencial real em ambiente controlado, sem
   depender do mock de desenvolvimento.
4. Definir jobs/scheduler de producao para expiracao Pix e rotinas periodicas.
5. Preparar matriz de secrets e variaveis por ambiente sem registrar chaves.
6. Definir DNS/Nginx/SSL wildcard e estrategia de dominios proprios.
7. Configurar webhooks Evolution e Mercado Pago apenas depois da API publica
   estar protegida e observavel.
8. Preparar backup, restauracao, health check, logs e rollback.
9. Fazer homologacao final com pelo menos duas empresas simultaneamente.
10. Congelar uma versao candidata e somente entao iniciar a Fase 16.

## Indicadores Finais

Estimativas baseadas no inventario de modulos, nao em cobertura automatizada.

| Indicador | Percentual |
|---|---:|
| Concluido funcionalmente em ambiente local | 87% |
| Pronto para producao sem trabalho adicional | 60% |
| Parcela que depende diretamente da VPS | 18% |
| Parcela que depende de webhooks publicos | 9% |
| Parcela ainda ausente ou apenas planejada | 9% |

Os percentuais de dependencia podem se sobrepor: um webhook tambem depende de
uma API publicada na VPS.

## Notas de 0 a 100

| Area | Nota | Justificativa |
|---|---:|---|
| Backend | 88 | Cobertura funcional ampla e boa separacao por namespaces/services; faltam testes automatizados e operacao de producao. |
| Frontend | 88 | Rotas ativas do Master e da loja usam Rails; arquivos Supabase restantes estao isolados como legado sem entrada no roteador. |
| UX | 82 | Fluxos principais foram refinados; faltam validacao ampla em dispositivos e acabamento dos modulos parciais. |
| IA | 80 | Carina e RAG estao fortes localmente; IA da loja real depende de webhook e operacao externa. |
| WhatsApp | 76 | Evolution real e mensagens da Demo funcionaram; webhooks e escala multiempresa ainda nao estao publicados. |
| Multiempresa | 89 | `company_id`, slug e contextos estao bem aplicados; faltam testes automatizados de vazamento e carga. |
| Producao | 55 | Codigo esta avancado, mas deploy, DNS, SSL, jobs, webhooks, backups, observabilidade e homologacao real permanecem pendentes. |

## Conclusao

A Replymesh esta muito alem de um prototipo: possui um SaaS local amplo, com
backend Rails, dois frontends e fluxos operacionais reais. A maior parte dos
modulos de negocio esta concluida ou funcional em ambiente local.

O principal risco antes da Fase 16 nao e a ausencia de telas, mas a transicao
de um ambiente local/hibrido para uma operacao publica confiavel. As prioridades
sao remover dependencias legadas ativas, fortalecer testes, publicar a
infraestrutura com seguranca e validar webhooks/pagamentos em ambiente real
controlado.

## Atualizacao de congelamento - 06/06/2026

A prioridade de testes minimos foi concluida:

- 22 testes Rails, 0 falhas;
- autenticacao, permissoes e isolamento multiempresa cobertos;
- checkout, Mercado Pago, WhatsApp, motoboy, roleta e IA cobertos;
- builds e lint aprovados;
- smoke HTTP local aprovado;
- auditoria de segredos aprovada.

A nota de Backend passa de 88 para 91 e a nota de Producao de 55 para 62. O
ganho reflete cobertura minima e repetibilidade local; nao representa
homologacao da infraestrutura publica.

A versao foi congelada como `Replymesh Local Stable v0.15.21`. Os riscos
restantes estao concentrados em DNS, SSL, Nginx, banco e jobs de producao,
backups, observabilidade, webhooks, secrets, deploy e rollback.
