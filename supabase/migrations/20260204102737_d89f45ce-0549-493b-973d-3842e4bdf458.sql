-- Disable log order cashout/refunds entirely (safety)
-- This keeps the RPC signature stable for existing clients, but prevents any refunds from being executed.

CREATE OR REPLACE FUNCTION public.process_order_cashout(
  p_order_id text,
  p_user_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'success', false,
    'error', 'Refunds are disabled by admin'
  );
END;
$$;