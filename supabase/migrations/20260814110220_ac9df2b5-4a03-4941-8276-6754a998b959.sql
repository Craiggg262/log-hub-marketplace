CREATE TABLE IF NOT EXISTS public.pikasim_esim_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  package_code TEXT NOT NULL,
  package_name TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'data',
  category TEXT NOT NULL DEFAULT 'country',
  location TEXT,
  location_code TEXT,
  region TEXT,
  data_gb NUMERIC,
  is_unlimited BOOLEAN NOT NULL DEFAULT false,
  validity_days INTEGER,
  has_voice BOOLEAN NOT NULL DEFAULT false,
  has_sms BOOLEAN NOT NULL DEFAULT false,
  voice_minutes INTEGER NOT NULL DEFAULT 0,
  sms_count INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC NOT NULL DEFAULT 0,
  charged_naira NUMERIC NOT NULL DEFAULT 0,
  provider_order_id TEXT,
  external_order_id TEXT,
  iccid TEXT,
  qr_code_url TEXT,
  activation_code TEXT,
  lpa_url TEXT,
  short_url TEXT,
  msisdn TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  raw JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pikasim_esim_orders_user_idx ON public.pikasim_esim_orders(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS pikasim_esim_orders_external_idx ON public.pikasim_esim_orders(external_order_id) WHERE external_order_id IS NOT NULL;

GRANT SELECT ON public.pikasim_esim_orders TO authenticated;
GRANT ALL ON public.pikasim_esim_orders TO service_role;

ALTER TABLE public.pikasim_esim_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pikasim esims"
ON public.pikasim_esim_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_pikasim_esim_orders_updated_at
BEFORE UPDATE ON public.pikasim_esim_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();