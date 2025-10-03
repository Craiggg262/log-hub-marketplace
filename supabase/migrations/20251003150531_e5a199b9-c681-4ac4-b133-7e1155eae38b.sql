-- Remove the overly permissive RLS policies that were causing security issues
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can view all transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admin can create transactions for any user" ON public.wallet_transactions;

-- The existing secure policies using is_admin() function are sufficient:
-- "Admins can view all profiles" - uses is_admin()
-- "Admins can update all profiles" - uses is_admin()
-- "Admins can view all transactions" - uses is_admin()
-- "Admins can create transactions for any user" - uses is_admin()