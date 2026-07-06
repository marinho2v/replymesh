# Regras obrigatórias Replymesh — produção nunca pode cair

## Regra principal

Nenhuma loja real pode ficar offline durante atualização, deploy ou manutenção.

Se cair, rollback primeiro. Investigação depois.

## Ordem correta

1. Desenvolver na `dev`.
2. Validar local/dev.
3. Commitar e enviar `dev`.
4. Promover para `main`.
5. Enviar `main`.
6. Healthcheck antes da VPS.
7. Backup na VPS.
8. Atualizar VPS usando código da `main`.
9. Healthcheck depois da VPS.

## Proibido

- copiar banco local/dev para produção;
- rodar seed de teste na produção;
- apagar/substituir empresas reais;
- alterar Evolution, Traefik, SSL, Nginx ou PostgreSQL sem rollback;
- deixar loja com `Loja não encontrada`;
- deixar loja travada em `Carregando loja...`;
- continuar investigando enquanto cliente está fora do ar.

## Healthcheck obrigatório

Antes e depois:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-production-health.ps1
```

Validar:

- `https://app.replymesh.cloud/`
- `https://replymesh.cloud/`
- `https://lanchesdo2r.com.br/`
- `https://petiscodapaty.replymesh.cloud/`
- loja com domínio próprio;
- loja com `.replymesh.cloud`;
- painel master;
- painel da loja.

## Incidente

Se qualquer loja cair:

1. parar alteração;
2. voltar último arquivo/configuração;
3. confirmar lojas no ar;
4. registrar o que causou;
5. só então continuar.
