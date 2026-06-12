# PDV / Balcão — ReplyMesh

## Descrição
Sistema de Ponto de Venda para vendas rápidas no balcão. Requer caixa aberto.

## Funcionalidades
- Busca de produtos por nome/categoria
- Carrinho de compras
- Aplicação de desconto (valor ou percentual)
- Pagamento: Dinheiro, PIX, Cartão
- Cálculo automático de troco
- Comprovante/recibo imprimível
- Nova venda após finalizar

## Pré-requisito
**O caixa deve estar aberto.** Financeiro > Caixa > Abrir Caixa.

## Como Fazer uma Venda
1. Menu lateral > PDV / Balcão
2. Busque o produto e clique para adicionar
3. Ajuste a quantidade se necessário
4. Aplique desconto (botão Desconto) — opcional
5. Clique "Finalizar Venda"
6. Escolha forma de pagamento
7. No dinheiro: informe valor recebido (troco calculado automaticamente)
8. Confirme → comprovante gerado

## Como Imprimir Comprovante
Após a venda, clique "Imprimir" na modal do comprovante. Contém: número da venda, itens, total, pagamento, troco, data.

## Boas Práticas
- Sempre abra o caixa antes de iniciar o expediente
- Feche o caixa ao final do dia
- Confira o saldo físico no fechamento

## Dúvidas Frequentes
**Posso aplicar desconto?** Sim, antes de finalizar.
**Vendas no PDV vão para o WhatsApp?** Não. PDV não dispara notificações.
**Quem pode usar o PDV?** Apenas Admin e Caixa (cashier).
**Como cancelar uma venda?** Vá em Pedidos, filtre por origem PDV, cancele o pedido.
