-- Drop the existing overly permissive policy on log_items
DROP POLICY IF EXISTS "Admins can manage log items" ON public.log_items;

-- Create new restrictive policies for log_items that only allow admin access
CREATE POLICY "Only admins can view log items"
ON public.log_items
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Only admins can insert log items"
ON public.log_items
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update log items"
ON public.log_items
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Only admins can delete log items"
ON public.log_items
FOR DELETE
TO authenticated
USING (is_admin());