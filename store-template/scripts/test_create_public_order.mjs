// ============================================================
// Teste automatico da Edge Function create-public-order
// Uso: node scripts/test_create_public_order.mjs
// Le VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY do .env
// NAO usa service_role. Chama a funcao publica, igual o site.
// ============================================================
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter(Boolean).map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)
const URL_ = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const FN = `${URL_}/functions/v1/create-public-order`

const TEST_PHONE = '11990000000'
const PRODUCT_ID = '3f89af29-a25f-4fef-aa11-bbd872c6bafe' // Guaracrack R$2,00
const PRODUCT_NAME = 'Guaracrack'
const UNIT = 2.0

// IPs de teste (faixa reservada p/ documentacao TEST-NET-3, nunca de cliente real)
const IP_BURST = '203.0.113.50'
const IP_PHONE = '203.0.113.51'

const buildPayload = (qty = 1, ip = IP_BURST) => ({
  formData: {
    fullName: 'TESTE AUTOMATICO',
    whatsapp: TEST_PHONE,
    orderType: 'pickup',                 // pickup = sem zona de entrega, taxa 0
    paymentMethod: 'money',
    notes: 'PEDIDO DE TESTE - IGNORAR',
  },
  items: [{
    product_id: PRODUCT_ID,
    product_name: PRODUCT_NAME,
    unit_price: UNIT,
    quantity: qty,
    total_price: UNIT * qty,
    selected_options: [],
  }],
  totals: { subtotal: UNIT * qty, discount: 0, deliveryFee: 0, total: UNIT * qty },
  couponCode: '',
})

const call = async (payload, ip) => {
  const res = await fetch(FN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      'x-forwarded-for': ip, // IP de teste isolado
    },
    body: JSON.stringify(payload),
  })
  let data = null
  try { data = await res.json() } catch { /* ignore */ }
  return { status: res.status, data }
}

const results = []

const log = (label, r) => {
  const ok = r.data?.success
  const orderId = r.data?.order?.id || null
  const msg = ok ? `OK (order ${orderId?.slice(0, 8)})` : `BLOQUEADO: ${r.data?.error}`
  results.push({ label, httpStatus: r.status, success: Boolean(ok), orderId, error: r.data?.error || null })
  console.log(`  ${label.padEnd(28)} -> ${msg}`)
  return r
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const run = async () => {
  console.log('\n=== TESTE create-public-order ===\n')

  // A) Pedido normal (deve passar) — cria 1 pedido real
  console.log('A) Pedido normal:')
  const a = log('normal', await call(buildPayload(1, IP_BURST), IP_BURST))

  // B) Duplicado (mesma assinatura < 90s) — deve bloquear, NAO cria pedido
  console.log('\nB) Duplicado (identico):')
  log('duplicado', await call(buildPayload(1, IP_BURST), IP_BURST))

  // C) Burst por IP (3/60s no mesmo IP) — assinaturas diferentes (qty variando)
  console.log('\nC) Burst por IP (limite 3/60s):')
  log('burst pedido 2 (qty2)', await call(buildPayload(2, IP_BURST), IP_BURST))
  log('burst pedido 3 (qty3)', await call(buildPayload(3, IP_BURST), IP_BURST))
  log('burst pedido 4 (qty4) DEVE BLOQUEAR', await call(buildPayload(4, IP_BURST), IP_BURST))

  // D) Rate limit por telefone (5/10min) — usa outro IP p/ nao bater no burst
  console.log('\nD) Rate limit por telefone (limite 5/10min):')
  log('telefone pedido 4 (qty5)', await call(buildPayload(5, IP_PHONE), IP_PHONE))
  log('telefone pedido 5 (qty6)', await call(buildPayload(6, IP_PHONE), IP_PHONE))
  log('telefone pedido 6 (qty7) DEVE BLOQUEAR', await call(buildPayload(7, IP_PHONE), IP_PHONE))

  console.log('\n=== FIM ===')
  console.log('Pedidos reais criados: ~5 (todos com nome "TESTE AUTOMATICO", telefone ' + TEST_PHONE + ').')
  console.log('\nJSON_RESULT=' + JSON.stringify(results))
  console.log('Rode o SQL de limpeza informado para remove-los.\n')
  if (!a.data?.success) console.log('ATENCAO: o pedido normal NAO passou — verificar antes de continuar.')
}

run().catch((e) => { console.error('Erro no teste:', e); process.exit(1) })
