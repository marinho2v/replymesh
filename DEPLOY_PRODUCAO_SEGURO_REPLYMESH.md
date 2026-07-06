# Replymesh — Regras obrigatórias para deploy seguro em produção

Este documento existe para evitar que lojas reais fiquem fora do ar durante atualizações.

Regra principal: produção recebe somente código validado. Produção nunca recebe dados do banco local/dev.

## Ordem obrigatória

1. Trabalhar e testar na branch `dev`.
2. Fazer build e validações locais.
3. Commitar e enviar `dev` para o GitHub.
4. Atualizar `main` somente depois da `dev` validada.
5. Fazer preflight da VPS em modo somente leitura.
6. Fazer backup do estado atual da VPS.
7. Publicar em área temporária/release candidate.
8. Validar API oficial, assets e lojas reais.
9. Só então trocar produção de forma atômica.
10. Validar novamente as lojas reais.
11. Atualizar marcadores de deploy apenas depois de tudo aprovado.

## Nunca fazer

- Nunca copiar banco local/dev para a VPS.
- Nunca substituir empresas, usuários, produtos ou pedidos da produção por dados de teste.
- Nunca trocar build do `store-template` sem validar lojas reais.
- Nunca reiniciar serviços aleatoriamente durante horário de venda sem healthcheck antes/depois.
- Nunca mexer em Evolution, PostgreSQL, Nginx ou SSL sem plano de rollback.
- Nunca marcar deploy como concluído antes de validar loja pública e painel.
- Nunca fazer deploy direto de uma branch diferente de `main`.

## Preflight obrigatório antes da VPS

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

- `dev` está limpa, exceto arquivos não relacionados e conscientemente ignorados.
- `origin/dev` contém o commit validado.
- `main` foi atualizada a partir da `dev`.
- `origin/main` contém o mesmo commit que será publicado.
- Auditoria de segredos passou.
- Healthcheck das lojas reais passou antes do deploy.

## Backup obrigatório na VPS

Antes de trocar qualquer arquivo:

- Backup de `/opt/replymesh/store`
- Backup de `/opt/replymesh/master`
- Backup dos marcadores `/opt/replymesh/DEPLOYED*`
- Registrar imagem atual da API
- Registrar containers ativos
- Registrar commit atual

Não remover backups até validar a produção.

## Validação obrigatória depois do deploy

Validar no mínimo:

- `https://app.replymesh.cloud/`
- `https://replymesh.cloud/`
- `https://lanchesdo2r.com.br/`
- `https://petiscodapaty.replymesh.cloud/`
- uma loja com domínio próprio
- uma loja com subdomínio `.replymesh.cloud`
- endpoint público de loja via API
- login do painel da loja
- painel master

Se qualquer loja real retornar:

- `Loja não encontrada`
- `Carregando loja...` travado
- erro 500/502/503
- bundle apontando para localhost/dev

o deploy deve parar e fazer rollback imediatamente.

## Regra para Evolution

Alterações em Evolution não podem afetar roteamento das lojas públicas.

Antes e depois de mexer em Evolution:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-production-health.ps1
```

Se alguma loja pública cair, desfazer a alteração antes de continuar.

## Regra para banco de dados

Migrations em produção só podem rodar quando:

- foram testadas local/dev;
- são compatíveis com dados existentes;
- existe backup recente;
- não removem colunas/tabelas usadas pelo build atual;
- não dependem de dados de seed local.

Seeds de QA/dev nunca devem rodar na produção.

## Regra de rollback

Rollback deve ser mais rápido que investigação.

Se lojas reais ficarem offline, a ordem é:

1. Restaurar build anterior da loja pública.
2. Confirmar lojas no ar.
3. Só depois investigar causa.

## Arquivos auxiliares

- `scripts/check-production-health.ps1`: healthcheck local e opcionalmente VPS, somente leitura.
- `scripts/audit_secrets.ps1`: auditoria básica de segredos.
- `/opt/replymesh/REGRAS_OBRIGATORIAS_DEPLOY_PRODUCAO.md`: cópia operacional na VPS.

