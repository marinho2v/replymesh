# Replymesh Fase 15.22 - UX final e performance

Data: 06/06/2026

Base: `Replymesh Local Stable v0.15.21`

## Objetivo

Executar o ultimo acabamento local antes da infraestrutura publica, sem alterar
regras de negocio, webhooks reais, rastreamento de motoboy ou Android/Flutter.

## Performance

### Store-template

Antes:

- chunk principal: aproximadamente 631 kB;
- aviso do Vite para chunk acima de 500 kB.

Depois:

- chunk principal: aproximadamente 73 kB;
- React separado: aproximadamente 66 kB;
- UI compartilhada: aproximadamente 332 kB;
- paginas publicas, administrativas e do motoboy carregadas sob demanda;
- nenhum chunk acima de 500 kB.

### Painel Master

Antes:

- bundle principal: aproximadamente 984 kB;
- todas as paginas importadas na inicializacao.

Depois:

- bundle principal: aproximadamente 53 kB;
- React separado: aproximadamente 159 kB;
- Dashboard, Empresas, Relatorios, IA, Android, Auditoria, Atualizacoes e
  demais paginas carregadas sob demanda;
- importacao de icones limitada aos icones realmente utilizados;
- nenhum chunk acima de 500 kB.

## UX aplicada

O design aprovado foi preservado. O acabamento global incluiu:

- carregamento de rota consistente;
- espacamento mais compacto entre cards e toolbars;
- estados vazios menores e mais informativos;
- tabelas com rolagem horizontal visivel;
- truncamento seguro de textos longos;
- filtros e toolbars adaptados para telas menores;
- padding e tipografia ajustados no mobile;
- cards e cabecalhos mais compactos;
- manutencao da identidade visual existente.

Esses ajustes beneficiam Produtos, Categorias, Pedidos, Clientes, Caixa,
Estoque, Relatorios, Marketing, Recuperador, Configuracoes, Suporte, Mesas,
Aplicativo Android e as telas equivalentes do Painel Master.

## Verificacao visual

Verificadas no navegador local, sem erros de console:

- Dashboard Master;
- Auditoria Master;
- Aplicativos Android Master;
- Produtos da loja;
- Pedidos;
- Marketing WhatsApp;
- Recuperador de Vendas;
- Relatorios;
- Configuracoes;
- Aplicativo Android da loja.

O viewport real de notebook foi validado. As regras responsivas existentes e
os novos breakpoints cobrem tablet e mobile basico. Uma futura suite de
regressao visual por viewport pode ampliar essa garantia, mas nao bloqueia a
versao local.

## Legado Supabase

Os arquivos antigos continuam preservados como referencia historica:

- services de produtos/categorias antigos;
- MotoboyPortal antigo;
- hook de realtime antigo;
- services Supabase.

Eles nao sao importados pelo roteador ativo e seus textos nao aparecem nos
assets gerados pelo build. Nenhuma tela verificada apresentou erro Supabase no
console.

## Testes

Comando:

```powershell
W:\sas replymesh\scripts\smoke_all.ps1
```

Resultado:

- migrations: OK;
- routes: OK;
- sintaxe Ruby: OK;
- RSpec: 22 exemplos, 0 falhas;
- build store-template: OK;
- build Painel Master: OK;
- lint Painel Master: OK;
- rotas HTTP locais: OK;
- auditoria de segredos: OK.

## Bugs encontrados e corrigidos

1. Painel Master carregava todas as paginas no bundle inicial.
2. Store-template ainda carregava todas as paginas publicas no bundle inicial.
3. O componente generico de icones do Master importava toda a biblioteca
   Lucide, gerando um chunk de aproximadamente 624 kB.
4. Tabelas e toolbars do Master precisavam de tratamento global mais compacto
   para notebook e mobile.

## Pendencias

Permanecem exclusivamente para a Fase 16:

- DNS, Nginx e SSL;
- webhooks publicos Evolution e Mercado Pago;
- localizacao real via Evolution;
- jobs e scheduler;
- banco, Redis, backups e observabilidade;
- homologacao externa;
- deploy e rollback.

## Conclusao

A versao local continua estavel depois do refinamento. O carregamento inicial
dos dois frontends foi reduzido de forma significativa e as rotas principais
permanecem funcionais.

Fase 16 nao iniciada.
