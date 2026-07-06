# Replymesh — regras obrigatórias para deploy seguro em produção

Este documento existe para uma regra simples: nenhuma empresa pode ficar offline durante atualização.

Produção recebe somente código validado. Produção nunca recebe banco, seed ou dados do ambiente local/dev.

## Regra zero

Se qualquer loja real ficar fora do ar, a prioridade é voltar a loja para o ar.

Ordem obrigatória em incidente:

1. Parar a alteração.
2. Fazer rollback do último ponto alterado.
3. Confirmar lojas públicas no ar.
4. Só depois investigar a causa.

Investigação nunca vem antes de restaurar as lojas.

## Fluxo obrigatório de atualização

1. Trabalhar somente na branch `dev`.
2. Validar local/dev.
3. Fazer commit na `dev`.
4. Fazer push da `dev` para o GitHub.
5. Promover para `main` somente depois da `dev` validada.
6. Fazer push da `main`.
7. Conferir healthcheck de produção antes de mexer na VPS.
8. Fazer backup do estado atual na VPS.
9. Atualizar a VPS usando somente código da `main`.
10. Validar lojas reais imediatamente depois.

## Nunca fazer

- Nunca copiar banco local/dev para produção.
- Nunca rodar seed local/dev em produção.
- Nunca substituir empresas, usuários, produtos, pedidos ou domínios reais por dados de teste.
- Nunca fazer deploy direto de branch diferente de `main`.
- Nunca alterar Evolution, Traefik, Nginx, SSL, PostgreSQL ou roteamento sem plano de rollback.
- Nunca reiniciar serviço sem healthcheck antes/depois.
- Nunca deixar `Loja não encontrada` ou `Carregando loja...` travado para depois.
- Nunca investigar por muito tempo com lojas fora do ar.

## Preflight obrigatório antes de produção

Executar localmente:

```powershell
git status --short --branch
git fetch origin
git log --oneline -5
git diff --check
powershell -ExecutionPolicy Bypass -File scripts/audit_secrets.ps1
powershell -ExecutionPolicy Bypass -File scripts/check-production-health.ps1
```

Condições obrigatórias:

- `dev` contém a atualização validada.
- `origin/dev` recebeu o commit.
- `main` foi atualizada a partir da `dev`.
- `origin/main` contém o commit que será publicado.
- Auditoria de segredos passou.
- Healthcheck das lojas reais passou antes do deploy.

## Backup obrigatório na VPS

Antes de trocar qualquer arquivo relevante:

- backup de `/opt/replymesh/store`;
- backup de `/opt/replymesh/master`;
- backup de scripts alterados;
- backup de arquivos Traefik/Nginx alterados;
- registrar containers ativos;
- registrar commit atual;
- registrar horário da alteração.

Não remover backups até produção estar validada.

## Validação obrigatória depois de qualquer mudança na VPS

Validar no mínimo:

- `https://app.replymesh.cloud/`
- `https://replymesh.cloud/`
- `https://lanchesdo2r.com.br/`
- `https://petiscodapaty.replymesh.cloud/`
- uma loja com domínio próprio;
- uma loja com subdomínio `.replymesh.cloud`;
- endpoint público de loja via API;
- login do painel da loja;
- painel master.

Se qualquer loja real retornar:

- `Loja não encontrada`;
- `Carregando loja...` travado;
- erro 500, 502 ou 503;
- bundle apontando para localhost/dev;
- empresas sumindo do painel master;

então o deploy deve parar e fazer rollback imediatamente.

## Regra para Evolution

Evolution não pode derrubar loja pública.

Antes e depois de mexer em Evolution:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-production-health.ps1
```

Se loja pública cair após mudança no Evolution:

1. desfazer a alteração;
2. validar lojas no ar;
3. só depois voltar a mexer na Evolution.

## Regra para banco de dados

Migrations em produção só podem rodar quando:

- foram testadas local/dev;
- são compatíveis com dados existentes;
- existe backup recente;
- não removem colunas/tabelas usadas pelo build atual;
- não dependem de dados de seed local.

Seeds de QA/dev nunca devem rodar na produção.

## Regra de performance

Toda atualização deve preservar:

- lojas públicas carregando rápido;
- API pública respondendo;
- CPU sem picos constantes;
- cron sem execução pesada em intervalo curto;
- nenhum processo Rails runner recorrente consumindo CPU sem necessidade.

Se a loja começar a demorar 10–20 segundos:

1. verificar cron/scripts recorrentes;
2. verificar CPU do container Rails;
3. verificar Traefik/proxy;
4. verificar API pública da loja;
5. corrigir sem reiniciar serviços à toa.

## Arquivos auxiliares

- `scripts/check-production-health.ps1`: healthcheck de produção, somente leitura.
- `scripts/audit_secrets.ps1`: auditoria básica de segredos.
- `REPLYMESH_PRODUCTION_STORE_LOAD_PERFORMANCE_FIX.md`: correção aplicada no gargalo de sincronização de rotas.
- `/opt/replymesh/REGRAS_OBRIGATORIAS_DEPLOY_PRODUCAO.md`: cópia operacional na VPS.
