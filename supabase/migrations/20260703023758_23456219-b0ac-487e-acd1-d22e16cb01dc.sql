
CREATE TABLE public.boosting_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider_order text NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  link text NOT NULL,
  quantity integer NOT NULL,
  charge_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  start_count integer,
  remains integer,
  refunded_amount numeric NOT NULL DEFAULT 0,
  average_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.boosting_orders TO authenticated;
GRANT ALL ON public.boosting_orders TO service_role;

ALTER TABLE public.boosting_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own boosting orders" ON public.boosting_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own boosting orders" ON public.boosting_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_boosting_orders_updated_at
  BEFORE UPDATE ON public.boosting_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_boosting_orders_user ON public.boosting_orders(user_id, created_at DESC);
