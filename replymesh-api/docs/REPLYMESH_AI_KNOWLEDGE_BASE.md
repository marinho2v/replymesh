# Visao geral da Replymesh
<!-- keywords: replymesh plataforma sistema ajuda inicio dashboard multiempresa tenant loja admin -->

## Descricao

A Replymesh e uma plataforma SaaS multiempresa para operacoes de delivery.
Cada empresa possui dados isolados por `company_id`, uma loja publica por slug
e um painel administrativo proprio. O Painel Master administra empresas,
planos, assinaturas, dominios, suporte e integracoes globais.

## Quem usa

- Donos e administradores da loja.
- Atendentes autorizados.
- Equipe de cozinha no KDS.
- Motoboys no portal separado.
- Super administradores no Painel Master.

## Onde fica

- Painel da loja: `/loja/:slug/admin/dashboard`
- Loja publica: `/loja/:slug`
- Cozinha: `/kitchen`
- Motoboy: `/loja/:slug/motoboy/dashboard`
- Painel Master: `http://127.0.0.1:5173`

## Regras importantes

- Toda consulta da loja deve respeitar a empresa autenticada.
- O slug da URL identifica a loja visual, mas as APIs protegidas usam JWT e
  contexto de empresa.
- A loja nao ve segredos de Claude, Evolution ou Mercado Pago em texto aberto.
- A Carina orienta o uso; ela nao executa alteracoes nesta fase.

## Pergunta e resposta ideal

**Pergunta:** O que voce consegue fazer?

**Resposta ideal da Carina:** Posso orientar voce em praticamente todo o painel
Replymesh: pedidos, produtos, pagamentos, WhatsApp, motoboys, cupons, mesas,
estoque, caixa, relatorios e configuracoes. Se me disser em qual tela voce
esta ou o que deseja fazer, eu explico o caminho passo a passo.

# Dashboard da loja
<!-- keywords: dashboard inicio indicadores faturamento pedidos recentes resumo status vendas -->

## Descricao e finalidade

O Dashboard apresenta uma visao operacional da empresa: faturamento do dia,
pedidos do dia, ticket medio, novos clientes, distribuicao por status, resumo
geral e pedidos recentes.

## Onde fica

`Dashboard` ou `/loja/:slug/admin/dashboard`

## Funcionalidades

- Indicadores do dia.
- Status dos pedidos.
- Pedidos recentes.
- Resumo de estoque e clientes.
- Acoes rapidas nos pedidos quando disponiveis.

## Erros comuns

- **Valores zerados:** confirme se os pedidos pertencem a empresa atual e ao
  periodo de hoje.
- **Tela sem atualizar:** use Atualizar ou recarregue a pagina.
- **Erro 401:** a sessao expirou; entre novamente pelo login da empresa.

## Perguntas e respostas ideais

**Pergunta:** Onde vejo as vendas de hoje?

**Resposta ideal:** Abra **Dashboard**. Nos cards superiores voce encontra o
faturamento, a quantidade de pedidos e o ticket medio do dia. Depois, confira
Pedidos recentes para validar quais vendas formaram esse total.

**Pergunta:** O dashboard mostra outra empresa?

**Resposta ideal:** Isso nao deve acontecer. Confira se o slug da URL pertence
a sua loja e faca login novamente. Se continuar, abra um ticket informando a
URL acessada, porque a Replymesh sempre deve filtrar os dados por empresa.

# Pedidos
<!-- keywords: pedido pedidos venda status aceitar accepted preparing preparo ready pronto entrega cancelar cozinha kds pagamento -->

## Descricao e finalidade

Pedidos concentra a operacao diaria. O admin consulta dados completos,
altera status, imprime, atribui motoboy e acompanha pagamento e entrega.

## Onde fica

- Lista: `Operacao > Pedidos`
- Rota: `/loja/:slug/admin/orders`
- Detalhe: `/loja/:slug/admin/orders/:id`
- Cozinha: `/kitchen`

## Status suportados

- `pending`: pendente.
- `pending_payment`: aguardando pagamento automatico.
- `accepted`: aceito.
- `preparing`: em preparo.
- `ready`: pronto.
- `out_for_delivery`: saiu para entrega.
- `completed`: finalizado.
- `cancelled`: cancelado.

## Passo a passo para operar

1. Abra **Operacao > Pedidos**.
2. Selecione o pedido para ver cliente, itens, pagamento e endereco.
3. Confirme o pagamento quando a forma exigir validacao.
4. Use as transicoes permitidas de status.
5. Para entrega, atribua um motoboy quando o pedido estiver pronto.

## Regras

- Pix Mercado Pago pendente nao pode ser aceito manualmente.
- A cozinha nao deve receber pedido em `pending_payment`.
- O backend valida transicoes de status.
- Mudancas registram historico com data, usuario e status anterior/novo.
- Templates WhatsApp ativos podem ser disparados pela mudanca de status.

## Erros comuns e solucoes

- **Pedido nao aparece:** confira filtros, empresa, data e status.
- **Nao consigo aceitar:** verifique se o Pix ainda aguarda pagamento.
- **Status recusado:** use a proxima transicao valida.
- **Pedido duplicado:** o checkout possui protecao por telefone/IP e janela
  curta contra repeticao.
- **Impressao estranha:** abra o detalhe e use Imprimir; o cupom tem CSS
  proprio e nao deve imprimir sidebar.

## Perguntas e respostas ideais

**Pergunta:** Como aceito um pedido?

**Resposta ideal:** Abra **Operacao > Pedidos**, entre no pedido e clique em
**Aceitar**. Se o pedido estiver aguardando Pix Mercado Pago, o sistema libera
essa etapa somente depois da confirmacao. Em seguida, voce pode encaminhar
para **Em preparo**.

**Pergunta:** Como imprimo o pedido?

**Resposta ideal:** Entre em **Operacao > Pedidos**, abra o detalhe e clique em
**Imprimir**. O navegador abrira o cupom com cliente, itens, totais, pagamento
e endereco. Se a janela nao abrir, permita pop-ups para o endereco local.

**Pergunta:** Como atribuo um motoboy?

**Resposta ideal:** Deixe o pedido como **Pronto**, abra o detalhe, escolha um
motoboy ativo e salve a atribuicao. O pedido aparece no portal do entregador.
Depois, recomendo confirmar se o endereco e os botoes Maps/Waze estao corretos.

# Produtos
<!-- keywords: produto produtos cardapio item lanche preco promocional imagem destaque ativo adicional opcional -->

## Descricao e finalidade

Produtos sao os itens vendidos no cardapio. Cada produto pertence a uma
categoria e pode ter preco, promocao, imagem, descricao, destaque, estoque e
grupos de opcionais.

## Onde fica

`Cardapio > Produtos` ou `/loja/:slug/admin/products`

## Funcionalidades

- Criar e editar produto.
- Ativar ou desativar.
- Destacar no cardapio.
- Definir categoria, preco e custo.
- Informar imagem e descricao.
- Organizar ordem.
- Criar grupos de opcionais e adicionais.

## Passo a passo para criar

1. Acesse **Cardapio > Produtos**.
2. Clique em **Novo Produto**.
3. Informe nome, categoria e preco.
4. Adicione descricao, imagem, custo e destaque quando necessario.
5. Marque como ativo e salve.

## Alterar preco

1. Localize o produto.
2. Clique em Editar.
3. Ajuste o preco em reais.
4. Confira se existe preco promocional.
5. Salve e valide no cardapio publico.

## Excluir ou ocultar

O fluxo seguro e desativar. Produto inativo deixa de aparecer no menu publico,
mas permanece no historico dos pedidos antigos.

## Erros comuns

- **Produto nao aparece:** confirme categoria ativa, produto ativo e empresa.
- **Erro ao salvar:** nome, categoria e preco sao obrigatorios.
- **Imagem nao aparece:** use uma URL publica HTTPS valida ou o upload da tela.
- **Preco errado:** confira reais versus centavos; o frontend envia centavos
  para o Rails.

## Boas praticas

- Use imagens claras e com proporcao consistente.
- Evite nomes excessivamente longos.
- Preencha categoria e descricao.
- Desative em vez de apagar itens com historico.
- Teste o cardapio publico depois de alterar preco ou atividade.

## Perguntas e respostas ideais

**Pergunta:** Como criar um produto?

**Resposta ideal:** Claro! Va em **Cardapio > Produtos** e clique em **Novo
Produto**. Informe nome, categoria e preco; depois adicione uma boa imagem e
descricao. Marque o produto como ativo e salve. Por fim, abra o cardapio
publico para conferir como ele ficou.

**Pergunta:** Como adiciono imagem?

**Resposta ideal:** Continuando no produto, abra **Cardapio > Produtos >
Editar**. Use o campo de imagem ou upload, escolha uma foto publica e salve.
Depois atualize o cardapio para conferir. Recomendo uma imagem horizontal,
clara e sem texto muito pequeno.

**Pergunta:** Como excluir produto?

**Resposta ideal:** O mais seguro e desativar. Em **Cardapio > Produtos**,
localize o item e use **Desativar**. Ele some do cardapio publico sem apagar o
historico dos pedidos. Se quiser vender novamente, basta reativar.

# Categorias
<!-- keywords: categoria categorias secao secoes cardapio ordem organizar bebida combo pizza lanche -->

## Finalidade

Categorias organizam o cardapio e controlam os agrupamentos exibidos no menu.

## Onde fica

`Cardapio > Categorias` ou `/loja/:slug/admin/categories`

## Operacoes

- Criar, editar e desativar.
- Definir ordem de exibicao.
- Associar produtos.

## Passo a passo

1. Abra **Cardapio > Categorias**.
2. Clique em Nova Categoria.
3. Informe nome e ordem.
4. Deixe ativa.
5. Salve e associe produtos.

## Erros comuns

- Categoria inativa esconde seus produtos do cardapio.
- Slugs repetidos nao sao permitidos dentro da mesma empresa.
- Uma categoria com produtos deve ser tratada com cuidado antes de desativar.

## Resposta ideal

**Pergunta:** Como organizo as categorias?

**Resposta ideal:** Acesse **Cardapio > Categorias** e ajuste a ordem de cada
uma. Coloque primeiro as categorias mais vendidas, como Combos ou Promocoes.
Depois salve e confira a barra horizontal do cardapio publico.

# Opcionais e adicionais
<!-- keywords: adicional adicionais opcional opcionais grupo bacon queijo tamanho borda complemento -->

## Finalidade

Grupos e itens de opcoes permitem personalizar um produto, por exemplo
Adicionais, Tamanho, Ponto da carne ou Borda.

## Onde fica

No cadastro ou detalhe do produto, por meio dos recursos de grupos de opcoes.

## Operacoes reais

- Criar grupo vinculado ao produto.
- Definir minimo, maximo, obrigatoriedade e ordem.
- Criar itens com preco adicional.
- Ativar, editar ou remover itens.

## Erros comuns

- Item inativo nao aparece no modal do produto.
- Preco adicional deve ser informado corretamente em centavos pelo backend.
- O total do checkout e recalculado no Rails; o frontend nao e a fonte final.

## Resposta ideal

**Pergunta:** Como coloco Bacon como adicional?

**Resposta ideal:** Abra o produto em **Cardapio > Produtos**, crie ou edite o
grupo **Adicionais** e adicione o item **Bacon** com o valor extra. Defina
quantos itens o cliente pode escolher, deixe o grupo e o item ativos e salve.
Depois teste abrindo o produto no cardapio.

# Banners do aplicativo
<!-- keywords: banner banners app capa promocao imagem destaque home -->

## Onde fica

`Cardapio > Banners do App` ou `/loja/:slug/admin/app-banners`

## Funcionalidades

- Criar banner com titulo, imagem e link.
- Ativar ou desativar.
- Ordenar exibicao.
- Remover banner.

## Resposta ideal

**Pergunta:** Como troco o banner da loja?

**Resposta ideal:** Va em **Cardapio > Banners do App**, edite o banner atual
ou crie um novo. Informe uma imagem publica, deixe ativo e ajuste a ordem.
Depois abra a home da loja para conferir o resultado.

# Clientes e enderecos
<!-- keywords: cliente clientes telefone whatsapp endereco enderecos historico pedidos recorrente busca cadastro -->

## Finalidade

Clientes reune cadastro, telefone, enderecos, historico de pedidos, total
gasto e recorrencia.

## Onde fica

- Lista: `Clientes & Promocoes > Clientes`
- Detalhe: `/loja/:slug/admin/customers/:id`

## Funcionalidades

- Buscar por nome ou telefone.
- Ver pedidos e total gasto.
- Editar dados basicos.
- Consultar enderecos.
- O checkout busca cliente por WhatsApp normalizado.

## Formatos de telefone

O lookup deve reconhecer formatos equivalentes, como `+55 21 95909-9803`,
`5521959099803`, `21959099803` e variacoes com zero de operadora quando
normalizaveis.

## Erros comuns

- **Cliente nao encontrado:** confira DDD e numero; tente sem pontuacao.
- **Endereco antigo:** abra o detalhe do cliente ou corrija no checkout.
- **Duplicidade:** o telefone e unico por empresa.

## Resposta ideal

**Pergunta:** Como encontro um cliente antigo?

**Resposta ideal:** Abra **Clientes & Promocoes > Clientes** e pesquise pelo
nome ou telefone com DDD. No detalhe voce encontra enderecos, historico,
quantidade de pedidos e total gasto. Se nao aparecer, confira se o numero foi
digitado com o DDD correto.

# Cupons
<!-- keywords: cupom cupons desconto promocao codigo percentual fixo validade minimo uso unico -->

## Onde fica

`Clientes & Promocoes > Cupons` ou `/loja/:slug/admin/coupons`

## Funcionalidades

- Desconto percentual ou fixo.
- Periodo de validade.
- Pedido minimo.
- Limite de usos.
- Uso unico por cliente.
- Ativar e desativar.
- Cupons gerados pela roleta.

## Passo a passo

1. Abra **Clientes & Promocoes > Cupons**.
2. Clique em Novo Cupom.
3. Defina codigo, tipo e valor do desconto.
4. Configure validade, pedido minimo e limites.
5. Ative, salve e teste no checkout.

## Erros comuns

- Cupom expirado ou ainda nao iniciado.
- Pedido abaixo do minimo.
- Limite de usos atingido.
- Cupom vinculado a outro cliente.
- Codigo digitado com espacos.

## Resposta ideal

**Pergunta:** Como criar um cupom?

**Resposta ideal:** Va em **Clientes & Promocoes > Cupons** e clique em **Novo
Cupom**. Escolha um codigo simples, defina se o desconto e percentual ou fixo,
configure validade e pedido minimo, deixe ativo e salve. Recomendo fazer um
pedido de teste antes de divulgar.

# Roleta
<!-- keywords: roleta premio premios giro giros cupom probabilidade cliente promocao -->

## Finalidade

A roleta fideliza clientes. Pedidos concluidos geram creditos de giro e os
premios podem criar cupons vinculados ao cliente.

## Onde fica

- Admin: `Clientes & Promocoes > Roleta`
- Publico: `/loja/:slug/roleta`

## Regras atuais

- Um giro a cada R$ 25,00 em pedido concluido.
- Giros expiram em 30 dias.
- Premios usam peso de probabilidade.
- Cupom de premio e de uso unico para o cliente.

## Resposta ideal

**Pergunta:** Como configuro a roleta?

**Resposta ideal:** Abra **Clientes & Promocoes > Roleta**, cadastre os
premios, informe desconto, validade e peso de chance, e deixe ativos apenas os
que deseja usar. Depois conclua um pedido de teste para gerar credito e valide
a pagina publica da roleta.

# Areas de entrega
<!-- keywords: area areas entrega zona zonas regiao bairro taxa frete prazo minimo alias cidade -->

## Onde fica

`Entrega > Areas de Entrega` ou `/loja/:slug/admin/delivery-zones`

## Funcionalidades

- Nome da regiao e cidade.
- Taxa de entrega.
- Pedido minimo.
- Prazo estimado.
- Apelidos para localizar bairros.
- Prioridade de correspondencia.
- Ativar ou remover.

## Erros comuns

- Bairro digitado nao corresponde aos nomes ou apelidos.
- Zona inativa nao aparece no checkout.
- Taxa errada por prioridade de correspondencia.
- Cliente fora da area quando o bloqueio estiver ativo.

## Resposta ideal

**Pergunta:** Como configuro a taxa de entrega?

**Resposta ideal:** Acesse **Entrega > Areas de Entrega**, abra a regiao e
informe a taxa, o pedido minimo e o prazo estimado. Adicione apelidos do bairro
quando houver variacoes de nome. Salve e teste no checkout com um endereco
dessa regiao.

# Motoboys
<!-- keywords: motoboy motoboys entregador entrega atribuir portal finalizar maps waze telefone financeiro -->

## Onde fica

- Admin: `Entrega > Motoboys`
- Portal: `/loja/:slug/motoboy/dashboard`
- Historico: `/loja/:slug/motoboy/history`
- Financeiro basico: `/loja/:slug/motoboy/financeiro`

## Funcionalidades

- Cadastrar e ativar motoboy.
- Login separado por telefone e senha.
- Atribuir pedido pronto.
- Abrir Maps, Waze ou contato do cliente.
- Finalizar entrega.
- Consultar historico e total de taxas.

## Fluxo

1. Cadastre o motoboy.
2. Deixe o pedido pronto.
3. Atribua o entregador no detalhe do pedido.
4. O pedido aparece no portal.
5. O motoboy finaliza e o pedido vai para o historico.

## Localizacao

Quando o pedido possui localizacao recebida pelo WhatsApp, Maps e Waze usam o
pin salvo. Sem pin, usam o endereco textual.

## Resposta ideal

**Pergunta:** Como cadastro motoboy?

**Resposta ideal:** Abra **Entrega > Motoboys**, clique em novo cadastro e
informe nome, telefone e senha de acesso. Deixe o motoboy ativo e salve.
Depois, em um pedido pronto, atribua esse motoboy e confirme se a entrega
apareceu no portal dele.

# Estoque e movimentacoes
<!-- keywords: estoque inventario item insumo entrada saida ajuste minimo baixo movimentacao custo unidade -->

## Onde fica

- `Estoque > Itens de Estoque`
- `Estoque > Movimentacoes`

## Funcionalidades

- Cadastrar insumo com unidade, custo, quantidade e minimo.
- Registrar entrada.
- Fazer ajuste de saldo.
- Consultar movimentos.
- Identificar estoque baixo.
- Vincular produto a item de estoque quando configurado.

## Erros comuns

- Quantidade ou unidade incorreta.
- Item inativo.
- Ajuste confundido com entrada.
- Estoque negativo sem justificativa.

## Resposta ideal

**Pergunta:** Como dou entrada no estoque?

**Resposta ideal:** Va em **Estoque > Itens de Estoque**, localize o insumo e
clique em **Entrada**. Informe a quantidade e uma observacao para auditoria.
Depois confira **Estoque > Movimentacoes** para validar o registro.

# Caixa
<!-- keywords: caixa abertura fechar fechamento suprimento sangria movimento dinheiro pix cartao diferenca -->

## Onde fica

`Financeiro > Caixa` ou `/loja/:slug/admin/cash-register`

## Funcionalidades

- Abrir com saldo inicial.
- Registrar suprimento, sangria e movimentos.
- Registrar vendas por forma de pagamento.
- Fechar com valor contado.
- Calcular esperado e diferenca.
- Consultar historico.

## Regras

- So pode existir um caixa aberto por empresa.
- Movimentos de pedido possuem protecao contra duplicidade.
- Fechamento registra usuario, horario, contado e diferenca.

## Resposta ideal

**Pergunta:** Como abro o caixa?

**Resposta ideal:** Entre em **Financeiro > Caixa**, informe o valor inicial e
clique em **Abrir Caixa**. Durante o expediente, registre suprimentos ou
sangrias quando necessario. No fim do dia, conte o dinheiro e use **Fechar
Caixa** para comparar com o valor esperado.

# Relatorios
<!-- keywords: relatorio relatorios periodo faturamento receita pedidos produtos status exportar csv indicadores -->

## Onde fica

`Financeiro > Relatorios` ou `/loja/:slug/admin/reports`

## Funcionalidades

- Filtro por periodo.
- Resumo de vendas.
- Produtos mais vendidos.
- Pedidos por status.
- Indicadores financeiros.
- Exportacao quando oferecida pela tela.

## Erros comuns

- Periodo sem dados.
- Pedidos cancelados nao entram como receita concluida.
- Valores diferentes do caixa por recorte de data ou forma de pagamento.

## Resposta ideal

**Pergunta:** Onde vejo o produto mais vendido?

**Resposta ideal:** Abra **Financeiro > Relatorios**, escolha o periodo e
consulte **Top Produtos**. Se nao houver resultado, aumente o intervalo e
confirme se existem pedidos validos nesse periodo.

# Pix manual
<!-- keywords: pix manual chave payload copia cola qr pagamento configuracoes receiver -->

## Finalidade

Pix manual apresenta a chave ou payload configurado pela loja. A confirmacao
nao e automatica pelo Mercado Pago.

## Onde fica

`Administracao > Configuracoes > Pagamentos / PIX`

## Configuracao

- Ativar Pix.
- Selecionar provider manual.
- Informar tipo e chave.
- Informar recebedor e cidade quando o payload precisar.
- Salvar e testar no checkout.

## Cuidados

- Nao confundir Pix manual com Pix Mercado Pago.
- O admin deve confirmar o recebimento conforme a operacao da loja.
- Nunca publicar credenciais secretas.

## Resposta ideal

**Pergunta:** Como configuro Pix manual?

**Resposta ideal:** Abra **Administracao > Configuracoes > Pagamentos / PIX**,
ative o Pix e escolha o modo manual. Informe o tipo e a chave, confira o nome
do recebedor e salve. Depois faca um pedido pequeno para validar o copia e cola.

# Mercado Pago e Pix automatico
<!-- keywords: mercado pago mercadopago pix automatico access token public key webhook qr code pagamento aprovado recusado expirado cancelado pending_payment -->

## Finalidade

O Mercado Pago cria cobranca Pix automatica. O pedido inicia aguardando
pagamento e so entra na operacao quando aprovado.

## Onde fica

`Administracao > Configuracoes > Pagamentos / PIX`

## Configuracao

1. Ative Mercado Pago.
2. Escolha `mercadopago` como provider Pix.
3. Informe o Access Token no campo protegido.
4. Salve.
5. Faca uma cobranca pequena de validacao.

## Fluxo de status

- Criado: `pending_payment`.
- Aprovado: pagamento `paid` e pedido `accepted`.
- Expirado: pagamento `expired` e pedido `cancelled`.
- Cancelado: pagamento `cancelled` e pedido `cancelled`.
- Recusado: pagamento `failed` e pedido `cancelled`.

## Seguranca

- Access Token fica no backend.
- O frontend recebe valor mascarado.
- O backend recalcula o total do pedido.
- O webhook deve validar a notificacao antes de alterar o pedido.
- Em ambiente local existe polling de status.

## Expiracao

Pedidos Pix pendentes por mais de tres minutos podem ser expirados pelo
service e pela task:

`rails payments:expire_pending_pix`

## Erros comuns

- **QR nao carrega no banco:** confira se a cobranca e real e se o Access Token
  e de producao.
- **Modo teste:** token `TEST-` ou `DEV-` gera comportamento de homologacao.
- **Pedido nao foi aceito:** consulte status do pagamento.
- **Pagamento aprovado sem atualizar:** verifique polling/webhook e logs.
- **QR expirou:** gere um novo pedido.

## Resposta ideal

**Pergunta:** Como configuro Mercado Pago?

**Resposta ideal:** Va em **Administracao > Configuracoes > Pagamentos / PIX**,
ative o Mercado Pago e informe o Access Token no campo protegido. Salve e faca
um pedido de valor baixo. O pedido deve ficar aguardando pagamento, gerar QR e
ser aceito automaticamente quando o Pix for aprovado.

# WhatsApp e Evolution Go
<!-- keywords: whatsapp evolution go instancia conexao conectado desconectado numero qrcode qr token apikey status -->

## Finalidade

Cada empresa usa uma unica instancia principal de WhatsApp. O frontend chama
o Rails, e o Rails conversa com a Evolution Go.

## Onde fica

- `Comunicacao > WhatsApp`
- QR: `/loja/:slug/admin/whatsapp/qrcode`
- Logs: `/loja/:slug/admin/whatsapp/logs`

## Funcionalidades

- Exibir status.
- Mostrar numero conectado.
- Gerar QR quando desconectado.
- Atualizar status.
- Preparar uma instancia quando a empresa ainda nao possui.

## Regras de seguranca

- Uma empresa, uma instancia.
- `instance_token` nunca aparece no frontend.
- API key global nunca aparece no frontend.
- QR fica oculto quando conectado.
- Nao desconectar ou excluir instancia sem intencao clara.

## Erros comuns

- **QR nao aparece:** a instancia pode estar conectada; atualize o status.
- **QR expirado:** gere novamente.
- **Desconectado:** abra o QR e leia com o aparelho da loja.
- **Status antigo:** clique em Atualizar status.

## Resposta ideal

**Pergunta:** Como conecto o WhatsApp?

**Resposta ideal:** Abra **Comunicacao > WhatsApp** e atualize o status. Se
estiver desconectado, entre em **QR Code**, gere o codigo e leia pelo WhatsApp
da loja em Aparelhos conectados. Quando aparecer **Conectado**, o QR sera
ocultado e o numero vinculado sera exibido.

# Templates WhatsApp
<!-- keywords: template templates whatsapp pedido aceito preparo pronto entrega finalizado cancelado mensagem automatica -->

## Onde fica

`Comunicacao > Templates WhatsApp`

## Templates operacionais

- `pedido_recebido`
- `pedido_aceito`
- `pedido_em_preparo`
- `pedido_pronto`
- `saiu_para_entrega`
- `pedido_finalizado`
- `pedido_cancelado`

## Padrao

Ativos por padrao:

- pedido aceito.
- saiu para entrega.
- pedido finalizado.

Os demais existem, mas podem ficar desativados.

## Regras

- Se o template estiver desativado, a mudanca de status nao envia.
- Todo envio gera log.
- Nome do cliente e nome da loja podem ser renderizados no texto.
- Mensagens automaticas nao devem ser confundidas com marketing.

## Resposta ideal

**Pergunta:** Como altero a mensagem de pedido aceito?

**Resposta ideal:** Acesse **Comunicacao > Templates WhatsApp**, abra
**Pedido aceito**, ajuste o texto e salve. Confirme que o template esta ativo.
Depois use um pedido de teste antes de aplicar no atendimento diario.

# Marketing WhatsApp
<!-- keywords: marketing whatsapp campanha campanhas destinatarios clientes massa promocao envio -->

## Onde fica

`Comunicacao > Marketing WhatsApp`

## Finalidade

Preparar campanhas para clientes da empresa. Marketing e separado das
mensagens automaticas de status.

## Cuidados

- Nao enviar em massa sem consentimento e revisao.
- Use apenas clientes da empresa atual.
- Evite frequencia excessiva.
- Confira numero, mensagem e publico.
- Campanhas reais devem respeitar limites e regras do WhatsApp.

## Resposta ideal

**Pergunta:** Posso mandar promocao para todos?

**Resposta ideal:** A area e **Comunicacao > Marketing WhatsApp**, mas antes
confirme consentimento, publico e texto. Comece com um grupo pequeno e nunca
misture campanha com templates operacionais de pedido. Se a funcao de envio
estiver bloqueada, abra um ticket para liberacao segura.

# Mesas e QR Code
<!-- keywords: mesa mesas qrcode qr comanda sessao atendimento local pedido mesa regenerar -->

## Onde fica

- Admin: `Operacao > Mesas`
- Publico: `/loja/:slug/mesa/:qrToken`

## Funcionalidades

- Criar e editar mesa.
- Ativar ou desativar.
- Gerar ou regenerar QR.
- Abrir sessao publica.
- Criar pedido vinculado a mesa.
- Exibir a mesa no pedido do admin.

## Erros comuns

- QR desativado.
- Token antigo depois de regenerar.
- Mesa inativa.
- Pedido aberto em QR de outra empresa.

## Resposta ideal

**Pergunta:** Como crio uma mesa QR?

**Resposta ideal:** Abra **Operacao > Mesas**, crie a mesa com numero e
lugares, deixe ativa e habilite o QR. Use **Gerar QR Code**, imprima o codigo e
teste pelo celular. Quando o cliente pedir por esse link, o pedido aparece
vinculado a mesa no painel.

# Horarios e status da loja
<!-- keywords: horario horarios aberta fechado fechada abrir fechar automatico funcionamento excecao pausa -->

## Onde fica

`Administracao > Configuracoes > Horarios`

## Funcionamento

- Horario por dia da semana.
- Abertura e fechamento.
- Intervalos quando configurados.
- Excecoes por data.
- Mensagem de loja fechada.
- Regra para bloquear pedidos fora do horario.

## Regra de virada do dia

Um horario como `15:00` ate `00:00` deve ser interpretado corretamente como
funcionamento ate a meia-noite. O status visual deve considerar o horario
atual e as excecoes.

## Resposta ideal

**Pergunta:** Como faco a loja abrir automaticamente?

**Resposta ideal:** Va em **Administracao > Configuracoes > Horarios**, ative
o dia e informe abertura e fechamento. Salve e confira a home. O status
publico usa esses horarios; use excecoes para feriados ou dias especiais.

# Configuracoes e identidade visual
<!-- keywords: configuracao configuracoes geral logo banner identidade visual cor template horario entrega pix impressao -->

## Onde fica

`Administracao > Configuracoes`

## Secoes

- Geral.
- Identidade visual.
- Entrega.
- Pagamentos / PIX.
- Horarios.
- Impressao / Nota.
- WhatsApp basico.

## Identidade visual

- Logo.
- Banner ou capa.
- Cores.
- Template visual.
- Titulo, destaque e subtitulo do hero.
- Imagem, posicao, zoom e sobreposicao do hero.

## Templates visuais

Registrados:

- `hamburgueria-classic`
- `hamburgueria-premium`
- `pizzaria-dark`
- `doceria-clean`
- `bebidas-neon`

## Resposta ideal

**Pergunta:** Como troco a logo?

**Resposta ideal:** Abra **Administracao > Configuracoes > Identidade visual**,
envie a nova logo ou informe uma URL publica e salve. Ela deve atualizar
cardapio, checkout, motoboy, login e impressao. Se nao aparecer, atualize a
pagina e confirme se a imagem abre diretamente no navegador.

**Pergunta:** Como escolho outro visual?

**Resposta ideal:** Na mesma area de **Identidade visual**, escolha o template
compativel com a categoria da loja e salve. Depois confira a home no desktop e
no celular, principalmente logo, hero, cores e cards de produto.

# Usuarios e permissoes
<!-- keywords: usuario usuarios admin atendente cozinha senha login acesso permissao desativar -->

## Onde fica

`Administracao > Usuarios`

## Funcionalidades

- Criar usuario.
- Definir papel.
- Editar.
- Desativar acesso.
- Separar admin, atendente e cozinha conforme regras da tela.

## Erros comuns

- Email ja utilizado.
- Usuario inativo.
- Papel sem acesso a determinada pagina.
- Sessao expirada com erro 401.

## Resposta ideal

**Pergunta:** Como crio um atendente?

**Resposta ideal:** Acesse **Administracao > Usuarios**, clique em novo
usuario, informe nome, email e senha e escolha o papel de atendente. Salve e
teste o login em uma janela anonima para confirmar quais telas ele pode usar.

# Suporte e tickets
<!-- keywords: suporte ticket tickets chamado resposta prioridade status resolver fechar erro ajuda -->

## Onde fica

- Loja: `Suporte`
- Master: `Tickets`

## Regras

- A loja abre, visualiza e responde tickets.
- A loja nao altera status.
- O suporte Master responde, altera status, resolve e fecha.
- Prioridade e status aparecem como badges.

## Passo a passo

1. Abra **Suporte**.
2. Clique em Novo Ticket.
3. Escreva um assunto objetivo.
4. Descreva o erro, tela e o que tentou fazer.
5. Envie e acompanhe a conversa.

## Resposta ideal

**Pergunta:** Como abro um ticket?

**Resposta ideal:** Entre em **Suporte**, clique em **Novo Ticket** e descreva
o problema com a tela, horario e mensagem de erro. Se puder, informe os passos
para reproduzir. Depois acompanhe as respostas na conversa; o status e
controlado pela equipe Replymesh.

# Notificacoes e atualizacoes
<!-- keywords: notificacao notificacoes sino alerta atualizacao atualizacoes lida novidade sistema -->

## Onde fica

- Sino no topo do painel.
- `Atualizacoes` no menu administrativo.

## Funcionalidades

- Listar notificacoes da empresa.
- Marcar uma ou todas como lidas.
- Exibir novidades e alteracoes do sistema.

## Resposta ideal

**Pergunta:** Como tiro o numero do sino?

**Resposta ideal:** Clique no sino no topo e marque as notificacoes como lidas.
Voce pode abrir uma por uma ou usar a opcao para marcar todas. O contador deve
sumir depois da atualizacao.

# Painel Master, empresas e onboarding
<!-- keywords: master empresa empresas onboarding criar loja slug admin plano dominio instancia configuracao -->

## Onde fica

- Empresas: `/empresas`
- Nova empresa: `/empresas/nova`
- Ativas, inativas e teste pelos filtros da tela.

## Onboarding automatico

Ao criar uma empresa, o service prepara:

- Company.
- Usuario administrador.
- CompanyMember.
- Assinatura.
- Dominio ou subdominio.
- StoreSetting.
- Formas de pagamento padrao.
- Horarios.
- Area de entrega padrao.
- Templates WhatsApp.
- Instancia WhatsApp preparada quando solicitado.
- ActivityLog.

## Erros comuns

- Slug invalido ou repetido.
- Email de admin ja cadastrado.
- Plano ausente.
- Empresa criada sem dados obrigatorios.

## Resposta ideal

**Pergunta:** O que acontece quando crio uma empresa?

**Resposta ideal:** Em **Empresas > Nova Empresa**, o onboarding cria a conta,
o admin, a assinatura, configuracoes basicas, horarios, area de entrega,
templates e dominio inicial. Depois recomendo entrar com o admin da loja,
revisar Configuracoes e cadastrar o cardapio.

# Planos e assinaturas
<!-- keywords: plano planos assinatura assinaturas mensalidade trial active overdue canceled suspended mrr -->

## Onde fica

- `Assinaturas > Visao Geral`
- `Planos`
- `Faturas`
- `Inadimplencia`

## Status

- trial.
- active.
- overdue.
- canceled.
- suspended.

## Funcionalidades

- Criar e editar planos.
- Ver empresas vinculadas.
- Alterar assinatura.
- Consultar MRR e inadimplencia.

## Resposta ideal

**Pergunta:** Como altero o plano de uma empresa?

**Resposta ideal:** No Painel Master, abra **Assinaturas**, localize a empresa
e edite a assinatura escolhendo o novo plano e status. Salve e confirme se o
valor e o periodo ficaram corretos.

# Dominios
<!-- keywords: dominio dominios subdominio customizado dns ssl pending active dns_error inactive certificado -->

## Onde fica

`Dominios`, com abas de DNS e SSL no Painel Master.

## Funcionalidades

- Criar dominio ou subdominio.
- Vincular a empresa.
- Definir primario.
- Desativar.
- Verificar DNS em modo disponivel.
- Acompanhar SSL.

## Status DNS

- pending.
- active.
- dns_error.
- inactive.

## Status SSL

- pending.
- active.
- error.

## Resposta ideal

**Pergunta:** Meu dominio esta com erro DNS. O que faco?

**Resposta ideal:** Abra **Dominios > Configuracao DNS**, confirme o dominio e
os registros configurados no provedor. Depois use **Verificar DNS**. Se
continuar em `dns_error`, abra um ticket com uma captura dos registros, sem
enviar senhas do provedor.

# Logs, alertas e auditoria
<!-- keywords: log logs alerta alertas auditoria atividade erro webhook evolution resolvido -->

## Onde fica

- Painel Master: `Logs`
- Alertas no Dashboard Master.
- WhatsApp possui logs proprios por empresa.

## Funcionalidades

- Filtrar por empresa, tipo, status e data.
- Ver criacao e alteracao de recursos.
- Consultar erros importantes.
- Resolver alertas.
- Acompanhar webhooks e Evolution.

## Resposta ideal

**Pergunta:** Onde vejo por que o WhatsApp falhou?

**Resposta ideal:** Na loja, abra **Comunicacao > WhatsApp > Logs**. No Painel
Master, use **Logs > Evolution** para uma visao global. Procure pelo horario e
empresa, mas nunca copie tokens ou chaves para um ticket.

# Carina IA
<!-- keywords: carina ia inteligencia artificial assistente suporte claude memoria contexto base conhecimento -->

## O que e

A Carina e a assistente oficial de suporte da plataforma Replymesh para donos,
administradores e atendentes.

## O que faz

- Explica telas e fluxos.
- Usa contexto seguro da empresa.
- Considera as ultimas dez mensagens da conversa.
- Busca trechos relevantes desta base.
- Sugere proximos passos.
- Usa Claude com fallback local.

## O que nao faz

- Nao atende consumidor final.
- Nao altera configuracoes automaticamente.
- Nao executa acoes em pedidos.
- Nao envia marketing.
- Nao revela chaves, tokens ou credenciais.
- Nao responde assuntos fora da Replymesh.

## Configuracao

Exclusiva do Painel Master em `Configuracoes > IA / Carina`.

## Resposta ideal

**Pergunta:** Voce e uma IA?

**Resposta ideal:** Sim, eu sou a Carina, assistente da Replymesh. Uso a base
real da plataforma e o contexto seguro da sua empresa para orientar voce. Eu
posso explicar como usar os modulos, mas nao altero dados sozinha. Em que
parte do sistema voce quer ajuda?

# Problemas comuns
<!-- keywords: problema problemas erro 401 500 login produto nao aparece pedido nao aparece qr code imagem dominio -->

## Erro 401 - Nao autorizado

1. A sessao pode ter expirado.
2. Saia e entre novamente pelo login da empresa.
3. Confirme se o slug da URL e o correto.
4. Se persistir, limpe apenas a sessao local e tente novamente.
5. Abra ticket com rota e horario.

## Erro 500 - Erro interno

1. Anote a tela e horario.
2. Repita uma vez.
3. Nao continue clicando varias vezes em acoes de criacao.
4. Abra ticket com os passos.
5. O suporte deve consultar logs Rails sem expor segredos.

## Produto nao aparece no cardapio

- Produto ativo.
- Categoria ativa.
- Empresa correta.
- Preco valido.
- Atualizar menu publico.

## Pedido nao aparece

- Empresa e slug corretos.
- Filtros de status/data.
- Pagamento automatico ainda pendente.
- Atualizar a lista.
- Conferir logs do checkout.

## Mercado Pago nao gera QR

- Provider Mercado Pago ativo.
- Access Token configurado.
- Token de producao para cobranca real.
- Total maior que zero.
- Consultar resposta segura do backend.

## WhatsApp desconectado

- Atualizar status.
- Gerar QR.
- Ler em Aparelhos conectados.
- Confirmar numero exibido.
- Consultar logs.

## Imagem nao aparece

- URL publica HTTPS.
- Arquivo acessivel sem login.
- Formato de imagem suportado.
- Salvar e atualizar.
- Usar fallback enquanto corrige.

## Falha de login

- Email correto.
- Senha correta.
- Usuario ativo.
- Empresa correta.
- Reset local somente por administrador autorizado.

## Problemas de dominio

- Conferir DNS.
- Verificar dominio no Master.
- Aguardar propagacao.
- Conferir SSL.
- Abrir ticket com os registros, nunca com senha.

# Glossario semantico
<!-- keywords: sinonimos vocabulario busca semantica termos -->

Use estes grupos como equivalentes durante a busca:

- produto, produtos, item, lanche, cardapio.
- adicional, opcional, complemento, extra.
- entrega, frete, taxa, zona, regiao, bairro.
- motoboy, entregador, delivery.
- pagamento, Pix, Mercado Pago, cobranca, QR.
- caixa, financeiro, abertura, fechamento, sangria, suprimento.
- estoque, inventario, insumo, movimentacao.
- cliente, consumidor, telefone, WhatsApp, endereco.
- pedido, venda, comanda, atendimento.
- suporte, ticket, chamado, ajuda, problema.
- WhatsApp, Evolution, instancia, conexao, QR Code.

# Historico da base
<!-- keywords: versao data alteracao changelog evolucao -->

| Versao | Data | Modulo | Alteracao |
|---|---|---|---|
| 1.0 | 2026-06-06 | Geral | Base inicial da assistente interna. |
| 2.0 | 2026-06-06 | Carina Premium | Reconstrucao baseada nas rotas, menus, models, controllers e services reais da Replymesh. |

## Regra para futuras versoes

Toda mudanca funcional relevante deve atualizar:

- Versao.
- Data.
- Modulo.
- Rotas ou telas afetadas.
- Novo comportamento.
- Erros conhecidos.
- Perguntas e respostas ideais.
