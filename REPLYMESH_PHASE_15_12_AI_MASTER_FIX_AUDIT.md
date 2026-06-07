# Fase 15.12 - Correcao da IA no Painel Master

Este ajuste removeu a configuracao indevida da IA no painel da loja e
centralizou a Carina no Painel Master.

## Corrigido

- Configuracao global em `Configuracoes > IA / Carina`.
- Remocao da configuracao por empresa.
- Remocao do menu e pagina de IA da loja.
- Redirecionamento seguro da URL antiga.
- Botao flutuante controlado pelo estado global.
- API key mascarada no master e ausente no frontend da loja.
- Modelo Claude legado normalizado para o modelo atual.
- Lista de empresas inativas tolerante a campos nulos.

Detalhes tecnicos e testes completos:
`REPLYMESH_PHASE_15_12_CARINA_PLATFORM_AI_AUDIT.md`.
