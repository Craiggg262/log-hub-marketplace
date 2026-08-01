
CREATE OR REPLACE FUNCTION public.weekly_comp_window()
RETURNS TABLE(starts_at timestamptz, ends_at timestamptz, is_active boolean)
LANGUAGE plpgsql STABLE
SET search_path = public
AS $$
DECLARE
  v_local timestamp;
  v_monday date;
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  v_local := (now() AT TIME ZONE 'Africa/Lagos');
  v_monday := (v_local::date - ((EXTRACT(ISODOW FROM v_local)::int - 1)));
  v_start := ((v_monday::timestamp + interval '6 hours') AT TIME ZONE 'Africa/Lagos');
  v_end := ((v_monday::timestamp + interval '6 days 18 hours') AT TIME ZONE 'Africa/Lagos');
  RETURN QUERY SELECT v_start, v_end, (now() >= v_start AND now() <= v_end);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_email IS NULL OR position('@' in p_email) = 0 THEN 'user*****'
    ELSE left(split_part(p_email,'@',1), 3) || repeat('*', greatest(length(split_part(p_email,'@',1)) - 3, 1)) || '@' || split_part(p_email,'@',2)
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(p_full_email boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz; v_end timestamptz; v_active boolean;
  v_is_admin boolean;
  v_top jsonb; v_me jsonb;
  v_uid uuid := auth.uid();
  v_min_qualify numeric := 8000;
BEGIN
  SELECT w.starts_at, w.ends_at, w.is_active INTO v_start, v_end, v_active FROM public.weekly_comp_window() w;

  v_is_admin := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'admin');
  IF p_full_email AND NOT v_is_admin THEN
    RETURN jsonb_build_object('error','Unauthorized');
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _lb (user_id uuid, total numeric) ON COMMIT DROP;

  WITH spend AS (
    SELECT user_id, total_amount AS amt, created_at FROM public.orders WHERE status = 'completed'
    UNION ALL
    SELECT user_id, total_amount, created_at FROM public.universal_logs_orders WHERE status = 'completed'
    UNION ALL
    SELECT user_id, amount, created_at FROM public.vtu_orders WHERE status = 'completed'
    UNION ALL
    SELECT user_id, charged_price, created_at FROM public.sms_verification_orders WHERE refunded = false AND status <> 'pending'
    UNION ALL
    SELECT user_id, (charge_amount - COALESCE(refunded_amount,0)), created_at FROM public.boosting_orders
  ), agg AS (
    SELECT s.user_id, SUM(s.amt)::numeric AS total
    FROM spend s
    WHERE s.created_at >= v_start AND s.created_at <= LEAST(v_end, now())
    GROUP BY s.user_id
    HAVING SUM(s.amt) > 0
  ), ranked AS (
    SELECT a.user_id, a.total, ROW_NUMBER() OVER (ORDER BY a.total DESC) AS position,
           p.email
    FROM agg a
    LEFT JOIN public.profiles p ON p.user_id = a.user_id
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'position', r.position,
      'email', CASE WHEN p_full_email THEN r.email ELSE public.mask_email(r.email) END,
      'total', r.total
    ) ORDER BY r.position) FILTER (WHERE r.position <= CASE WHEN p_full_email THEN 100 ELSE 10 END), '[]'::jsonb),
    (SELECT jsonb_build_object('position', r2.position, 'email', public.mask_email(r2.email), 'total', r2.total, 'qualified', r2.total >= v_min_qualify)
       FROM ranked r2 WHERE r2.user_id = v_uid)
  INTO v_top, v_me
  FROM ranked r;

  RETURN jsonb_build_object(
    'active', v_active,
    'starts_at', v_start,
    'ends_at', v_end,
    'min_qualify', v_min_qualify,
    'top', COALESCE(v_top, '[]'::jsonb),
    'me', v_me
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard(boolean) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.weekly_comp_window() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.mask_email(text) TO authenticated, anon;
