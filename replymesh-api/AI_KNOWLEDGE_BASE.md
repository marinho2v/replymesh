# Replymesh AI Knowledge Base

Esta base orienta a assistente interna do sistema Replymesh. Ela ajuda donos, administradores e atendentes a usar o painel da loja e o painel master.

## Regras de resposta

- Responder somente sobre o sistema Replymesh.
- Nao responder como atendimento ao cliente final no WhatsApp.
- Nao inventar produto, preco, prazo, pedido, status, motoboy, endereco, token ou chave.
- Se a informacao nao estiver disponivel, responder: "Nao tenho essa informacao ainda. Recomendo abrir um ticket para o suporte Replymesh."
- Sempre filtrar contexto por company_id.
- Nunca mencionar API keys, tokens, credenciais internas ou dados sensiveis.

## Produtos e categorias

Use Cardapio > Produtos para listar, criar, editar, ativar, desativar, destacar e ordenar produtos. Um produto precisa de nome, categoria e preco. Produtos inativos nao aparecem no cardapio publico.

Use Cardapio > Categorias para organizar o menu. Categorias inativas nao aparecem no cardapio publico.

## Pedidos

Pedidos aparecem em Operacao > Pedidos. O admin pode aceitar, preparar, marcar como pronto, enviar para entrega, finalizar ou cancelar. Pedidos Pix Mercado Pago so devem entrar no fluxo operacional depois do pagamento aprovado.

## Checkout

O checkout publico busca cliente por WhatsApp, permite endereco salvo, regiao de entrega, taxa, cupom, dinheiro com troco, Pix manual, Pix Mercado Pago e cartao na entrega. O backend recalcula totais.

## Mercado Pago e Pix

Mercado Pago gera QR Code e copia e cola no checkout. O Access Token fica somente no backend e aparece mascarado no painel. Pedido pendente de pagamento expira automaticamente pela rotina local.

Pix manual usa chave configurada na loja e nao confirma pagamento automaticamente.

## WhatsApp e Evolution Go

Cada empresa deve ter uma unica instancia WhatsApp. O QR Code aparece somente quando desconectado. Templates padrao existem por empresa; normalmente ficam ativos pedido_aceito, saiu_para_entrega e pedido_finalizado.

A API key global e o token da instancia nunca aparecem no frontend.

## Motoboy

O admin atribui pedido pronto a um motoboy. O portal do motoboy mostra entregas atribuidas, endereco, telefone, Maps, Waze e botao Finalizar entrega. Localizacao recebida pelo WhatsApp deve abrir no pin quando existir.

## Localizacao WhatsApp

Cliente envia localizacao para o WhatsApp da loja. Evolution envia webhook para Rails. Rails identifica a loja pela instancia, encontra o pedido aberto mais recente pelo telefone e salva latitude, longitude, Google Maps e Waze no pedido.

## Roleta e cupons

Cupons podem ser criados no painel e validados no checkout. A roleta usa premios configurados por empresa.

## Clientes

Clientes sao cadastrados a partir do checkout ou pelo painel. O sistema usa telefone/WhatsApp normalizado para localizar historico e enderecos.

## Suporte e tickets

Cliente da loja pode abrir ticket, ver respostas e responder. Somente suporte/master altera status, resolve ou fecha ticket.

## Mesas e QR Code

Mesas sao gerenciadas em Operacao > Mesas. Cada mesa pode ter QR Code. Pedidos feitos pelo QR ficam vinculados a mesa.

## Configuracoes

Configuracoes da loja controlam nome, logo, banner, cores, endereco, horarios, entrega, Pix, Mercado Pago, impressao e textos do hero publico. O status aberto/fechado deve respeitar horarios configurados.

## Caixa, estoque e relatorios

Caixa registra abertura, fechamento e movimentacoes. Estoque registra entradas, saidas e ajustes. Relatorios mostram resumo do periodo, produtos, status e financeiro quando houver dados.
