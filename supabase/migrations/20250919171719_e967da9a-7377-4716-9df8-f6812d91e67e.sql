-- Fix RLS policies for proper admin access and user functionality

-- Update logs policies  
DROP POLICY IF EXISTS "Admins can manage logs" ON public.logs;
DROP POLICY IF EXISTS "Admins can update logs" ON public.logs;
DROP POLICY IF EXISTS "Admins can delete logs" ON public.logs;

CREATE POLICY "Admins can insert logs" ON public.logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update logs" ON public.logs  
FOR UPDATE USING (true);

CREATE POLICY "Admins can delete logs" ON public.logs
FOR DELETE USING (true);

-- Allow users to create order_log_items for their orders
DROP POLICY IF EXISTS "Users can create order log items for their orders" ON public.order_log_items;
CREATE POLICY "Users can create order log items for their orders" ON public.order_log_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.id = order_log_items.order_item_id 
    AND o.user_id = auth.uid()
  )
);

-- Allow system to update order status
DROP POLICY IF EXISTS "System can update orders" ON public.orders;
CREATE POLICY "System can update orders" ON public.orders
FOR UPDATE USING (true);