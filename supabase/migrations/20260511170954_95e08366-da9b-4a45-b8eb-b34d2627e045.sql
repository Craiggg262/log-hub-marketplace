-- Update create_order_from_cart to DELETE log_items after assignment instead of marking unavailable
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
  v_assigned_ids UUID[];
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
    v_assigned_ids := ARRAY[]::UUID[];

    FOR v_available_log_items IN 
      SELECT id, account_details FROM public.log_items
      WHERE log_id = (v_cart_item->>'log_id')::UUID
        AND is_available = true
      LIMIT (v_cart_item->>'quantity')::INT
      FOR UPDATE
    LOOP
      -- Snapshot the credentials onto the order_log_items row so user keeps access after deletion
      INSERT INTO public.order_log_items (order_item_id, log_item_id, account_details_snapshot)
      VALUES (v_order_item_id, v_available_log_items.id, v_available_log_items.account_details);

      v_assigned_ids := array_append(v_assigned_ids, v_available_log_items.id);
      v_quantity_assigned := v_quantity_assigned + 1;
    END LOOP;

    IF v_quantity_assigned < (v_cart_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for log item';
    END IF;

    -- Permanently delete sold log_items to free database space
    DELETE FROM public.log_items WHERE id = ANY(v_assigned_ids);

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

-- Add snapshot column on order_log_items so historical orders still show credentials after deletion
ALTER TABLE public.order_log_items
  ADD COLUMN IF NOT EXISTS account_details_snapshot text;

-- Backfill snapshot from existing log_items where possible
UPDATE public.order_log_items oli
SET account_details_snapshot = li.account_details
FROM public.log_items li
WHERE oli.log_item_id = li.id
  AND oli.account_details_snapshot IS NULL;

-- Clean up existing already-sold log_items to free space
DELETE FROM public.log_items WHERE is_available = false;

-- Recalculate stock for all logs after cleanup
UPDATE public.logs l
SET stock = COALESCE(c.cnt, 0),
    in_stock = COALESCE(c.cnt, 0) > 0
FROM (
  SELECT log_id, COUNT(*)::int AS cnt
  FROM public.log_items
  WHERE is_available = true
  GROUP BY log_id
) c
WHERE l.id = c.log_id;

UPDATE public.logs
SET stock = 0, in_stock = false
WHERE id NOT IN (SELECT DISTINCT log_id FROM public.log_items WHERE is_available = true);