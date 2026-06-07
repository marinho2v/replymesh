/**
 * Fecha todos os pedidos que estão com motoboy em aberto (assigned / on_the_way)
 * SEM enviar mensagem pro cliente.
 * Roda: node scripts/close-open-deliveries.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function main() {
  // 1. Busca todos os registros em aberto na delivery_history
  const { data: openRows, error: fetchErr } = await supabase
    .from('delivery_history')
    .select('id, order_id, motoboy_id, status')
    .in('status', ['assigned', 'on_the_way'])

  if (fetchErr) { console.error('Erro ao buscar entregas:', fetchErr); process.exit(1) }

  if (!openRows || openRows.length === 0) {
    console.log('? Nenhum pedido em aberto com motoboy encontrado.')
    return
  }

  console.log(`\n?? Encontrados ${openRows.length} pedido(s) em aberto:\n`)
  openRows.forEach(r => {
    console.log(`  • delivery_history.id=${r.id}  order_id=${r.order_id}  status=${r.status}`)
  })

  const orderIds = [...new Set(openRows.map(r => r.order_id))]

  // 2. Atualiza delivery_history ? delivered
  const { error: dhErr } = await supabase
    .from('delivery_history')
    .update({ status: 'delivered' })
    .in('status', ['assigned', 'on_the_way'])

  if (dhErr) { console.error('Erro ao atualizar delivery_history:', dhErr); process.exit(1) }
  console.log(`\n? delivery_history ? status='delivered' (${openRows.length} registro(s))`)

  // 3. Atualiza orders ? completed
  const { data: updatedOrders, error: ordErr } = await supabase
    .from('orders')
    .update({ status: 'completed', delivery_status: 'delivered' })
    .in('id', orderIds)
    .select('id, order_number, customer_name, status')

  if (ordErr) { console.error('Erro ao atualizar orders:', ordErr); process.exit(1) }

  console.log(`? orders ? status='completed' / delivery_status='delivered'\n`)
  ;(updatedOrders || []).forEach(o => {
    console.log(`  ? #${o.order_number || o.id.substring(0,8)} — ${o.customer_name}`)
  })

  console.log('\n?? Todos os pedidos foram encerrados com sucesso! Nenhuma mensagem enviada.')
}

main()