# REPLYMESH FASE 16.14 - CARINA RAG E IA DA LOJA

Data: 09/06/2026
Status: concluida localmente
Escopo: somente codigo local em `W:\sas replymesh`

## Resumo

A Carina e a IA da Loja continuam sendo servicos separados:

- Carina: suporte para administradores usarem a plataforma Replymesh.
- IA da Loja: atendimento ao cliente final com dados da empresa atual.

Nenhuma alteracao foi feita em VPS, producao, Evolution ou Mercado Pago.
Nenhuma chave Claude foi exibida ou alterada.

## Causa da repeticao

O RAG anterior juntava as duas perguntas anteriores com a pergunta atual antes
de pontuar os artigos. Por isso, uma conversa sobre imagem de produto mantinha
os termos `imagem`, `produto` e `foto` na consulta seguinte. Esses termos
podiam superar uma nova pergunta sobre suporte ou ticket.

O fallback repetia o mesmo problema e a memoria enviada ao provider continha a
pergunta e a resposta anteriores mesmo quando o usuario mudava de assunto.

## Correcao aplicada

- A pergunta atual passou a ter prioridade.
- Historico so participa da busca quando a nova mensagem e uma continuacao
  curta, como `e onde coloco ela?`.
- Foi adicionada classificacao por intencao com prioridade unica.
- Artigos curados vencem artigos antigos quando tratam da mesma intencao.
- Fallback exige pontuacao minima; correspondencia apenas por palavras
  genericas vira lacuna.
- O prompt informa que memoria recente nao pode dominar a pergunta atual.
- Perguntas sem cobertura recebem status `gap` e sugerem abertura de ticket.

## Base RAG

O RAG lexical anterior era economico e seguro, mas fraco para troca de assunto,
empates entre artigos e perguntas sem resposta.

Foi criada a base curada:

`replymesh-api/docs/REPLYMESH_CARINA_ARTICLES.md`

Ela possui:

- 32 modulos;
- 33 perguntas exemplo;
- 33 respostas ideais;
- 32 blocos de passo a passo;
- 32 regras de quando abrir ticket.

Modulos cobertos:

1. Primeiros passos
2. Dashboard
3. Empresas
4. Produtos
5. Categorias
6. Imagens do cardapio
7. Pedidos
8. KDS / Cozinha
9. Motoboy
10. Localizacao do cliente
11. WhatsApp / Evolution
12. QR Code WhatsApp
13. Templates WhatsApp
14. Marketing WhatsApp
15. Recuperador de vendas
16. Clientes
17. Cupons
18. Roleta
19. Caixa
20. Estoque
21. Mesas / QR de mesa
22. Relatorios
23. Mercado Pago / Pix
24. Configuracoes da loja
25. Horarios
26. Regioes de entrega
27. Suporte / Tickets
28. Aplicativo Android
29. Dominios
30. Planos / Assinatura
31. IA da loja
32. Seguranca / permissoes

## Antes e depois

Antes:

- pergunta atual: `como eu abro um ticket?`
- contexto anterior: imagem de produto
- risco: resposta repetida sobre imagem.

Depois:

- resposta recuperada do modulo `Suporte / Tickets`;
- orientacao para abrir Suporte, criar Novo Ticket e anexar print seguro;
- a resposta nao contem `1200x800` nem repete o assunto anterior.

Pergunta:

`qual tamanho da foto do produto?`

Depois:

- recupera `Imagens do cardapio`;
- recomenda 1200x800 e proporcao 3:2 ou 4:3;
- informa o caminho do menu.

## Lacunas e melhoria continua

Foi aproveitada a tabela existente `ai_assistant_logs`, sem migration.

Quando nao existe cobertura suficiente:

- a pergunta e registrada;
- empresa e usuario permanecem associados;
- o status fica `gap`;
- o modulo provavel e registrado no diagnostico interno;
- a resposta orienta abertura de ticket.

O Painel Master agora recebe as ultimas lacunas em `master/ai/usage` e mostra
um rascunho de artigo copiavel em Configuracoes > IA. A publicacao continua
dependendo de revisao humana e revisao de codigo; a IA nao escreve arquivos ou
publica conhecimento automaticamente.

## IA da Loja

Melhorias aplicadas sem misturar com a Carina:

- bloqueio de perguntas tecnicas sobre painel, Replymesh, token, webhook,
  Evolution e configuracao interna;
- consulta de produtos continua filtrada pela empresa;
- busca por produto mais barato ordena pelo preco real;
- regioes de entrega entram no RAG por `company_id`;
- taxa, pedido minimo e prazo podem ser respondidos pelo bairro/alias;
- retirada no local e informada quando habilitada;
- consulta generica de entrega nao e confundida com status de pedido.

As fontes permanecem por empresa:

- produtos e categorias;
- horarios;
- configuracoes da loja;
- pagamentos;
- regioes de entrega;
- cupons ativos;
- pedido recente somente com telefone e permissao.

## Testes

Executados:

- `bundle exec rspec`: 56 exemplos, 0 falhas.
- 15 perguntas obrigatorias da Carina: OK.
- troca de contexto imagem -> suporte: OK.
- continuacao curta usando contexto anterior: OK.
- registro de pergunta sem resposta como `gap`: OK.
- 7 cenarios da IA da Loja: OK.
- bloqueio de pergunta tecnica na IA da Loja: OK.
- isolamento de produto entre duas empresas: OK.
- `ruby -c` nos arquivos Ruby alterados: OK.
- `npm run build` em `replymesh-frontend`: OK.
- `npm run lint` em `replymesh-frontend`: OK.
- `npm run build` em `store-template`: OK.
- auditoria de segredos: nenhum segredo hardcoded encontrado.
- `git diff --check`: OK.

O teste com provider Claude real nao foi executado para evitar consumo e uso
desnecessario da chave. O caminho local, RAG, fallback, logs e limites foram
validados sem expor credenciais.

## Arquivos alterados

- `replymesh-api/app/controllers/api/v1/master/ai_controller.rb`
- `replymesh-api/app/models/ai_assistant_log.rb`
- `replymesh-api/app/models/ai_usage_log.rb`
- `replymesh-api/app/services/carina_assistant_service.rb`
- `replymesh-api/app/services/replymesh_knowledge_service.rb`
- `replymesh-api/app/services/replymesh_rag_service.rb`
- `replymesh-api/app/services/store_ai_service.rb`
- `replymesh-api/app/services/store_knowledge_service.rb`
- `replymesh-api/app/services/store_rag_service.rb`
- `replymesh-api/docs/REPLYMESH_CARINA_ARTICLES.md`
- `replymesh-api/spec/services/carina_rag_and_store_ai_spec.rb`
- `replymesh-frontend/src/pages/configuracoes/AiSettings.jsx`
- `REPLYMESH_PHASE_16_14_CARINA_RAG_STORE_AI_REPORT.md`

## Migration

Nao precisa de migration.

O status `gap` usa a coluna string existente. A listagem de lacunas usa os
campos ja presentes em `ai_assistant_logs`.

## Pendencias

- Fazer teste visual do bloco de lacunas depois de publicar em um ambiente de
  homologacao.
- Fazer um teste controlado com Claude depois da aprovacao do deploy.
- Revisar periodicamente as lacunas e promover somente artigos validados.

## Pode commitar?

Sim. O codigo local esta apto para auditoria final e commit, mas nenhum commit
foi criado nesta fase.

## Acesso direto do Master

O acesso de suporte tambem foi simplificado antes da publicacao:

- removida a confirmacao por alerta;
- removida a dependencia de pop-up/nova aba;
- o Master cria a sessao auditada pela API;
- a mesma aba redireciona diretamente ao painel da empresa;
- o banner de acesso suporte e a revogacao da sessao continuam preservados.

Arquivos adicionais:

- `replymesh-frontend/src/lib/companyImpersonation.js`
- `replymesh-frontend/src/pages/Dashboard.jsx`
- `replymesh-frontend/src/pages/empresas/EmpresasList.jsx`
- `replymesh-frontend/src/pages/empresas/CompanyImpersonationLaunch.jsx`
