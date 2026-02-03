-- Create a secure server-side function for cashout that prevents double refunds
CREATE OR REPLACE FUNCTION public.process_order_cashout(p_order_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_refund_amount numeric;
  v_result jsonb;
BEGIN
  -- Lock the order row to prevent race conditions
  SELECT * INTO v_order 
  FROM public.orders 
  WHERE id = p_order_id AND user_id = p_user_id
  FOR UPDATE;
  
  -- Check if order exists and belongs to user
  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or unauthorized');
  END IF;
  
  -- Check if already cashed out
  IF v_order.cashed_out = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order has already been cashed out');
  END IF;
  
  -- Check if order is completed
  IF v_order.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only completed orders can be cashed out');
  END IF;
  
  -- Calculate refund amount (full order amount)
  v_refund_amount := v_order.total_amount;
  
  -- Mark order as cashed out FIRST (before any balance updates)
  UPDATE public.orders 
  SET cashed_out = true 
  WHERE id = p_order_id;
  
  -- Create refund transaction
  INSERT INTO public.wallet_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, v_refund_amount, 'refund', 'Order #' || LEFT(p_order_id::text, 8) || ' cashout refund');
  
  -- Update user wallet balance
  UPDATE public.profiles 
  SET wallet_balance = wallet_balance + v_refund_amount 
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'refund_amount', v_refund_amount,
    'message', 'Cashout processed successfully'
  );
END;
$$;

-- Create a function for admin balance adjustment with audit trail
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_target_user_id uuid, 
  p_amount numeric, 
  p_reason text,
  p_admin_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_current_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Verify the caller is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Get current balance
  SELECT wallet_balance INTO v_current_balance 
  FROM public.profiles 
  WHERE user_id = p_target_user_id;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Calculate new balance (can be negative adjustment)
  v_new_balance := v_current_balance + p_amount;
  
  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    v_new_balance := 0;
  END IF;
  
  -- Update balance
  UPDATE public.profiles 
  SET wallet_balance = v_new_balance 
  WHERE user_id = p_target_user_id;
  
  -- Create audit transaction
  INSERT INTO public.wallet_transactions (user_id, amount, transaction_type, description)
  VALUES (
    p_target_user_id, 
    p_amount, 
    CASE WHEN p_amount >= 0 THEN 'deposit' ELSE 'adjustment' END,
    'Admin adjustment: ' || p_reason
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'adjustment', p_amount
  );
END;
$$;