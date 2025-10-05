-- Fix security issue: Restrict logs table modifications to admins only

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Admins can insert logs" ON public.logs;
DROP POLICY IF EXISTS "Admins can update logs" ON public.logs;
DROP POLICY IF EXISTS "Admins can delete logs" ON public.logs;

-- Create new secure policies that properly verify admin status
CREATE POLICY "Admins can insert logs" 
ON public.logs 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update logs" 
ON public.logs 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete logs" 
ON public.logs 
FOR DELETE 
USING (is_admin());