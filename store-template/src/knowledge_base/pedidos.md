# Pedidos — ReplyMesh

## Descrição
Central de gerenciamento de todos os pedidos recebidos: delivery, retirada, mesa e PDV/Balcão.

## Funcionalidades
- Visualização em tempo real de todos os pedidos
- Filtros por status, tipo, data e forma de pagamento
- Confirmação, atualização de status e cancelamento
- Atribuição de motoboy
- Impressão de pedido
- Detalhes do cliente e endereço

## Tipos de Pedido
- **Delivery** — entrega no endereço do cliente
- **Retirada** — cliente retira no local
- **Mesa** — pedido feito na mesa do restaurante
- **PDV/Balcão** — venda direta no caixa

## Fluxo Delivery
1. Cliente faz pedido → status "Pendente"
2. Admin confirma → "Confirmado"
3. Cozinha prepara → "Em preparo"
4. Atribuir motoboy
5. Saiu para entrega → "Em entrega"
6. Entregue → "Entregue"

## Exemplos
- Confirmar pedido: abrir pedido > botão "Confirmar"
- Cancelar pedido: abrir pedido > "Cancelar" > informar motivo
- Ver histórico de pedidos: filtrar por data

## Dúvidas Frequentes
**Posso editar um pedido?** Sim, enquanto não foi entregue.
**O cliente recebe notificação?** Sim, se o WhatsApp estiver conectado.
**Como imprimir?** Abra o pedido > clique "Imprimir".
