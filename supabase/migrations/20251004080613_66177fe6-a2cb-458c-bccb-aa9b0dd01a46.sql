-- Create a security definer function to handle order creation with proper privileges
-- This function will run with elevated privileges to access log_items table

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_user_id UUID,
  p_total_amount NUMERIC,
  p_cart_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_item_id UUID;
  v_cart_item JSONB;
  v_available_log_items RECORD;
  v_quantity_assigned INT;
  v_remaining_count INT;
BEGIN
  -- Validate user
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized user';
  END IF;

  -- Create the order
  INSERT INTO public.orders (user_id, total_amount, status)
  VALUES (p_user_id, p_total_amount, 'completed')
  RETURNING id INTO v_order_id;

  -- Process each cart item
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- Create order item
    INSERT INTO public.order_items (order_id, log_id, quantity, price_per_item)
    VALUES (
      v_order_id,
      (v_cart_item->>'log_id')::UUID,
      (v_cart_item->>'quantity')::INT,
      (v_cart_item->>'price')::NUMERIC
    )
    RETURNING id INTO v_order_item_id;

    -- Assign log items and mark as unavailable
    v_quantity_assigned := 0;
    
    FOR v_available_log_items IN 
      SELECT id FROM public.log_items
      WHERE log_id = (v_cart_item->>'log_id')::UUID
        AND is_available = true
      LIMIT (v_cart_item->>'quantity')::INT
    LOOP
      -- Create order_log_items relationship
      INSERT INTO public.order_log_items (order_item_id, log_item_id)
      VALUES (v_order_item_id, v_available_log_items.id);

      -- Mark log item as unavailable
      UPDATE public.log_items
      SET is_available = false
      WHERE id = v_available_log_items.id;

      v_quantity_assigned := v_quantity_assigned + 1;
    END LOOP;

    -- Verify we assigned enough items
    IF v_quantity_assigned < (v_cart_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'Insufficient stock for log item';
    END IF;

    -- Update log stock count
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
$$;