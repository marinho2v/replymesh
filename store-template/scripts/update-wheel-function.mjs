import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Aplica a função via migration SQL usando a REST API do Supabase
const sql = `
CREATE OR REPLACE FUNCTION public.grant_wheel_spin_for_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order    public.orders%rowtype;
  v_spins    integer;
  v_inserted integer := 0;
  v_i        integer;
BEGIN
  -- Busca o pedido
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pedido nao encontrado');
  END IF;

  IF v_order.status <> 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pedido ainda nao finalizado');
  END IF;

  IF v_order.customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pedido sem cliente vinculado');
  END IF;

  -- Giros = total do pedido (lanche + frete) dividido por R$ 25
  v_spins := FLOOR(COALESCE(v_order.total, 0) / 25);

  IF v_spins <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pedido nao atingiu o minimo de R$ 25 para giro'
    );
  END IF;

  -- Insere um registro de giro por cada R$ 25
  FOR v_i IN 1..v_spins LOOP
    INSERT INTO public.wheel_spins (customer_id, order_id, status, source, expires_at)
    VALUES (
      v_order.customer_id,
      v_order.id,
      'available',
      'order_completed',
      now() + interval '30 days'
    )
    ON CONFLICT DO NOTHING;

    IF FOUND THEN
      v_inserted := v_inserted + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success',        true,
    'spins_earned',   v_spins,
    'spins_inserted', v_inserted
  );
END;
$$;
`

// Usa a Management API do Supabase pra rodar SQL direto
const response = await fetch(
  `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/exec_sql`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql })
  }
)

const text = await response.text()
if (response.status === 200 || response.status === 204) {
  console.log('✅ Função atualizada com sucesso!')
} else {
  // exec_sql nao existe, tenta via Supabase CLI approach - salva migration
  console.log('❌ exec_sql não disponível (status', response.status, ')')
  console.log('Salvando como migration para aplicar manualmente...')

  import('fs').then(fs => {
    const migrationPath = 'supabase/migrations/20260530_wheel_total_with_frete.sql'
    fs.writeFileSync(migrationPath, sql)
    console.log('\n✅ Migration salva em:', migrationPath)
    console.log('\nPara aplicar, rode no Supabase SQL Editor:')
    console.log(sql)
  })
}
