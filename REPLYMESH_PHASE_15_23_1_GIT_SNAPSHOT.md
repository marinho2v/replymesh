# Replymesh Phase 15.23.1 Git Snapshot

Data: 2026-06-07
Versao: Replymesh Local Stable v0.15.23
Repositorio: `git@github.com:marinho2v/replymesh.git`
Branch principal: `main`
Tag local: `v0.15.23`

## Objetivo

Criar o primeiro snapshot Git privado da Replymesh Local Stable v0.15.23 sem expor segredos, builds, backups, uploads ou dependencias locais.

## Auditoria de Segredos

Status: limpa.

Auditorias executadas:

- `scripts/audit_secrets.ps1`
- varredura adicional dos arquivos candidatos ao Git

Resultado:

- nenhum segredo real encontrado
- falso positivo revisado em nome de campo `mercadopago_access_token`
- senha local removida de `replymesh-api/.env.example`
- `replymesh-api/.kamal/secrets` ajustado para usar variavel de ambiente `RAILS_MASTER_KEY`
- arquivos `.env`, chaves Rails, logs e builds permanecem ignorados

Relatorio dedicado:

- `REPLYMESH_GIT_SECRETS_AUDIT.md`

## Gitignore Criado/Ajustado

O snapshot ignora:

- ambientes locais: `.env`, `.env.*`
- chaves: `master.key`, `config/credentials/*.key`, `*.pem`, `*.key`
- dependencias: `node_modules/`, `vendor/bundle/`
- builds: `dist/`, `build/`
- runtime Rails: `tmp/`, `log/`, `storage/`
- uploads, backups e exports
- toolchains locais: `tools/`
- copia original/externa: `temple1/`
- screenshots e arquivos de captura
- arquivos soltos de prototipo na raiz

Tambem foi ajustado `replymesh-frontend/.gitignore` para nao ignorar a pagina real `src/pages/logs`.

O metadado Git interno vazio de `replymesh-api` foi preservado como `replymesh-api/.git.local-before-root-snapshot` e ignorado, permitindo que o backend Rails entre no snapshot como pasta normal do monorepo.

## Arquivos Grandes

Arquivos candidatos acima de 5 MB:

- `store-template/public/logo.png` com aproximadamente 5,68 MB
- `store-template/logo.png` com aproximadamente 5,68 MB

Esses arquivos foram mantidos por serem assets do template.

## Tamanho Estimado do Snapshot

- Arquivos candidatos ao Git: 823
- Tamanho aproximado: 35,4 MB

## Remote

Remote configurado:

```text
origin git@github.com:marinho2v/replymesh.git
```

## Status do Push

Push nao executado nesta auditoria por bloqueio de seguranca no SSH local.

O remote foi configurado corretamente como:

```text
origin git@github.com:marinho2v/replymesh.git
```

Porem a validacao SSH retornou:

```text
Host key verification failed.
```

Ao testar a conectividade, `github.com:22` e `ssh.github.com:443` responderam com banner SSH inesperado:

```text
SSH-2.0-6279353
```

Por seguranca, nenhum push foi feito enquanto a chave do host GitHub nao estiver validada de forma confiavel.

Comandos para executar depois que o SSH/DNS estiver corrigido:

Comandos previstos:

```powershell
git push -u origin main
git push origin v0.15.23
```

## Checklist

- [x] Auditoria de segredos executada
- [x] Gitignore criado
- [x] Arquivos grandes revisados
- [x] Remote privado configurado
- [x] Commit criado
- [x] Tag local criada
- [ ] Push da branch executado
- [ ] Push da tag executado

## Pendencias

Nenhuma pendencia de seguranca foi encontrada antes do commit.

Pendencia externa:

- corrigir/validar SSH/DNS local para `github.com` antes do push
