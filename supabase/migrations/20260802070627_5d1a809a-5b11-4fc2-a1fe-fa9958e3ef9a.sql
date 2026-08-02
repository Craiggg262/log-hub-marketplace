CREATE TABLE public.leaderboard_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboard_adjustments TO authenticated;
GRANT ALL ON public.leaderboard_adjustments TO service_role;

ALTER TABLE public.leaderboard_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage leaderboard adjustments"
ON public.leaderboard_adjustments FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER update_leaderboard_adjustments_updated_at
BEFORE UPDATE ON public.leaderboard_adjustments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.leaderboard_adjustments (user_id, amount, reason)
VALUES ('73875a3b-91ef-476f-9a79-ad8d192b6b78', 4700, 'Admin bonus adjustment');

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(p_full_email boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    UNION ALL
    SELECT user_id, amount, created_at FROM public.leaderboard_adjustments
  ), agg AS (
    SELECT s.user_id, SUM(s.amt)::numeric AS total
    FROM spend s
    WHERE s.created_at >= v_start AND s.created_at <= LEAST(v_end, now())
    GROUP BY s.user_id
    HAVING SUM(s.amt) > 0
  ), ranked AS (
    SELECT a.user_id, a.total, ROW_NUMBER() OVER (ORDER BY a.total DESC) AS position, p.email
    FROM agg a
    LEFT JOIN public.profiles p ON p.user_id = a.user_id
  )
  SELECT
    COALESCE(jsonb_agg(jsonb_build_object(
      'position', r.position,
      'email', CASE WHEN p_full_email THEN r.email ELSE public.mask_email(r.email) END,
      'total', r.total
    ) ORDER BY r.position) FILTER (WHERE r.position <= CASE WHEN p_full_email THEN 100 ELSE 4 END), '[]'::jsonb),
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
$function$;