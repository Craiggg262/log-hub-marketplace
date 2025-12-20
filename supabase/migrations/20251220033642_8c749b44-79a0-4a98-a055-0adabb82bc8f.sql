-- Create table to store Universal Logs API orders
CREATE TABLE public.universal_logs_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  api_order_id TEXT,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_unit NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  order_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.universal_logs_orders ENABLE ROW LEVEL SECURITY;

-- Users can only view their own orders
CREATE POLICY "Users can view their own universal logs orders"
  ON public.universal_logs_orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own universal logs orders"
  ON public.universal_logs_orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster user queries
CREATE INDEX idx_universal_logs_orders_user_id ON public.universal_logs_orders(user_id);
CREATE INDEX idx_universal_logs_orders_created_at ON public.universal_logs_orders(created_at DESC);