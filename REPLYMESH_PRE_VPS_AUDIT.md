# REPLYMESH_PRE_VPS_AUDIT.md

Auditoria operacional final antes da VPS.

Data: 2026-06-05  
Fase: 15.2 - Auditoria Operacional Final  
Ambiente: local controlado  
Run principal: `AUD152103254`

## Restrições respeitadas

- VPS nao iniciada.
- Deploy nao iniciado.
- Flutter nao iniciado.
- IA nao iniciada.
- Marketing WhatsApp nao iniciado.
- Webhook real nao configurado.
- Fase 16 nao iniciada.

---

## 1. WhatsApp

Status: **OK com pendencia operacional esperada para numeros ficticios**

### Templates ativos

- `pedido_aceito`
- `saiu_para_entrega`
- `pedido_finalizado`

### Templates inativos

- `marketing`
- `pedido_cancelado`
- `pedido_em_preparo`
- `pedido_pronto`
- `pedido_recebido`

### Logs OK encontrados

Foram encontrados logs reais de envio transacional para a empresa `demohamburgueria`:

- Log `55`: `WhatsApp enviado para status accepted`, template `pedido_aceito`, destino final `9803`.
- Log `56`: `WhatsApp enviado para status out_for_delivery`, template `saiu_para_entrega`, destino final `9803`.
- Log `54`: `WhatsApp enviado para status completed`, template `pedido_finalizado`, destino final `9803`.
- Logs adicionais OK tambem existentes para `accepted`, `out_for_delivery` e `completed`.

### Erros encontrados

PENDENTE operacional:

- Existem logs `err` recentes causados por numeros de teste/ficticios nao registrados no WhatsApp.
- Exemplos: `number +55... is not registered on WhatsApp`, retorno HTTP 500 da Evolution para destino invalido.
- Isso nao indica bug de template; indica destinatario invalido nos testes automatizados.

### Resultado

- Pedido aceito: **OK**.
- Mensagem de pedido aceito: **OK por logs existentes**.
- Pedido finalizado: **OK**.
- Mensagem de pedido finalizado: **OK por logs existentes**.
- Logs gerados: **OK**.
- Marketing WhatsApp: **nao iniciado**.

---

## 2. Localizacao

Status: **OK apos correcao**

### Validacoes OK

- Pedido com localizacao criado em:
  - `empresa-teste`
  - `demohamburgueria`
  - `demopizza`
- Campos gravados no pedido:
  - `delivery_latitude`
  - `delivery_longitude`
  - `google_maps_url`
  - `waze_url`
  - `delivery_location_source`
  - `delivery_location_received_at`
- Serializer do motoboy retorna os campos de localizacao.
- Card verde existe no frontend quando ha localizacao WhatsApp.
- Fallback por endereco continua funcionando quando nao ha `google_maps_url` nem `waze_url`.

### BUG corrigido

Arquivo corrigido:

- `W:\sas replymesh\store-template\src\pages\motoboy\MotoboyPortal.jsx`

Problema:

- A tela `MotoboyPortal` reconstruia URL de Maps/Waze a partir de latitude/longitude antes de preferir `google_maps_url` e `waze_url`.

Correcao:

- `buildPreciseMapsUrls` agora prioriza `delivery.google_maps_url` e `delivery.waze_url` quando esses campos existirem.
- Se as URLs nao existirem, continua usando coordenadas.
- Se coordenadas tambem nao existirem, continua usando fallback por endereco.

Resultado:

- Maps usa `google_maps_url`: **OK**.
- Waze usa `waze_url`: **OK**.
- Fallback por endereco: **OK**.
- Webhook real: **nao configurado**.

---

## 3. Motoboy

Status: **OK**

Fluxo validado em `empresa-teste`, `demohamburgueria` e `demopizza`:

1. Admin atribui pedido ao motoboy.
2. Pedido entra na lista ativa do motoboy com `delivery_status=assigned`.
3. Motoboy finaliza diretamente, sem usar botao `Iniciar Entrega`.
4. Pedido sai da lista ativa.
5. Pedido entra no historico com `DeliveryHistory.status=delivered`.
6. Admin ve o pedido com `status=completed`.

### Botao Iniciar Entrega

- `MotoboyDashboard.jsx`: botao `Iniciar Entrega` ausente.
- `MotoboyPortal.jsx`: botao `Iniciar Entrega` ausente.
- O endpoint antigo de start permanece no backend/API para compatibilidade futura, mas nao aparece no fluxo atual do frontend.

Resultado: **OK**

---

## 4. Produtos

Status: **OK**

Validado em:

- `empresa-teste`
- `demohamburgueria`
- `demopizza`

Fluxos:

- Criar produto: **OK**.
- Editar produto: **OK**.
- Ativar produto: **OK**.
- Desativar produto: **OK**.
- Excluir produto: **OK**.

Observacao:

- O schema usa `is_active` para produtos e categorias.
- A exclusao por API/fluxo operacional e tratada como exclusao logica/desativacao quando aplicavel ao painel.

Erros encontrados: **nenhum bloqueante**.

---

## 5. Impressao

Status: **OK tecnico / PENDENTE manual de dialogo fisico**

### Pedido

Arquivo validado:

- `W:\sas replymesh\store-template\src\pages\admin\OrderDetails.jsx`

Validacoes:

- Usa `window.print()`.
- Possui fallback por `iframe`.
- Possui fallback por `Blob`/janela.
- Estrutura compativel com Chrome e Edge Chromium.

Resultado tecnico: **OK**

### Cozinha e bebida

Arquivo validado:

- `W:\sas replymesh\store-template\src\components\kitchen\KitchenOrderCard.jsx`

Validacoes:

- Handler de impressao da cozinha encontrado.
- Janela de impressao chama `printWindow.print()`.
- O mesmo fluxo atende impressao operacional de cozinha/bebida conforme itens exibidos no KDS.

Resultado tecnico: **OK**

### Pendencia

- PENDENTE manual: abrir fisicamente o dialogo de impressao em Chrome e Edge no computador de operacao/impressora real antes da inauguracao.
- Motivo: o ambiente automatizado nao confirma dialogo nativo de impressao nem impressora fisica.

---

## 6. Multiempresa

Status: **OK**

Empresas auditadas:

- `empresa-teste`
- `demohamburgueria`
- `demopizza`

Validacoes:

- Produtos criados com `company_id` correto.
- Produtos nao aparecem em outra empresa.
- Pedidos criados com `company_id` correto.
- Clientes criados com `company_id` correto.
- Motoboys e historicos de entrega respeitam `company_id`.
- Nenhuma mistura de dados detectada nos fluxos auditados.

Resultado: **OK**

---

## 7. Testes tecnicos executados

### Rails / servicos locais

- Auditoria Rails runner: **OK**
- `OrderStatusService`: usado no fluxo de conclusao.
- `DeliveryService.assign`: **OK**
- `DeliveryService.complete`: **OK**
- `DeliveryHistory`: **OK**

### Frontend

Comando executado:

```powershell
cd "W:\sas replymesh\store-template"
npm run build
```

Resultado:

- Build Vite: **OK**
- Aviso nao bloqueante: chunk principal acima de 500 kB.

---

## 8. Classificacao final

### OK

- WhatsApp transacional com templates ativos.
- Logs OK de `pedido_aceito`, `saiu_para_entrega` e `pedido_finalizado`.
- Localizacao local estruturada e exibida.
- Maps/Waze usando URLs salvas apos correcao.
- Fallback por endereco preservado.
- Motoboy finaliza direto sem botao `Iniciar Entrega`.
- Produtos CRUD operacional.
- Multiempresa isolado.
- Build do frontend aprovado.

### BUG

- BUG encontrado e corrigido: `MotoboyPortal.jsx` nao priorizava `google_maps_url`/`waze_url` quando havia latitude/longitude.

### PENDENTE

- Teste fisico/manual do dialogo de impressao em Chrome e Edge com impressora real.
- Erros de WhatsApp com numeros ficticios devem ser ignorados ou retestados apenas com numero real registrado.
- Fase 16 ainda nao iniciada.

---

## 9. Conclusao

Sistema aprovado para seguir para planejamento da Fase 16, mas **nao publicado**.

Proxima fase registrada apenas como futura:

- **FASE 16 - VPS E PRODUCAO**

Objetivos futuros somente apos confirmacao explicita:

- `api.replymesh.cloud`
- SSL
- Banco de producao
- Deploy frontend
- Evolution real
- Webhook real
- Teste real de localizacao
- `REPLYMESH_V1_STABLE.md`

Nao iniciar Fase 16 sem confirmacao.
