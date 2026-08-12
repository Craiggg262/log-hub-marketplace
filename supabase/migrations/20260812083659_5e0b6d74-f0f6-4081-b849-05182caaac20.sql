ALTER TABLE public.crypto_payments
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'nowpayments';

CREATE INDEX IF NOT EXISTS crypto_payments_order_id_idx ON public.crypto_payments (order_id);