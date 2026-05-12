
-- 1. Revert create_order_from_cart: do NOT delete log_items, just mark unavailable.
--    Always populate account_details_snapshot so customers always see credentials.
CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_user_id uuid, p_total_amount numeric, p_cart_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_order_item_id UUID;
  v_cart_item JSONB;
  v_available_log_items RECORD;
  v_quantity_assigned INT;
  v_remaining_count INT;
BEGIN
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized user';
  END IF;

  INSERT INTO public.orders (user_id, total_amount, status)
  VALUES (p_user_id, p_total_amount, 'completed')
  RETURNING id INTO v_order_id;

  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    INSERT INTO public.order_items (order_id, log_id, quantity, price_per_item)
    VALUES (
      v_order_id,
      (v_cart_item->>'log_id')::UUID,
      (v_cart_item->>'quantity')::INT,
      (v_cart_item->>'price')::NUMERIC
    )
    RETURNING id INTO v_order_item_id;

    v_quantity_assigned := 0;

    FOR v_available_log_items IN
      SELECT id, account_details FROM public.log_items
      WHERE log_id = (v_cart_item->>'log_id')::UUID
        AND is_available = true
      LIMIT (v_cart_item->>'quantity')::INT
      FOR UPDATE
    LOOP
      INSERT INTO public.order_log_items (order_item_id, log_item_id, account_details_snapshot)
      VALUES (v_order_item_id, v_available_log_items.id, v_available_log_items.account_details);

      UPDATE public.log_items SET is_available = false WHERE id = v_available_log_items.id;

      v_quantity_assigned := v_quantity_assigned + 1;
    END LOOP;

    IF v_quantity_assigned < (v_cart_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for log item';
    END IF;

    SELECT COUNT(*) INTO v_remaining_count
    FROM public.log_items
    WHERE log_id = (v_cart_item->>'log_id')::UUID
      AND is_available = true;

    UPDATE public.logs
    SET stock = v_remaining_count,
        in_stock = (v_remaining_count > 0)
    WHERE id = (v_cart_item->>'log_id')::UUID;
  END LOOP;

  RETURN v_order_id;
END;
$function$;

-- 2. Backfill: link historic order_items that have no order_log_items rows.
--    Take oldest log_items for the same log_id, snapshot their account_details.
INSERT INTO public.order_log_items (order_item_id, log_item_id, account_details_snapshot)
SELECT oi_id, log_item_id, account_details
FROM (
  SELECT m.oi_id, li.id AS log_item_id, li.account_details,
    ROW_NUMBER() OVER (PARTITION BY m.oi_id ORDER BY li.created_at) AS rn,
    m.quantity
  FROM (
    SELECT oi.id AS oi_id, oi.log_id, oi.quantity
    FROM public.order_items oi
    WHERE NOT EXISTS (
      SELECT 1 FROM public.order_log_items oli WHERE oli.order_item_id = oi.id
    )
  ) m
  JOIN public.log_items li ON li.log_id = m.log_id
) c
WHERE rn <= quantity;

-- 3. Broadcast notifications (admin announces, shows once per user on login)
CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active broadcasts"
  ON public.broadcast_notifications FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage broadcasts insert"
  ON public.broadcast_notifications FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins manage broadcasts update"
  ON public.broadcast_notifications FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins manage broadcasts delete"
  ON public.broadcast_notifications FOR DELETE
  USING (is_admin());

CREATE TABLE IF NOT EXISTS public.broadcast_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, user_id)
);

ALTER TABLE public.broadcast_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own broadcast views"
  ON public.broadcast_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own broadcast views"
  ON public.broadcast_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);
