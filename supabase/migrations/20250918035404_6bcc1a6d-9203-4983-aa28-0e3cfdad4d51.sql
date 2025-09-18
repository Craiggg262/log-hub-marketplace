-- Fix RLS policies to resolve loading and checkout issues

-- Add missing INSERT policy for order_items table
CREATE POLICY "Users can create order items for their orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Update the cart_items table to better handle upserts
-- Add an UPDATE policy for cart_items
CREATE POLICY "Users can update their own cart items" 
ON public.cart_items 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add unique constraint with ON CONFLICT handling for better upserts
-- First drop the existing constraint if it exists and recreate it
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_log_id_key;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_log_id_key UNIQUE (user_id, log_id);

-- Update orders table to allow status updates
CREATE POLICY "Users can update their own order status" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Ensure profiles table has proper policies
-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);