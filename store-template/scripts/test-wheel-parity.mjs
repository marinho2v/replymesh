// Confirma que a logica da roleta do app Flutter == site web
function flutterWheel(order) {
  const toNum = (v) => (typeof v === 'number' ? v : 0)
  let subtotal
  if (order.subtotal != null) subtotal = toNum(order.subtotal)
  else {
    subtotal = toNum(order.total) - toNum(order.delivery_fee)
    if (subtotal < 0) subtotal = 0
  }
  if (subtotal < 25) return 0
  return Math.floor(subtotal / 25)
}
function webWheel(order) {
  const subtotal = Number(order.subtotal ?? Math.max(Number(order.total || 0) - Number(order.delivery_fee || 0), 0))
  if (!Number.isFinite(subtotal) || subtotal < 25) return 0
  return Math.floor(subtotal / 25)
}
const tests = [
  { nome: 'Elayne 313 (sub 38)', subtotal: 38, delivery_fee: 6, total: 44, esperado: 1 },
  { nome: 'pedido sub 18', subtotal: 18, delivery_fee: 6, total: 18, esperado: 0 },
  { nome: 'sem subtotal total 31', subtotal: null, delivery_fee: 6, total: 31, esperado: 0 },
  { nome: 'exato 25', subtotal: 25, delivery_fee: 6, total: 31, esperado: 1 },
  { nome: '50 = 2 giros', subtotal: 50, delivery_fee: 6, total: 56, esperado: 2 },
  { nome: '24.99 = 0', subtotal: 24.99, delivery_fee: 6, total: 30, esperado: 0 },
  { nome: '75 = 3 giros', subtotal: 75, delivery_fee: 8, total: 83, esperado: 3 },
]
let ok = true
for (const t of tests) {
  const f = flutterWheel(t)
  const w = webWheel(t)
  const pass = f === w && f === t.esperado
  if (!pass) ok = false
  console.log((pass ? 'OK ' : 'FALHA ') + t.nome + ' -> Flutter=' + f + ' Web=' + w + ' (esperado ' + t.esperado + ')')
}
console.log('\n' + (ok ? 'TESTE PASSOU: logica identica e correta!' : 'TESTE FALHOU: revisar'))
