-- Recria a função com a assinatura correta do pg_net (net.http_post)
-- Configure SUPABASE_URL e SERVICE_ROLE_KEY manualmente no editor antes de aplicar, se necessário.
CREATE OR REPLACE FUNCTION public.notify_motoboy_on_delivery_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $func$
BEGIN
  IF NEW.motoboy_id IS NOT NULL THEN
    PERFORM net.http_post(
      url     := current_setting('app.supabase_url', true) || '/functions/v1/send-fcm-notification',
      body    := jsonb_build_object(
        'motoboy_id', NEW.motoboy_id::text,
        'title', '?? Nova entrega!',
        'body', 'Voce tem uma nova entrega atribuida. Abra o app para ver os detalhes.'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      )
    );
  END IF;
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS on_delivery_assigned ON public.delivery_history;

CREATE TRIGGER on_delivery_assigned
  AFTER INSERT ON public.delivery_history
  FOR EACH ROW EXECUTE FUNCTION public.notify_motoboy_on_delivery_assigned();