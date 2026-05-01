CREATE OR REPLACE FUNCTION public.get_admin_revenue_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_lite numeric;
  v_king numeric;
  v_vtu numeric;
  v_sms numeric;
  v_lite_count bigint;
  v_king_count bigint;
  v_vtu_count bigint;
  v_sms_count bigint;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  SELECT COALESCE(SUM(total_amount),0), COUNT(*) INTO v_lite, v_lite_count FROM public.orders WHERE status='completed';
  SELECT COUNT(*) INTO v_lite_count FROM public.orders;
  SELECT COALESCE(SUM(total_amount),0) INTO v_lite FROM public.orders WHERE status='completed';

  SELECT COALESCE(SUM(total_amount),0) INTO v_king FROM public.universal_logs_orders WHERE status='completed';
  SELECT COUNT(*) INTO v_king_count FROM public.universal_logs_orders;

  SELECT COALESCE(SUM(amount),0) INTO v_vtu FROM public.vtu_orders WHERE status='completed';
  SELECT COUNT(*) INTO v_vtu_count FROM public.vtu_orders;

  SELECT COALESCE(SUM(charged_price),0) INTO v_sms FROM public.sms_verification_orders WHERE status <> 'pending';
  SELECT COUNT(*) INTO v_sms_count FROM public.sms_verification_orders;

  RETURN jsonb_build_object(
    'lite_revenue', v_lite,
    'king_revenue', v_king,
    'vtu_revenue', v_vtu,
    'sms_revenue', v_sms,
    'total_revenue', v_lite + v_king + v_vtu + v_sms,
    'lite_count', v_lite_count,
    'king_count', v_king_count,
    'vtu_count', v_vtu_count,
    'sms_count', v_sms_count,
    'total_orders', v_lite_count + v_king_count + v_vtu_count + v_sms_count
  );
END;
$$;