
-- API RPC for creating a log order via reseller-api (service role).
-- Pulls available log_items, marks them sold, returns credentials.
CREATE OR REPLACE FUNCTION public.api_create_log_order(
  p_user_id uuid,
  p_log_id uuid,
  p_quantity int,
  p_unit_price numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_item_id uuid;
  v_item RECORD;
  v_assigned int := 0;
  v_total numeric;
  v_remaining int;
  v_credentials text[] := ARRAY[]::text[];
BEGIN
  IF p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be >= 1';
  END IF;

  v_total := p_unit_price * p_quantity;

  INSERT INTO public.orders (user_id, total_amount, status)
  VALUES (p_user_id, v_total, 'completed')
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, log_id, quantity, price_per_item)
  VALUES (v_order_id, p_log_id, p_quantity, p_unit_price)
  RETURNING id INTO v_order_item_id;

  FOR v_item IN
    SELECT id, account_details FROM public.log_items
    WHERE log_id = p_log_id AND is_available = true
    LIMIT p_quantity
    FOR UPDATE
  LOOP
    INSERT INTO public.order_log_items (order_item_id, log_item_id, account_details_snapshot)
    VALUES (v_order_item_id, v_item.id, v_item.account_details);

    UPDATE public.log_items SET is_available = false WHERE id = v_item.id;

    v_credentials := array_append(v_credentials, v_item.account_details);
    v_assigned := v_assigned + 1;
  END LOOP;

  IF v_assigned < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  SELECT COUNT(*) INTO v_remaining FROM public.log_items WHERE log_id = p_log_id AND is_available = true;
  UPDATE public.logs SET stock = v_remaining, in_stock = (v_remaining > 0) WHERE id = p_log_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'credentials', to_jsonb(v_credentials)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.api_create_log_order(uuid, uuid, int, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.api_create_log_order(uuid, uuid, int, numeric) TO service_role;
