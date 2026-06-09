
## Correcao adicional - Entrar como empresa (2026-06-08)

Status: OK

O botao "Entrar como empresa" no Painel Master foi restaurado para o fluxo correto de impersonacao auditada:

- Origem: app.replymesh.cloud
- Rota Master: /empresas/:id/acesso
- API usada: POST /api/v1/master/companies/:id/impersonate
- Destino da loja: https://<slug>.replymesh.cloud/loja/<slug>/admin/impersonate
- Resultado esperado: entrada direta no painel da empresa com banner de suporte Replymesh.

Arquivos alterados na VPS:

- /opt/replymesh/source/replymesh-frontend/src/pages/empresas/EmpresasList.jsx
- /opt/replymesh/source/replymesh-frontend/src/pages/Dashboard.jsx
- /opt/replymesh/source/replymesh-frontend/src/pages/empresas/CompanyImpersonationLaunch.jsx
- /opt/replymesh/source/replymesh-api/app/controllers/api/v1/master/companies_controller.rb

Backups criados:

- *.pre-impersonation-fix.bak nos arquivos alterados quando aplicavel
- /opt/replymesh/backups/static-impersonation-fix/master-20260608143257.tgz

Publicacao:

- Build do replymesh-frontend executado com sucesso.
- Dist publicado em /opt/replymesh/master.
- app.replymesh.cloud validado com HTTP 200.

Observacao tecnica:

- O frontend agora ignora login_url contendo 127.0.0.1 ou localhost e usa fallback seguro em https://<slug>.replymesh.cloud/loja/<slug>/admin/impersonate.
- Nenhum container da Evolution foi alterado.
- Nenhum webhook foi alterado.
- Nenhum banco foi alterado.
- Nenhum deploy de Store Template foi executado.
