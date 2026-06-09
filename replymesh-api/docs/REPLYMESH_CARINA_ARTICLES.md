# Primeiros passos
<!-- keywords: primeiros passos inicio comecar configurar loja onboarding -->
**Modulo:** Primeiros passos
**Pergunta:** Por onde comeco a configurar minha loja?

**Resposta ideal:** Comece em **Configuracoes > Loja** e revise nome, contato, endereco, logo e status. Depois configure horarios, regioes de entrega, formas de pagamento e cadastre o cardapio.

**Passo a passo:** 1. Revise os dados da loja. 2. Configure horarios e entrega. 3. Cadastre categorias e produtos. 4. Faca um pedido de teste.
**Observacoes:** Use dados reais da empresa e valide o cardapio publico antes de divulgar.
**Quando abrir ticket:** Se uma configuracao salva nao aparecer no painel ou na loja publica.

# Dashboard
<!-- keywords: dashboard inicio indicadores cards faturamento pedidos ticket medio -->
**Modulo:** Dashboard
**Pergunta:** Como vejo o resumo da loja?

**Resposta ideal:** Abra **Dashboard**. Os cards mostram pedidos, faturamento, ticket medio, clientes e status dos pedidos da empresa atual.

**Passo a passo:** 1. Escolha o periodo quando houver filtro. 2. Confira os cards. 3. Abra o modulo detalhado para investigar um numero.
**Observacoes:** Os dados respeitam a empresa e o periodo selecionado.
**Quando abrir ticket:** Se o card ficar sem dados depois de atualizar a pagina e confirmar que existem pedidos no periodo.

# Empresas
<!-- keywords: empresas master criar empresa onboarding entrar como empresa suporte -->
**Modulo:** Empresas
**Pergunta:** Como crio ou acesso uma empresa?

**Resposta ideal:** No Painel Master, abra **Empresas**. Use **Nova empresa** para cadastrar ou **Entrar como empresa** para acessar o painel da loja em modo suporte.

**Passo a passo:** 1. Informe nome, slug, plano e responsavel. 2. Salve. 3. Abra a empresa. 4. Use o acesso de suporte quando precisar validar o painel.
**Observacoes:** Somente o Master pode acessar empresas diferentes; usuarios da loja ficam isolados pelo `company_id`.
**Quando abrir ticket:** Se a empresa for criada sem configuracoes iniciais ou o acesso de suporte falhar.

# Produtos
<!-- keywords: produto produtos cadastrar editar ativar desativar excluir preco cardapio -->
**Modulo:** Produtos
**Pergunta:** Como cadastro um produto?

**Resposta ideal:** Abra **Cardapio > Produtos**, clique em **Novo produto**, informe nome, categoria, preco e descricao, adicione a imagem e salve.

**Passo a passo:** 1. Crie ou escolha a categoria. 2. Informe nome e preco. 3. Configure imagem e adicionais. 4. Ative e salve.
**Observacoes:** Produto desativado nao deve aparecer no cardapio publico.
**Quando abrir ticket:** Se o produto ativo nao aparecer depois de confirmar categoria ativa e atualizar o cardapio.

# Categorias
<!-- keywords: categoria categorias editar ordem organizar cardapio ativar desativar -->
**Modulo:** Categorias
**Pergunta:** Como edito uma categoria?

**Resposta ideal:** Abra **Cardapio > Categorias**, localize a categoria, clique em editar, ajuste nome, ordem ou status e salve.

**Passo a passo:** 1. Abra Categorias. 2. Edite a categoria. 3. Ajuste a ordem. 4. Confirme no cardapio publico.
**Observacoes:** Categoria desativada esconde seus produtos no menu.
**Quando abrir ticket:** Se a ordem ou o status nao forem refletidos no cardapio.

# Imagens do cardapio
<!-- keywords: imagem imagens foto fotos produto tamanho proporcao resolucao upload -->
**Modulo:** Imagens do cardapio
**Pergunta:** Qual tamanho da foto do produto?

**Resposta ideal:** Use imagem horizontal, de preferencia **1200x800**, em proporcao **3:2 ou 4:3**, sem muito texto. No painel, va em **Cardapio > Produtos > Editar produto > Imagem**.

**Passo a passo:** 1. Prepare JPG, PNG ou WebP. 2. Abra o produto. 3. Envie a imagem. 4. Salve e confira no cardapio.
**Observacoes:** Centralize o produto e evite arquivos muito pesados.
**Quando abrir ticket:** Se um formato aceito concluir o upload mas a imagem nao abrir.

# Pedidos
<!-- keywords: pedido pedidos aceitar cancelar pending accepted preparing ready completed status -->
**Modulo:** Pedidos
**Pergunta:** Como aceito um pedido?

**Resposta ideal:** Abra **Pedidos**, selecione o pedido pendente e clique em **Aceitar**. Depois acompanhe o fluxo de preparo, entrega e finalizacao.

**Passo a passo:** 1. Abra o pedido. 2. Confira itens, endereco e pagamento. 3. Clique em Aceitar. 4. Atualize o status conforme o atendimento.
**Observacoes:** Pedido Pix automatico pendente so deve avancar depois da confirmacao do pagamento.
**Quando abrir ticket:** Se um pedido valido nao mudar de status ou desaparecer da empresa correta.

# KDS / Cozinha
<!-- keywords: kds cozinha preparo preparando pronto tela cozinha -->
**Modulo:** KDS / Cozinha
**Pergunta:** Como uso a tela da cozinha?

**Resposta ideal:** Abra **Cozinha / KDS**. Aceite o item em preparo, acompanhe o tempo e marque como pronto quando a producao terminar.

**Passo a passo:** 1. Abra o KDS. 2. Selecione o pedido. 3. Inicie o preparo. 4. Marque como pronto.
**Observacoes:** O perfil cozinha deve ver apenas os modulos necessarios para producao.
**Quando abrir ticket:** Se pedidos aceitos nao aparecerem no KDS.

# Motoboy
<!-- keywords: motoboy entregador atribuir entrega portal finalizar maps waze -->
**Modulo:** Motoboy
**Pergunta:** Como atribuo um motoboy?

**Resposta ideal:** Abra o pedido em **Pedidos**, escolha **Atribuir motoboy** e selecione um entregador ativo. O pedido aparecera no painel desse motoboy.

**Passo a passo:** 1. Cadastre e ative o motoboy. 2. Abra o pedido. 3. Selecione o motoboy. 4. Confirme a atribuicao.
**Observacoes:** Ao finalizar, o pedido sai das entregas ativas e entra no historico.
**Quando abrir ticket:** Se o pedido atribuido nao aparecer para o motoboy correto.

# Localizacao do cliente
<!-- keywords: localizacao cliente whatsapp mapa maps waze pin latitude longitude endereco -->
**Modulo:** Localizacao do cliente
**Pergunta:** Como funciona a localizacao enviada pelo cliente?

**Resposta ideal:** Depois que o cliente envia a localizacao pelo WhatsApp, o pedido mostra a confirmacao de localizacao e os botoes **Maps** e **Waze** usam o ponto recebido. Sem ponto, o sistema usa o endereco.

**Passo a passo:** 1. Aceite o pedido. 2. Aguarde o cliente enviar a localizacao. 3. Atualize o pedido. 4. Abra Maps ou Waze.
**Observacoes:** A localizacao deve ficar vinculada somente ao pedido e a empresa corretos.
**Quando abrir ticket:** Se o WhatsApp recebeu o mapa, mas o pedido nao mostrar a confirmacao.

# WhatsApp / Evolution
<!-- keywords: whatsapp evolution instancia conectar desconectado status numero mensagem -->
**Modulo:** WhatsApp / Evolution
**Pergunta:** Como conecto o WhatsApp?

**Resposta ideal:** Va em **WhatsApp > QR Code**, crie ou sincronize a instancia da empresa e leia o QR Code com o WhatsApp da loja.

**Passo a passo:** 1. Abra WhatsApp. 2. Crie ou sincronize a instancia. 3. Gere o QR Code. 4. Leia no aparelho e aguarde o status conectado.
**Observacoes:** Token, webhook e eventos sao configuracoes tecnicas automaticas e nao devem ser editados pelo cliente.
**Quando abrir ticket:** Se o QR expirar repetidamente ou o status continuar desconectado apos a leitura.

# QR Code WhatsApp
<!-- keywords: qr qrcode qr code whatsapp ler codigo parear celular instancia -->
**Modulo:** QR Code WhatsApp
**Pergunta:** Onde gero o QR Code do WhatsApp?

**Resposta ideal:** Abra **WhatsApp > QR Code**, clique em criar ou conectar instancia e leia o codigo em **Aparelhos conectados** no WhatsApp da loja.

**Passo a passo:** 1. Abra o WhatsApp no celular. 2. Entre em Aparelhos conectados. 3. Leia o QR do painel. 4. Aguarde a confirmacao.
**Observacoes:** Nao recrie uma instancia que ja esta conectada; primeiro use sincronizar.
**Quando abrir ticket:** Se o painel tentar recriar uma instancia existente ou nao gerar o codigo.

# Templates WhatsApp
<!-- keywords: template templates whatsapp mensagem automatica pedido aceito finalizado entrega -->
**Modulo:** Templates WhatsApp
**Pergunta:** Como ativo uma mensagem automatica?

**Resposta ideal:** Abra **WhatsApp > Templates**, edite o evento desejado, ajuste o texto, ative o template e salve.

**Passo a passo:** 1. Escolha o evento. 2. Revise as variaveis. 3. Ative. 4. Faca um pedido de teste.
**Observacoes:** Template inativo nao deve enviar mensagem.
**Quando abrir ticket:** Se o template ativo nao gerar log ou enviar no evento errado.

# Marketing WhatsApp
<!-- keywords: marketing whatsapp campanha disparo clientes promocao lista envio -->
**Modulo:** Marketing WhatsApp
**Pergunta:** Como faco uma campanha de WhatsApp?

**Resposta ideal:** Abra **Marketing WhatsApp**, crie a campanha, escolha os clientes da empresa, revise a mensagem e confirme o envio quando a funcao estiver liberada.

**Passo a passo:** 1. Crie a campanha. 2. Selecione o publico. 3. Revise texto e limite. 4. Confirme o envio.
**Observacoes:** Respeite consentimento, limites e regras do WhatsApp; dados nunca podem misturar empresas.
**Quando abrir ticket:** Se destinatarios de outra empresa aparecerem ou o envio autorizado nao gerar logs.

# Recuperador de vendas
<!-- keywords: recuperador recuperacao vendas carrinho abandonado pedido campanha retorno -->
**Modulo:** Recuperador de vendas
**Pergunta:** Como uso o recuperador de vendas?

**Resposta ideal:** Abra **Recuperador de vendas**, filtre os clientes elegiveis, selecione os contatos e crie uma campanha em rascunho para revisar no Marketing WhatsApp.

**Passo a passo:** 1. Escolha o periodo. 2. Revise os clientes. 3. Selecione os contatos. 4. Crie e revise a campanha.
**Observacoes:** O recuperador nao deve enviar automaticamente sem confirmacao.
**Quando abrir ticket:** Se clientes elegiveis nao aparecerem ou dados de outra loja forem exibidos.

# Clientes
<!-- keywords: cliente clientes buscar telefone historico pedido endereco editar -->
**Modulo:** Clientes
**Pergunta:** Como encontro o historico de um cliente?

**Resposta ideal:** Abra **Clientes**, pesquise por nome ou telefone e abra o cadastro para ver pedidos e enderecos salvos.

**Passo a passo:** 1. Pesquise o cliente. 2. Abra o cadastro. 3. Consulte pedidos. 4. Revise ou edite os dados basicos.
**Observacoes:** Clientes ficam isolados por empresa.
**Quando abrir ticket:** Se um cliente aparecer em outra empresa ou o historico estiver incompleto.

# Cupons
<!-- keywords: cupom cupons desconto percentual fixo validade ativo checkout -->
**Modulo:** Cupons
**Pergunta:** Como crio um cupom?

**Resposta ideal:** Abra **Clientes e Promocoes > Cupons**, clique em novo cupom, escolha desconto percentual ou fixo, defina validade e regras, ative e salve.

**Passo a passo:** 1. Informe codigo e titulo. 2. Escolha o tipo de desconto. 3. Defina validade e minimo. 4. Ative e teste no checkout.
**Observacoes:** Cupom expirado ou inativo nao deve aplicar desconto.
**Quando abrir ticket:** Se o checkout aceitar cupom invalido ou calcular desconto incorreto.

# Roleta
<!-- keywords: roleta giro giros premio cupom cliente pedido completed -->
**Modulo:** Roleta
**Pergunta:** Como funciona a roleta?

**Resposta ideal:** A roleta libera giros para o cliente conforme as regras da empresa depois que o pedido e finalizado. O premio pode gerar um cupom pessoal de uso unico.

**Passo a passo:** 1. Configure os premios. 2. Defina pesos e validade. 3. Finalize um pedido elegivel. 4. Confira credito e historico.
**Observacoes:** O padrao atual e um giro a cada R$ 25 em pedidos concluidos.
**Quando abrir ticket:** Se um pedido nao concluido gerar giro ou o cupom ficar vinculado a outro cliente.

# Caixa
<!-- keywords: caixa abrir fechar sangria suprimento movimento fechamento diferenca -->
**Modulo:** Caixa
**Pergunta:** Como abro o caixa?

**Resposta ideal:** Abra **Caixa**, clique em abrir, informe o valor inicial e registre suprimentos ou sangrias durante o turno.

**Passo a passo:** 1. Abra o caixa. 2. Informe o saldo inicial. 3. Registre movimentos. 4. Confira e feche no fim do turno.
**Observacoes:** Movimentos pertencem somente a empresa e ao caixa atual.
**Quando abrir ticket:** Se o fechamento nao refletir os movimentos registrados.

# Estoque
<!-- keywords: estoque item insumo entrada saida ajuste minimo movimentacao -->
**Modulo:** Estoque
**Pergunta:** Como ajusto o estoque?

**Resposta ideal:** Abra **Estoque > Itens**, escolha o item e registre uma entrada, saida ou ajuste com quantidade e motivo.

**Passo a passo:** 1. Cadastre o item. 2. Defina unidade e minimo. 3. Registre a movimentacao. 4. Confira o saldo.
**Observacoes:** Evite editar saldo sem registrar o motivo.
**Quando abrir ticket:** Se uma movimentacao salva nao alterar o saldo correto.

# Mesas / QR de mesa
<!-- keywords: mesa mesas qr qrcode comanda atendimento local pedido -->
**Modulo:** Mesas / QR de mesa
**Pergunta:** Como gero o QR Code de uma mesa?

**Resposta ideal:** Abra **Mesas**, crie ou edite a mesa e use a opcao de QR Code para gerar o acesso publico associado a ela.

**Passo a passo:** 1. Crie a mesa. 2. Ative. 3. Gere o QR. 4. Leia o codigo e confirme a associacao no pedido.
**Observacoes:** Uma mesa desativada nao deve aceitar novos pedidos.
**Quando abrir ticket:** Se o QR abrir outra empresa ou nao associar a mesa.

# Relatorios
<!-- keywords: relatorio relatorios faturamento vendas pedidos periodo exportar indicadores -->
**Modulo:** Relatorios
**Pergunta:** Como vejo relatorio?

**Resposta ideal:** Abra **Relatorios**, escolha o periodo e o tipo de analise. Confira faturamento, pedidos, produtos e formas de pagamento; exporte quando a tela oferecer essa opcao.

**Passo a passo:** 1. Defina inicio e fim. 2. Aplique os filtros. 3. Confira os indicadores. 4. Exporte se necessario.
**Observacoes:** Compare sempre o mesmo periodo e a mesma empresa.
**Quando abrir ticket:** Se os totais divergirem dos pedidos concluidos do periodo.

# Mercado Pago / Pix
<!-- keywords: mercado pago mercadopago pix automatico access token public key pagamento qr -->
**Modulo:** Mercado Pago / Pix
**Pergunta:** Como configuro Pix Mercado Pago?

**Resposta ideal:** Abra **Configuracoes > Pagamentos**, ative Mercado Pago, informe **Public Key** e **Access Token** nos campos protegidos, salve e faca uma cobranca pequena de teste.

**Passo a passo:** 1. Obtenha as credenciais da conta da loja. 2. Informe nos campos protegidos. 3. Salve. 4. Gere e valide um Pix de teste.
**Observacoes:** Nunca envie Access Token em chat ou ticket. A confirmacao automatica depende da consulta segura do pagamento pelo backend.
**Quando abrir ticket:** Se o Pix for pago no provedor e continuar pendente depois da atualizacao.

# Configuracoes da loja
<!-- keywords: configuracoes loja nome telefone whatsapp endereco logo banner status -->
**Modulo:** Configuracoes da loja
**Pergunta:** Como altero os dados da loja?

**Resposta ideal:** Abra **Configuracoes > Loja**, atualize nome, telefone, WhatsApp, endereco, identidade visual e status, depois salve.

**Passo a passo:** 1. Abra a secao correta. 2. Edite os campos. 3. Salve. 4. Atualize a loja publica para conferir.
**Observacoes:** Logo e banner devem usar formatos aceitos e fallback quando estiverem vazios.
**Quando abrir ticket:** Se os dados salvos nao aparecerem no painel ou no site publico.

# Horarios
<!-- keywords: horario horarios funcionamento abrir fechar dia semana pausa loja fechada -->
**Modulo:** Horarios
**Pergunta:** Como altero o horario da loja?

**Resposta ideal:** Abra **Configuracoes > Horarios**, escolha o dia, marque se abre, informe abertura, fechamento e pausa quando necessario, depois salve.

**Passo a passo:** 1. Selecione o dia. 2. Ative ou marque fechado. 3. Informe os horarios. 4. Salve e confira o status publico.
**Observacoes:** Checkout deve bloquear pedidos fora do horario quando essa regra estiver ativa.
**Quando abrir ticket:** Se o status aberto/fechado nao seguir o horario salvo.

# Regioes de entrega
<!-- keywords: regiao regioes entrega bairro taxa frete minimo prazo alias -->
**Modulo:** Regioes de entrega
**Pergunta:** Como cadastro regiao de entrega?

**Resposta ideal:** Abra **Areas de Entrega**, clique em nova regiao, informe bairro ou area, taxa, pedido minimo, prazo e apelidos de busca, depois ative e salve.

**Passo a passo:** 1. Informe o nome da regiao. 2. Defina taxa e prazo. 3. Adicione aliases. 4. Ative e teste no checkout.
**Observacoes:** O checkout deve usar a regiao da empresa atual.
**Quando abrir ticket:** Se o bairro correto receber taxa de outra regiao ou outra empresa.

# Suporte / Tickets
<!-- keywords: suporte ticket tickets chamado ajuda erro falar atendimento novo ticket -->
**Modulo:** Suporte / Tickets
**Pergunta:** Como eu abro um ticket?

**Resposta ideal:** Abra o menu **Suporte**, clique em **Novo Ticket**, descreva o problema e envie. Se puder, anexe um print do erro.

**Pergunta:** Como eu falo com suporte?

**Resposta ideal:** Entre em **Suporte**, abra um novo ticket ou responda um ticket existente. Informe a tela, o horario e o que aconteceu, sem enviar senhas ou tokens.

**Passo a passo:** 1. Abra Suporte. 2. Clique em Novo Ticket. 3. Descreva o problema. 4. Anexe uma imagem segura e envie.
**Observacoes:** Nunca inclua senha, token, chave de API ou dados de pagamento.
**Quando abrir ticket:** Quando a orientacao da Carina nao resolver ou houver erro persistente.

# Aplicativo Android
<!-- keywords: aplicativo android app solicitar app loja publicacao -->
**Modulo:** Aplicativo Android
**Pergunta:** Como solicito o aplicativo Android?

**Resposta ideal:** Abra **Aplicativo Android**, revise os dados e a identidade visual da loja e envie a solicitacao para analise da Replymesh.

**Passo a passo:** 1. Confirme logo e nome. 2. Revise banners. 3. Envie a solicitacao. 4. Acompanhe o status.
**Observacoes:** A publicacao depende da preparacao e aprovacao do aplicativo.
**Quando abrir ticket:** Se a solicitacao nao for registrada ou o status ficar sem atualizacao.

# Dominios
<!-- keywords: dominio dominios subdominio dns ssl certificado url loja -->
**Modulo:** Dominios
**Pergunta:** Como altero o dominio da loja?

**Resposta ideal:** No Painel Master, abra a empresa e acesse **Dominios**. Cadastre o dominio, configure o DNS solicitado e aguarde a validacao de SSL.

**Passo a passo:** 1. Cadastre o host. 2. Configure o DNS. 3. Aguarde a propagacao. 4. Valide HTTPS.
**Observacoes:** A loja nao deve editar Traefik, certificados ou servidores.
**Quando abrir ticket:** Se o DNS estiver correto mas o status continuar com erro ou certificado padrao.

# Planos / Assinatura
<!-- keywords: plano planos assinatura mensalidade trial ativo vencido upgrade -->
**Modulo:** Planos / Assinatura
**Pergunta:** Onde vejo meu plano?

**Resposta ideal:** Abra **Plano / Assinatura** para consultar o plano atual, status, limites e recursos disponiveis.

**Passo a passo:** 1. Abra a assinatura. 2. Confira o status. 3. Revise os recursos. 4. Solicite alteracao ao suporte quando necessario.
**Observacoes:** Alteracoes comerciais e cobrancas devem ser confirmadas pela Replymesh.
**Quando abrir ticket:** Se o plano ativo nao liberar um recurso contratado.

# IA da loja
<!-- keywords: ia loja assistente cliente final configurar produtos horarios entrega pagamento -->
**Modulo:** IA da loja
**Pergunta:** Como configuro IA da loja?

**Resposta ideal:** Abra **Configuracoes > IA da loja**, defina nome, tom, limite e assuntos permitidos, salve e use o simulador antes de ativar respostas.

**Passo a passo:** 1. Configure nome e tom. 2. Escolha os assuntos. 3. Teste no simulador. 4. Ative somente depois de revisar.
**Observacoes:** A IA da loja atende o cliente final e usa somente dados da empresa; ela nao substitui a Carina.
**Quando abrir ticket:** Se responder sobre outra empresa, revelar dado tecnico ou ignorar as permissoes.

# Seguranca / permissoes
<!-- keywords: seguranca permissoes usuario perfil admin atendente cozinha motoboy acesso empresa -->
**Modulo:** Seguranca / permissoes
**Pergunta:** Como configuro o acesso de um usuario?

**Resposta ideal:** Abra **Usuarios**, crie ou edite o usuario, escolha o perfil correto e mantenha acesso apenas aos modulos necessarios.

**Passo a passo:** 1. Cadastre o usuario. 2. Escolha a empresa. 3. Defina o perfil. 4. Ative e teste o login.
**Observacoes:** Usuarios comuns nunca podem acessar outra empresa; somente o super admin usa acesso de suporte auditado.
**Quando abrir ticket:** Se um usuario enxergar modulo ou dados fora da permissao.
