-- Tighten RLS policies to prevent wallet/order/referral exploits

-- ORDERS: remove overly permissive update policies (order status must be server-controlled)
DROP POLICY IF EXISTS "System can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own order status" ON public.orders;

-- REFERRALS: restrict inserts to the referred user only (prevents arbitrary referral forging)
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
CREATE POLICY "Referred user can create referral"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = referred_id
  AND referrer_id <> referred_id
);

-- REFERRAL_EARNINGS: block direct client inserts; only SECURITY DEFINER RPCs should create earnings
DROP POLICY IF EXISTS "System can insert earnings" ON public.referral_earnings;