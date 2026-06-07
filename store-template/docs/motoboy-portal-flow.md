# Fluxo Motoboy - Lanche do 2R

## Fluxo atual preservado

O painel admin continua funcionando como antes:

1. Admin/atendente recebe o pedido.
2. Admin/atendente aceita o pedido.
3. Admin/atendente avanca o status conforme o fluxo ativo.
4. Admin/atendente seleciona o motoboy no detalhe do pedido.
5. Admin/atendente envia a mensagem do pedido para o WhatsApp do motoboy.
6. Admin/atendente ainda pode finalizar/cancelar o pedido pelo painel.

## Novo fluxo adicional

O motoboy agora pode entrar em `/motoboy` com telefone e senha:

1. Admin cadastra ou edita o motoboy e define uma senha de acesso.
2. O sistema cria um login interno do tipo `motoboy`.
3. O motoboy entra em `/motoboy` usando o telefone cadastrado e a senha.
4. O motoboy ve apenas pedidos atribuidos ao proprio cadastro.
5. O motoboy pode abrir Maps, Waze e WhatsApp do cliente.
6. Ao clicar em `Finalizar entrega`, o pedido vira `Finalizado`.
7. O sistema marca a entrega como `Entregue`.
8. O sistema registra pagamento/caixa quando aplicavel.
9. O sistema libera giro da roleta quando o pedido cumprir a regra.
10. O cliente recebe a mensagem de pedido finalizado.

## Seguranca

- Motoboy nao acessa `/admin`.
- Motoboy nao ve pedidos de outros motoboys.
- Motoboy so finaliza pedido atribuido ao proprio `motoboy_id`.
- A Edge Function de WhatsApp so permite motoboy enviar mensagem de `completed` para pedido dele.

## Como desfazer a camada do motoboy

Para voltar ao fluxo antigo, basta remover a rota `/motoboy` do frontend e deixar o admin finalizando pelo painel. As tabelas e colunas adicionais podem permanecer sem afetar o fluxo antigo.
