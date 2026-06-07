# Fase 15.14 - Central de Atualizacoes e Notificacoes

Data: 06/06/2026

## Resultado

A central de atualizacoes foi migrada de uma lista estatica para dados reais do Rails.
O painel master controla criacao, edicao, publicacao, publico e exclusao. As lojas
recebem somente publicacoes elegiveis para sua empresa ou plano.

## Backend

- `SystemUpdate` armazena titulo, resumo, conteudo, versao, tipo, status, publico,
  destaque, publicacao, icone, cor, link e imagem.
- `SystemUpdateRead` registra leitura por empresa e usuario.
- Publicacao cria notificacoes idempotentes para lojas elegiveis e painel master.
- Exclusao remove as notificacoes vinculadas.
- Publico suportado: todas as empresas, plano ou empresa especifica.
- Notificacao de WhatsApp desconectado e criada somente na mudanca para esse estado.

## Interfaces

- Master: `http://127.0.0.1:5173/configuracoes/atualizacoes`
- Loja: `/loja/:slug/admin/updates`
- O sino dos dois paineis usa contagem real.
- O tema claro/escuro do master e salvo em `localStorage`.
- A loja permanece em tema escuro.

## Dados locais

Sete atualizacoes foram adicionadas aos seeds, da Fase 15.5 ate a Fase 15.13.
Todas usam publico global e aparecem para Demo Hamburgueria e Demo Pizza.

## Testes executados

- Migrations aplicadas.
- Seeds executados de forma idempotente.
- CRUD controlado criado, editado, publicado, exibido nas duas lojas e removido.
- Leitura reduziu o contador da Demo Hamburgueria de 7 para 6.
- Tema escuro ativado e preservado apos reload.
- Dropdown do sino master aberto com sete notificacoes.
- `empresas?tab=inativas` abriu sem erro.
- Sintaxe Ruby validada.
- Builds dos dois frontends aprovados.
- Lint do painel master aprovado.

## Pendencias antes da VPS

- Nao houve deploy ou configuracao de infraestrutura.
- A entrega por polling permanece em 60 segundos; tempo real pode ser avaliado depois.
- O aviso de bundle JavaScript maior que 500 kB continua nao bloqueante.
