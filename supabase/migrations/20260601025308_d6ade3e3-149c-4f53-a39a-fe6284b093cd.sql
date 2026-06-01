
ALTER TABLE public.sms_verification_orders
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'getatext',
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS operator text;
