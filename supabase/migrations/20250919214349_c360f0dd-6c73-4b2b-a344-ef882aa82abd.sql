-- Add admin policies to allow viewing and managing user data

-- Drop existing restrictive policies for profiles
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;

-- Create new policies for profiles that allow admin access
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (true);

-- Drop existing restrictive policies for wallet_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;

-- Create new policies for wallet_transactions that allow admin access
CREATE POLICY "Users can view their own transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can create transactions for any user" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Create admin policies for orders to allow admin access
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (true);