# Replymesh — correção segura de lentidão no carregamento das lojas

Data: 2026-07-06

## Problema observado

As lojas públicas estavam apresentando carregamento intermitente entre 10 e 20 segundos.

Durante a auditoria na VPS foi identificado um gargalo real:

- o cron `replymesh-store-router-sync` executava a cada 2 minutos;
- o script iniciava `bin/rails runner` dentro do container da API;
- também validava SSL com `openssl` para todos os domínios em cada execução;
- isso gerava picos periódicos de CPU no container Rails e podia coincidir com acessos dos clientes.

## Correção aplicada

Arquivo ajustado:

- `scripts/sync-replymesh-store-routers.sh`

Mudanças:

- adicionada trava com `flock` para impedir execuções simultâneas;
- consulta de domínios otimizada com `joins` e `pluck`;
- validação de SSL passou a rodar somente quando a lista de domínios muda ou com `FORCE_SSL_SYNC=1`;
- `openssl` agora possui timeout de 8 segundos;
- cron da VPS alterado de 2 para 10 minutos.

## Backups feitos na VPS antes da troca

- `/opt/replymesh/scripts/sync-replymesh-store-routers.sh.before-perf-20260706-201358`
- `/etc/cron.d/replymesh-store-router-sync.before-perf-20260706-201358`

## Validações realizadas

- `bash -n` do script novo na VPS: OK.
- execução manual do script na VPS: OK.
- quando a lista de domínios não muda, o script pula a validação SSL pesada.
- `git diff --check`: OK.
- auditoria de segredos: OK.

## Resultado esperado

Redução dos picos periódicos de CPU no Rails e menor risco de lentidão nas lojas públicas durante a sincronização de domínios.

## Observação importante

Após a correção, ainda foram observados picos intermitentes em chamadas externas feitas a partir do ambiente local. De dentro da VPS, os endpoints testados responderam rapidamente durante a auditoria inicial. Se a lentidão externa persistir, a próxima investigação deve focar em:

- rota/rede externa até a VPS;
- Traefik;
- TLS/SSL;
- conectividade Hostinger;
- logs de proxy.

## Regra operacional reforçada

Toda atualização de produção deve seguir:

1. validar em `dev`;
2. commitar/push em `dev`;
3. promover para `main`;
4. atualizar VPS sem copiar banco local/dev;
5. validar lojas públicas antes e depois;
6. nunca deixar empresas fora do ar durante deploy ou manutenção.
