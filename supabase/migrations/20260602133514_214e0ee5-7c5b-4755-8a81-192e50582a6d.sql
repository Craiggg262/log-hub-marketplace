
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payscribe_customer_id text,
  ADD COLUMN IF NOT EXISTS payscribe_account_number text,
  ADD COLUMN IF NOT EXISTS payscribe_account_bank text,
  ADD COLUMN IF NOT EXISTS payscribe_account_name text;
