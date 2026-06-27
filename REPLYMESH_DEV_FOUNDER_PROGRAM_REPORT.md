# Replymesh DEV — Programa Fundadores

Data: 27/06/2026
Branch: `dev`

## Fluxo implementado

- Landing com CTA **Comece grátis**.
- Rotas públicas equivalentes: `/fundadores`, `/cadastro` e `/comece-gratis`.
- Cadastro pendente antes de qualquer criação definitiva.
- Confirmação por código de 6 dígitos, válido por 15 minutos.
- Máximo de 5 tentativas e reenvio após 60 segundos.
- Após confirmação, criação transacional de empresa, administrador, membership, assinatura, domínio, configurações e módulos.
- Links de sucesso para painel e loja, adaptados para ambiente local ou produção.

## Segurança

- Código armazenado somente como hash BCrypt.
- Senha armazenada somente como hash BCrypt; senha pura não é recuperada nem registrada.
- Honeypot no formulário.
- Rate limit persistente por IP, e-mail e telefone.
- Bloqueio de e-mail, telefone e slug já utilizados.
- Lista ampliada de slugs reservados.
- Empresa definitiva não é criada se qualquer etapa falhar.
- Usuário criado com papel de administrador da própria loja, nunca `super_admin`.
- Isolamento multiempresa reaproveita `CompanyOnboardingService` e `CompanyMember`.

## Plano e módulos

- Plano `founder_free`, ativo e com valor zero, criado sob demanda.
- Empresa marcada com `origin=founder_program`, `commercial_status=founder_free` e data de cadastro.
- Essenciais, delivery, áreas, PDV, mesas, motoboy, relatórios, Pix manual e marketing básico liberados.
- WhatsApp manual liberado.
- WhatsApp automático, IA, domínio próprio e aplicativos pagos bloqueados por padrão.

## Painel Master

- Área `Configurações > Programa Fundadores`.
- Ativação/pausa, limite total, encerramento opcional e módulos padrão.
- Contadores de cadastradas e vagas restantes.
- Lista de empresas fundadoras.
- Card no dashboard Master.
- Filtros de empresas pagas e fundadoras/gratuitas.

## SMTP por variáveis de ambiente

Configurar apenas no ambiente local ou no servidor:

```text
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=suporte@replymesh.cloud
SMTP_PASSWORD=<segredo fora do Git>
SMTP_AUTH=login
SMTP_SSL=true
MAIL_FROM=suporte@replymesh.cloud
MAIL_FROM_NAME=Replymesh
```

Nenhuma senha SMTP foi adicionada ao repositório. Para boa entrega, configurar no DNS de `replymesh.cloud`: SPF, DKIM e DMARC.

## Validações executadas

- Migração aplicada no banco DEV local via container.
- Specs do fluxo fundador: 3 exemplos, 0 falhas.
- Build `replymesh-frontend`: aprovado.
- Build `store-template`: aprovado.
- Sintaxe Ruby dos arquivos novos/alterados: aprovada.
- `git diff --check`: aprovado.
- Auditoria de segredos: nenhum segredo novo encontrado.

## Pendências operacionais

- Definir `SMTP_PASSWORD` e demais ENV no ambiente DEV antes de testar entrega real.
- Ativar explicitamente o programa no Master; ele nasce pausado por segurança.
- Validação visual automatizada no navegador interno ficou indisponível nesta sessão; o frontend foi validado por build.
- Não houve merge em `main`, deploy ou alteração de VPS.

## Commit

Preenchido após a criação do commit DEV.
