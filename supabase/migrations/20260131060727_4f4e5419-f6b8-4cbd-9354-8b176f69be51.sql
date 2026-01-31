-- Create VTU orders table to track data/airtime purchases
CREATE TABLE public.vtu_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('data', 'airtime')),
  network TEXT NOT NULL,
  network_id INTEGER NOT NULL,
  plan_id INTEGER,
  plan_name TEXT,
  mobile_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  api_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vtu_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own VTU orders
CREATE POLICY "Users can view their own VTU orders"
ON public.vtu_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own VTU orders
CREATE POLICY "Users can insert their own VTU orders"
ON public.vtu_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vtu_orders_updated_at
BEFORE UPDATE ON public.vtu_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();