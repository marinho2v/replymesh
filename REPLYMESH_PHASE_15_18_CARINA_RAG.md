# REPLYMESH - Fase 15.18 Carina RAG

Data: 06/06/2026
Status: concluida localmente

## Objetivo

Reduzir o contexto enviado ao Claude pela Carina sem perder qualidade,
historico curto, contexto da empresa ou seguranca.

## Arquitetura

Criado `ReplymeshRagService`, responsavel por:

- ler `replymesh-api/docs/REPLYMESH_AI_KNOWLEDGE_BASE.md`;
- dividir a base por modulo e tamanho;
- extrair palavras-chave;
- expandir sinonimos;
- pontuar titulo, keywords e corpo;
- retornar somente os top chunks relevantes.

O `CarinaAssistantService` continua responsavel por:

- identidade e comportamento da Carina;
- empresa e pagina atual;
- memoria recente;
- limites;
- provider;
- fallback;
- logs.

## Economia Medida

Pergunta usada: `Como configurar Mercado Pago?`

- tamanho total da base: 37.434 caracteres;
- chunks selecionados: 5.087 caracteres;
- reducao estimada de contexto: 86,4%;
- meta solicitada: minimo de 60%.

A economia real de tokens pode variar conforme pergunta, historico e resposta,
mas o arquivo completo nao e mais enviado ao provider.

## Seguranca

- API key permanece criptografada no backend.
- Nenhum segredo e adicionado aos chunks.
- Contexto continua filtrado pela empresa atual.
- Perguntas fora da Replymesh continuam bloqueadas.
- A Carina continua sem executar alteracoes automaticas.

## Uso e Logs

O uso tambem e registrado em `AiUsageLog`:

- empresa;
- usuario;
- tipo `carina`;
- provider;
- modelo;
- tokens;
- custo estimado;
- tempo;
- status.

## Testes

- sintaxe Ruby: OK;
- migration: OK;
- rotas existentes da Carina preservadas;
- busca Mercado Pago recuperou os modulos corretos;
- reducao de contexto medida em 86,4%;
- build do `store-template`: OK;
- nenhuma alteracao em Mercado Pago, WhatsApp, pedidos ou multiempresa.

## Pendencias Futuras

- calibrar custo por modelo com tabela oficial configuravel;
- separar input/output tokens quando todos os providers retornarem essa
  informacao;
- avaliar embeddings apenas se a busca lexical deixar de atender a qualidade
  esperada.
