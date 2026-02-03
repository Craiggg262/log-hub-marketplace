
-- Add a column to track if an order has been cashed out
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashed_out BOOLEAN NOT NULL DEFAULT false;

-- Update orders that have already been cashed out (based on existing refund transactions)
UPDATE public.orders o
SET cashed_out = true
WHERE EXISTS (
  SELECT 1 FROM wallet_transactions wt
  WHERE wt.description LIKE '%Cashout from order #' || LEFT(o.id::text, 8) || '%'
  AND wt.transaction_type = 'refund'
);
