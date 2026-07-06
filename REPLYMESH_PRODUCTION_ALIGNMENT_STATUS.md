# Replymesh — Status de alinhamento produção/Git

Data da auditoria: 2026-07-06

## Resultado principal

A produção está respondendo e as lojas reais validadas estão online.

Branches alinhadas:

- `dev`
- `main`
- `origin/dev`
- `origin/main`

Commit atual alinhado:

```text
26ab5fb Replymesh Add Production Deploy Safety Guardrails
```

## Healthcheck executado

Comando:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-production-health.ps1 -IncludeVps
```

Resultado:

- `https://api.replymesh.cloud/api/v1/public/petiscodapaty/store` — OK
- `https://petiscodapaty.replymesh.cloud/` — OK
- `https://lanchesdo2r.com.br/` — OK
- `https://app.replymesh.cloud/` — OK
- `https://replymesh.cloud/` — OK

## Estado observado na VPS

Containers principais ativos:

- `replymesh-rails-api`
- `replymesh-store`
- `replymesh-master`
- `evolution-go-1dvv-api-1`
- `dokploy-traefik`

Disco:

```text
/dev/sda1 48G total, 30G usado, 18G livre, 64%
```

Memória:

```text
3.8 GiB total
2.0 GiB usado
1.8 GiB disponível
```

## Marcadores de deploy na VPS

Os marcadores ainda estão misturados por causa dos hotfixes e rollback anteriores:

```text
DEPLOYED_API_COMMIT: 9820c4f
DEPLOYED_COMMIT: 35a00dd
DEPLOYED_EVOLUTION_HOTFIX_COMMIT: 6897b44
DEPLOYED_FRONTEND_COMMIT: 6d83bff
DEPLOYED_MAIN_COMMIT: 9820c4f
DEPLOYED_MASTER_COMMIT: 381f10e
DEPLOYED_STORE_COMMIT: 9820c4f
```

API em execução:

```text
replymesh-api:main-6897b44
```

Store pública em execução:

```text
assets/index-build-20260617-status-hotfix-BHtkNweR.js
```

Master em execução:

```text
assets/index-CDGYlItq.js
```

## Interpretação

A produção está funcional, mas não deve ser considerada “limpa” para deploy cego.

O estado atual foi estabilizado com hotfix/rollback para manter clientes online. Portanto, antes do próximo deploy real é obrigatório:

1. Fazer backup do estado atual.
2. Gerar release candidate separado.
3. Validar `store-template`, `master` e API antes da troca.
4. Validar lojas reais depois da troca.
5. Só então atualizar marcadores de deploy.

## Regra prática

Não fazer deploy apenas para “alinhar marcador”.

O próximo deploy deve ser feito somente quando houver código validado para publicar, seguindo:

```text
dev -> main -> backup VPS -> release candidate -> healthcheck -> troca atomica -> healthcheck -> marcador
```

## Arquivos de segurança criados

- `DEPLOY_PRODUCAO_SEGURO_REPLYMESH.md`
- `scripts/check-production-health.ps1`
- `/opt/replymesh/REGRAS_OBRIGATORIAS_DEPLOY_PRODUCAO.md`

## Próximo passo recomendado

Continuar desenvolvimento na `dev`.

Quando uma atualização estiver pronta:

1. Rodar validações locais.
2. Commitar na `dev`.
3. Push `origin/dev`.
4. Fast-forward para `main`.
5. Push `origin/main`.
6. Rodar `scripts/check-production-health.ps1`.
7. Fazer deploy seguro na VPS apenas se o healthcheck anterior estiver OK.

