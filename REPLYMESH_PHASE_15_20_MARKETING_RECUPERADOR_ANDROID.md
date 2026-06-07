# Fase 15.20 - Marketing, Recuperador e Android

## Marketing WhatsApp

A tela passou a carregar clientes reais do Rails, isolados pela empresa
autenticada. Sao exibidos nome, telefone, pedidos, total gasto, ultimo pedido
e localidade.

Filtros disponiveis:

- todos;
- recorrentes;
- novos;
- sem pedido ha 30, 60 ou 90 dias.

O envio individual usa a instancia Evolution da empresa e registra
`MarketingMessageLog`. Nenhum envio real foi executado durante os testes.

Campanhas guardam mensagem, cupom, pausa, limite e destinatarios. Criar uma
campanha nao envia mensagens. O disparo exige acao separada e confirmacao.

## Recuperador de Vendas

A rota `/loja/:slug/admin/sales-recovery` lista clientes sem comprar ha
7, 15, 30, 60 ou 90 dias, com ultimo pedido, dias inativos, quantidade de
pedidos, total gasto e ticket medio.

## Aplicativo Android

O item `Banners do App` foi substituido por `Aplicativo Android`. A loja envia:

- nome e nome exibido;
- logo, icone e splash;
- cores;
- WhatsApp de suporte;
- observacoes.

O Painel Master em `/aplicativos-android` acompanha e altera os status:
solicitado, em analise, em desenvolvimento, publicando, publicado, ajustes,
atualizacao pendente e atualizado.

No painel da loja, o modulo foi movido para Comunicacao e organizado em uma
pagina unica:

- solicitacao;
- banners do aplicativo;
- mensagens.

As mensagens atuais usam Evolution Go e o WhatsApp conectado. Push nativo
depende da existencia futura do APK.

Foi corrigida a selecao da instancia: a Demo possuia uma instancia antiga
desconectada e outra conectada. O envio agora usa
`WhatsappInstance.primary_for_company`, priorizando a conectada.

O fallback visual `/capa.jpeg` foi removido do hero. A imagem configurada pela
empresa nao e mais precedida pela antiga imagem de hamburguer.

## Testes

- migration aplicada;
- rotas conferidas;
- sintaxe Ruby valida;
- Zeitwerk aprovado;
- 14 clientes elegiveis encontrados na Demo Hamburgueria;
- campanha de teste criada em rascunho e removida;
- solicitacao Android local criada;
- lint do Painel Master aprovado;
- builds do Master e store-template aprovados.

Nenhuma mensagem de marketing real foi enviada.

## Futuro

- App Cliente;
- App Motoboy;
- APK padrao Replymesh;
- personalizacao automatizada;
- atualizacao global;
- vinculo com planos Pro/Premium.

VPS, deploy, Flutter e Fase 16 nao foram iniciados.
