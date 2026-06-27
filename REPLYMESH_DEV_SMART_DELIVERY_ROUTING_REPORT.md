# REPLYMESH DEV — LOGÍSTICA INTELIGENTE POR REGIÃO E ROTA DO MOTOBOY

Status: implementado na branch `dev`.

## Escopo preservado

- Produção/VPS/main não foram alteradas.
- O checkout público continua usando a seleção de região/área de entrega.
- A localização recebida pelo WhatsApp/Evolution continua preservada e segue tendo prioridade nos botões Maps/Waze.
- O preço da entrega continua vindo da área de entrega escolhida.
- Pedidos antigos continuam funcionando: os novos campos de logística aceitam valor vazio.

## O que foi implementado

### Áreas de entrega

Novos campos internos para operação:

- distância estimada em km;
- grupo de rota;
- latitude/longitude de referência;
- observação interna.

Esses dados são administrativos e não são expostos no endpoint público de loja.

### Pedidos

Ao criar um pedido, a Replymesh salva um snapshot da área selecionada:

- nome da área;
- distância estimada;
- tempo estimado;
- grupo logístico;
- prioridade de rota.

Isso evita que pedidos antigos mudem de informação se a área for editada depois.

### Rota do motoboy

Foi criado um serviço interno de sugestão de rota que ordena entregas por:

1. grupo logístico;
2. distância estimada;
3. prioridade;
4. data do pedido.

Também gera um link de rota no Google Maps. Quando o cliente envia a localização real pelo WhatsApp, o sistema usa o pin real; quando não existe pin, usa o endereço digitado.

### Painel da loja

- A tela de Áreas de Entrega permite configurar os novos campos.
- O teste de correspondência agora encontra a região real e mostra taxa, tempo, distância, grupo e prioridade.
- Ao atribuir motoboy a um pedido, o painel exibe uma sugestão de rota quando houver mais de uma entrega para o motoboy.

### Painel do motoboy

- As entregas atribuídas passam a vir ordenadas pela sugestão de rota.
- Quando houver mais de uma entrega, aparece o botão “Abrir rota no Maps”.
- Cada entrega mostra a área, distância/tempo estimados e grupo quando disponíveis.
- Os botões individuais Maps/Waze continuam priorizando a localização enviada pelo cliente no WhatsApp.

## Validações executadas

- `ruby -c` nos arquivos Ruby alterados.
- `git diff --check`.
- `npm run build` em `store-template`.
- `ruby bin/rails db:migrate` no container local DEV.
- Auditoria de segredos nos arquivos alterados.

## Observações

- O comando `docker exec replymesh-api-dev-local bin/rails db:migrate` falhou por final de linha CRLF no shebang do `bin/rails` dentro do container. Foi executado com sucesso usando `docker exec replymesh-api-dev-local ruby bin/rails db:migrate`.
- Esta fase não implementa cálculo real por geolocalização/Google Distance Matrix. A distância é informada pela loja na área de entrega e serve para organização operacional.
