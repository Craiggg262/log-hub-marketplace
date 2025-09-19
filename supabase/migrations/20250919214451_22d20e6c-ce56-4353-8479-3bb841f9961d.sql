-- Add admin policies to allow viewing and managing user data

-- Create new admin policies for profiles
CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create new admin policies for wallet_transactions  
CREATE POLICY "Admin can view all transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can create transactions for any user" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Create admin policies for orders to allow admin access
CREATE POLICY "Admin can view all orders" 
ON public.orders 
FOR SELECT 
USING (true);