CREATE TABLE IF NOT EXISTS public.crypto_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  invoice_id text,
  payment_id text,
  order_id text NOT NULL UNIQUE,
  amount_naira numeric NOT NULL,
  amount_usd numeric NOT NULL,
  pay_currency text,
  actually_paid numeric,
  status text NOT NULL DEFAULT 'waiting',
  credited boolean NOT NULL DEFAULT false,
  invoice_url text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crypto_payments TO authenticated;
GRANT ALL ON public.crypto_payments TO service_role;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own crypto payments" ON public.crypto_payments FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE TRIGGER update_crypto_payments_updated_at BEFORE UPDATE ON public.crypto_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.esim_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  iccid text,
  esim_id text,
  country_name text NOT NULL,
  country_iso2 text NOT NULL,
  data_gb numeric NOT NULL,
  operator text,
  cost_usd numeric NOT NULL,
  charged_naira numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  lpa_string text,
  qr_code text,
  direct_install_url text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.esim_orders TO authenticated;
GRANT ALL ON public.esim_orders TO service_role;
ALTER TABLE public.esim_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own esim orders" ON public.esim_orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE TRIGGER update_esim_orders_updated_at BEFORE UPDATE ON public.esim_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();