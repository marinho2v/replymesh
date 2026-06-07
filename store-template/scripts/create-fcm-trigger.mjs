/**
 * Cria trigger SQL para disparar FCM quando delivery e atribuida ao motoboy.
 * Execute com as variaveis de ambiente configuradas.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !TOKEN) {
  throw new Error('Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SUPABASE_ACCESS_TOKEN no ambiente antes de executar este script.')
}

const sql = `
-- Funcao que chama a Edge Function via HTTP ao inserir em delivery_history
CREATE OR REPLACE FUNCTION public.notify_motoboy_on_delivery_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.motoboy_id IS NOT NULL THEN
    PERFORM net.http_post(
      url := '${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/send-fcm-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ${SERVICE_ROLE_KEY}'
      ),
      body := jsonb_build_object(
        'motoboy_id', NEW.motoboy_id::text,
        'title', 'Nova entrega!',
        'body', 'Voce tem uma nova entrega atribuida. Abra o app para ver os detalhes.'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_delivery_assigned ON public.delivery_history;

CREATE TRIGGER on_delivery_assigned
  AFTER INSERT ON public.delivery_history
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_motoboy_on_delivery_assigned();
`

console.log('Criando trigger FCM...')

const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const text = await res.text()
console.log('Status:', res.status)
console.log('Resposta:', text)