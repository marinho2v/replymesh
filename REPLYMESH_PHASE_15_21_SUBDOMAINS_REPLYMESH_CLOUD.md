# Fase 15.21 - Subdominios Replymesh Cloud

Data: 06/06/2026

## Resultado

O dominio oficial de lojas foi padronizado como `replymesh.cloud`. O onboarding
agora gera e persiste o slug, o subdominio e o dominio principal da empresa.

## Regra de geracao

- `Demo Hamburgueria` gera `demohamburgueria.replymesh.cloud`.
- `Pizzaria Sao Joao` gera `pizzariasaojoao.replymesh.cloud`.
- Caracteres especiais sao convertidos com seguranca.
- Slugs reservados recebem o complemento `-loja`.
- Duplicidades recebem `-2`, `-3` e assim por diante.

## Banco de dados

Campos adicionados a `companies`:

- `subdomain`
- `custom_domain`
- `primary_domain`
- `domain_status`
- `custom_domain_status`
- `dns_verified_at`

Os registros existentes foram preenchidos a partir do slug atual sem alterar
os dados operacionais das lojas.

## Roteamento

Continuam validas as URLs locais:

- `http://127.0.0.1:5174/loja/:slug`

O frontend da loja esta preparado para reconhecer:

- `https://:slug.replymesh.cloud`

Ele extrai o slug do hostname e mantem as chamadas Rails no escopo correto.

## Pendencias para VPS

Nenhuma configuracao de infraestrutura foi executada nesta fase. Em producao:

1. Criar o registro DNS wildcard `*.replymesh.cloud`.
2. Apontar o wildcard para a VPS.
3. Configurar Nginx para aceitar `*.replymesh.cloud`.
4. Encaminhar os hosts de loja para o store-template.
5. Reservar `app.replymesh.cloud` para o master.
6. Reservar `api.replymesh.cloud` para o Rails.
7. Configurar certificado SSL wildcard ou emissao automatica equivalente.

## Dominio proprio

A estrutura de `custom_domain`, status e data de verificacao foi criada. A
validacao DNS, emissao SSL e ativacao automatica ficarao para uma fase futura.

## Validacoes executadas

- migration Rails aplicada;
- sintaxe Ruby validada;
- rotas Rails listadas;
- normalizacao com nome simples, acento e caracteres especiais;
- duplicidade validada com sufixo `-2`;
- build do Painel Master;
- lint do Painel Master;
- build do store-template.

VPS, deploy e Fase 16 nao foram iniciados.
