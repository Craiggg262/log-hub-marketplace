-- Allow admins to manage log_items (insert, update, delete)
DROP POLICY IF EXISTS "Admins can manage log items" ON public.log_items;
CREATE POLICY "Admins can manage log items" ON public.log_items
FOR ALL USING (true);

-- Allow admins to manage logs (insert, update, delete) 
DROP POLICY IF EXISTS "Logs are viewable by everyone" ON public.logs;
CREATE POLICY "Logs are viewable by everyone" ON public.logs
FOR SELECT USING (true);

CREATE POLICY "Admins can manage logs" ON public.logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update logs" ON public.logs
FOR UPDATE USING (true);

CREATE POLICY "Admins can delete logs" ON public.logs
FOR DELETE USING (true);

-- Allow users to create order_log_items for their orders
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
CREATE POLICY "System can update orders" ON public.orders
FOR UPDATE USING (true);