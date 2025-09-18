-- Update all existing logs to have 0 stock
UPDATE public.logs SET stock = 0, in_stock = false;

-- Create log_items table for sub-accounts/details that admins can add to each log
CREATE TABLE public.log_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.logs(id) ON DELETE CASCADE,
  account_details TEXT NOT NULL, -- The actual account details (username, password, etc.)
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on log_items
ALTER TABLE public.log_items ENABLE ROW LEVEL SECURITY;

-- Create policies for log_items
CREATE POLICY "Admins can manage log items" 
ON public.log_items 
FOR ALL 
USING (true); -- For now, allow all operations (will be controlled at application level)

-- Create order_log_items table to track which log items were given to which order
CREATE TABLE public.order_log_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  log_item_id UUID NOT NULL REFERENCES public.log_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_item_id, log_item_id)
);

-- Enable RLS on order_log_items
ALTER TABLE public.order_log_items ENABLE ROW LEVEL SECURITY;

-- Create policy for order_log_items - users can only see items from their own orders
CREATE POLICY "Users can view their own order log items" 
ON public.order_log_items 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.order_items oi
  JOIN public.orders o ON oi.order_id = o.id
  WHERE oi.id = order_log_items.order_item_id 
  AND o.user_id = auth.uid()
));

-- Add trigger for log_items updated_at
CREATE TRIGGER update_log_items_updated_at
BEFORE UPDATE ON public.log_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to get available log items count for a log
CREATE OR REPLACE FUNCTION public.get_available_log_items_count(log_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.log_items
  WHERE log_id = log_uuid AND is_available = true;
$$;