# Replymesh Git Secrets Audit

Data: 2026-06-07
Versao: Replymesh Local Stable v0.15.23

## Resultado

Auditoria concluida sem segredos reais nos arquivos publicaveis do snapshot Git.

## Comandos Executados

```powershell
& 'W:\sas replymesh\scripts\audit_secrets.ps1'
```

Resultado:

```text
Auditoria de segredos concluida: nenhum segredo hardcoded encontrado nas areas publicaveis.
```

Tambem foi executada uma varredura adicional sobre os arquivos nao ignorados pelo Git antes do commit.

Resultado:

```text
Candidato ao Git limpo: nenhum token real e nenhum valor sensivel nao-placeholder em 823 arquivos nao ignorados.
```

## Itens Verificados

- Claude API Keys
- Anthropic Keys
- Mercado Pago Access Tokens
- Evolution API Keys
- JWT Secrets
- Rails Master Key
- Database Passwords
- Bearer Tokens
- SSH Keys

## Falso Positivo Revisado

Foi identificado um falso positivo em `store-template/src/services/settings.js` por conter o nome do campo `mercadopago_access_token`.

Conclusao: nao ha token real neste arquivo. O trecho apenas envia o campo para o backend quando o usuario informa um novo token nas configuracoes, sem hardcode de chave.

## Correcao Real Antes do Commit

O arquivo `replymesh-api/.env.example` continha uma senha local em `DATABASE_PASSWORD`.

Correcao aplicada:

- `DATABASE_PASSWORD` foi substituido por `sua_senha_local`
- `REPLYMESH_MASTER_EMAIL` foi atualizado para `admin@replymesh.cloud`

Depois da correcao, a auditoria foi executada novamente e ficou limpa.

O arquivo `replymesh-api/.kamal/secrets` tambem foi ajustado para usar `RAILS_MASTER_KEY=$RAILS_MASTER_KEY`, sem comando de leitura de `config/master.key` dentro do snapshot.

## Arquivos e Pastas Protegidos pelo Gitignore

- `.env`
- `.env.*`
- `master.key`
- `config/credentials/*.key`
- `node_modules/`
- `dist/`
- `build/`
- `tmp/`
- `log/`
- `storage/`
- `uploads/`
- `backups/`
- `exports/`
- `temple1/`
- `tools/`
- `screenshots/`
- `.claude/`
- arquivos compactados como `.zip`, `.tar`, `.rar`, `.7z`

## Observacao

Os arquivos reais de ambiente, chaves locais, logs, builds, backups, uploads e toolchains locais permanecem fora do snapshot Git.
