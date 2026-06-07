// Teste real de ponta a ponta: simula o motoboy logado e testa update_my_photo_url
// Configure as variáveis de ambiente antes de executar:
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, MOTOBOY_ID
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const mbId = process.env.MOTOBOY_ID

if (!URL || !SERVICE || !ANON || !mbId) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY or MOTOBOY_ID')
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })

const { data: mb, error: mbErr } = await admin.from('motoboys').select('user_id, login_email').eq('id', mbId).single()
if (mbErr) {
  throw new Error(`Motoboy not found: ${mbErr.message}`)
}
console.log('1. Motoboy:', mb.login_email)

// Gera magic link e extrai o token para verificar (cria sessao real)
const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: mb.login_email,
})
if (linkErr) { console.log('ERRO gerar link:', linkErr.message); process.exit(1) }

const token = link.properties.hashed_token
console.log('2. Token de verificacao obtido')

// Cliente anon (igual o app real) verifica o OTP -> obtem sessao autenticada
const anon = createClient(URL, ANON, { auth: { persistSession: false } })
const { data: session, error: verifyErr } = await anon.auth.verifyOtp({
  type: 'magiclink',
  token_hash: token,
})
if (verifyErr) { console.log('ERRO verificar OTP:', verifyErr.message); process.exit(1) }
console.log('3. Sessao do motoboy criada! auth.uid =', session.user.id)

// Agora chama a RPC como motoboy (authenticated) - teste real
const testUrl = 'https://teste-foto-' + Date.now() + '.jpg'
const { error: rpcErr } = await anon.rpc('update_my_photo_url', { p_url: testUrl })
if (rpcErr) { console.log('4. ERRO na RPC:', rpcErr.message); process.exit(1) }
console.log('4. RPC update_my_photo_url executada como motoboy: OK')

// Verifica se persistiu no banco
const { data: check, error: checkErr } = await admin.from('motoboys').select('photo_url').eq('id', mbId).single()
if (checkErr) { throw new Error(`Erro ao verificar foto: ${checkErr.message}`) }
console.log('5. photo_url no banco:', check.photo_url)
console.log(check.photo_url === testUrl ? '\n? TESTE PASSOU — foto persiste de verdade!' : '\n? TESTE FALHOU')

// Limpa o valor de teste
await admin.from('motoboys').update({ photo_url: null }).eq('id', mbId)
console.log('6. Valor de teste limpo.')