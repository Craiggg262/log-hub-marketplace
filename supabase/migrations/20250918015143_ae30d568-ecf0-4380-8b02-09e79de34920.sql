-- Create users profile table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create logs table
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  stock INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 4.5,
  reviews INTEGER DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_id UUID NOT NULL REFERENCES public.logs(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  log_id UUID NOT NULL REFERENCES public.logs(id),
  quantity INTEGER NOT NULL,
  price_per_item DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'credit', 'debit'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for categories (public read)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- Create RLS policies for logs (public read)
CREATE POLICY "Logs are viewable by everyone" ON public.logs FOR SELECT USING (true);

-- Create RLS policies for cart items
CREATE POLICY "Users can manage their own cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for order items
CREATE POLICY "Users can view their own order items" ON public.order_items 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- Create RLS policies for wallet transactions
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_logs_updated_at
  BEFORE UPDATE ON public.logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert categories
INSERT INTO public.categories (name, icon, color) VALUES
('Facebook', 'facebook', '#1877F2'),
('Instagram', 'instagram', '#E4405F'),
('TikTok', 'music', '#000000'),
('Twitter', 'twitter', '#1DA1F2'),
('VPN/Streaming', 'shield', '#8B5CF6');

-- Insert Facebook logs
INSERT INTO public.logs (title, description, price, category_id, stock, image) 
SELECT 
  'Facebook 0-20 Friends USA💙(2yrs+)',
  'Accessed either by mail or 2FA',
  2290.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook'
UNION ALL
SELECT 
  'Facebook 100-120 Friends Foreign💙(3yrs+)',
  'Accessed either by mail or 2FA',
  3490.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook'
UNION ALL
SELECT 
  'Facebook 100-200 Friends USA💙(2yrs+)',
  'Accessed either by mail or 2FA',
  5210.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook'
UNION ALL
SELECT 
  'Facebook Thailand 10-30 Friends💙(4yrs+)',
  'Accessed either by mail or 2FA',
  3125.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook'
UNION ALL
SELECT 
  'Random Country Facebook💙(2yrs+)',
  'Accessed either by mail or 2FA',
  1980.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook'
UNION ALL
SELECT 
  'Facebook 0-5000 Friends USA Switch Profile💙(3yrs+)',
  'Accessed either by mail or 2FA',
  6599.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook'
UNION ALL
SELECT 
  'Switch Profile Facebook Random Country💙',
  'Accessed either by mail or 2FA',
  4890.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook'
UNION ALL
SELECT 
  'Naija Switch Profile Facebook💙(4yrs+)',
  'Accessed either by mail or 2FA',
  4390.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/facebook-new.png'
FROM public.categories c WHERE c.name = 'Facebook';

-- Insert Instagram logs
INSERT INTO public.logs (title, description, price, category_id, stock, image) 
SELECT 
  'IG 0-10+ Followers❤(3yrs+)',
  'Account creation date may back date or be changed to the date hacked',
  2010.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/instagram-new.png'
FROM public.categories c WHERE c.name = 'Instagram'
UNION ALL
SELECT 
  'IG 30-100+ Followers❤(3yrs+)',
  'Account creation date may back date or be changed to the date hacked',
  2690.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/instagram-new.png'
FROM public.categories c WHERE c.name = 'Instagram'
UNION ALL
SELECT 
  'IG 100-200+ Followers❤(5yrs+)',
  'Account creation date may back date or be changed to the date hacked',
  3990.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/instagram-new.png'
FROM public.categories c WHERE c.name = 'Instagram'
UNION ALL
SELECT 
  'IG 350-500+ Followers❤(5yrs+)',
  'Account creation date may back date or be changed to the date hacked',
  5020.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/instagram-new.png'
FROM public.categories c WHERE c.name = 'Instagram'
UNION ALL
SELECT 
  'IG 1000-1500+ Followers❤(2yrs+)',
  'Account creation date may back date or be changed to the date hacked',
  6890.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/instagram-new.png'
FROM public.categories c WHERE c.name = 'Instagram';

-- Insert TikTok logs
INSERT INTO public.logs (title, description, price, category_id, stock, image) 
SELECT 
  'Tiktok USA/CA 100+ Followers🖤',
  'High quality TikTok account with active followers',
  2950.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok'
UNION ALL
SELECT 
  'Tiktok USA/CA 200+ Followers🖤',
  'High quality TikTok account with active followers',
  3450.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok'
UNION ALL
SELECT 
  'Tiktok USA/CA 500+ Followers🖤(4yrs+)',
  'High quality TikTok account with active followers',
  4990.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok'
UNION ALL
SELECT 
  'Tiktok USA/CA 1000+ Followers🖤',
  'High quality TikTok account with active followers',
  5670.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok'
UNION ALL
SELECT 
  'Tiktok USA/CA 2000+ Followers🖤',
  'High quality TikTok account with active followers',
  8990.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok'
UNION ALL
SELECT 
  'Tiktok USA/CA 5000+ Followers🖤',
  'High quality TikTok account with active followers',
  18800.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok'
UNION ALL
SELECT 
  'Tiktok USA/CA 10000+ Followers🖤',
  'High quality TikTok account with active followers',
  34990.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok'
UNION ALL
SELECT 
  'Tiktok USA/CA 20000+ Followers🖤',
  'High quality TikTok account with active followers',
  56579.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/tiktok.png'
FROM public.categories c WHERE c.name = 'TikTok';

-- Insert Twitter logs
INSERT INTO public.logs (title, description, price, category_id, stock, image) 
SELECT 
  'Empty Foreign Twitter🖤',
  'Fresh Twitter account ready for use',
  1350.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/twitter.png'
FROM public.categories c WHERE c.name = 'Twitter'
UNION ALL
SELECT 
  'Twitter 100+ Followers🖤',
  'Twitter account with established followers',
  3020.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/twitter.png'
FROM public.categories c WHERE c.name = 'Twitter'
UNION ALL
SELECT 
  'Twitter 300+ Followers🖤',
  'Twitter account with established followers',
  4070.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/twitter.png'
FROM public.categories c WHERE c.name = 'Twitter'
UNION ALL
SELECT 
  'Twitter 500+ Followers🖤',
  'Twitter account with established followers',
  6990.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/twitter.png'
FROM public.categories c WHERE c.name = 'Twitter';

-- Insert VPN/Streaming logs
INSERT INTO public.logs (title, description, price, category_id, stock, image) 
SELECT 
  'Express VPN 1-6 Months❤🙌',
  'Premium VPN service with global servers',
  3800.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/vpn.png'
FROM public.categories c WHERE c.name = 'VPN/Streaming'
UNION ALL
SELECT 
  'PIA VPN 1-6 Months💙',
  'Private Internet Access VPN subscription',
  3800.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/vpn.png'
FROM public.categories c WHERE c.name = 'VPN/Streaming'
UNION ALL
SELECT 
  'HMA VPN 1-6 Months💜',
  'HideMyAss VPN service subscription',
  3800.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/vpn.png'
FROM public.categories c WHERE c.name = 'VPN/Streaming'
UNION ALL
SELECT 
  'SurfShark VPN 1-6 MONTHS💙',
  'SurfShark VPN premium subscription',
  3800.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/vpn.png'
FROM public.categories c WHERE c.name = 'VPN/Streaming'
UNION ALL
SELECT 
  'Netflix❤',
  'Netflix premium streaming account',
  4500.00,
  c.id,
  FLOOR(RANDOM() * 50) + 10,
  'https://img.icons8.com/color/96/netflix.png'
From public.categories c WHERE c.name = 'VPN/Streaming';