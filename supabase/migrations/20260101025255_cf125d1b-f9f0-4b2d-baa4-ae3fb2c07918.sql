-- Create referrals table to track who referred whom
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT referrals_referrer_id_not_self CHECK (referrer_id != referred_id)
);

-- Create referral_earnings table to track earnings from referrals
CREATE TABLE public.referral_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  order_id uuid,
  universal_order_id uuid,
  amount numeric NOT NULL,
  percentage numeric NOT NULL DEFAULT 5.00,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  withdrawal_type text NOT NULL CHECK (withdrawal_type IN ('wallet', 'bank')),
  bank_name text,
  account_number text,
  account_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN referral_code text UNIQUE;

-- Add total_referral_earnings column to profiles
ALTER TABLE public.profiles ADD COLUMN total_referral_earnings numeric NOT NULL DEFAULT 0;

-- Generate referral codes for existing users
UPDATE public.profiles
SET referral_code = LOWER(SUBSTRING(MD5(user_id::text || created_at::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Enable RLS on all new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS for referrals table
CREATE POLICY "Users can view their own referrals"
ON public.referrals FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals"
ON public.referrals FOR INSERT
WITH CHECK (true);

-- RLS for referral_earnings table
CREATE POLICY "Users can view their own earnings"
ON public.referral_earnings FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert earnings"
ON public.referral_earnings FOR INSERT
WITH CHECK (true);

-- RLS for withdrawal_requests table
CREATE POLICY "Users can view their own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal requests"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update all withdrawal requests"
ON public.withdrawal_requests FOR UPDATE
USING (is_admin());

-- Create trigger to update updated_at on withdrawal_requests
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := LOWER(SUBSTRING(MD5(NEW.user_id::text || NEW.created_at::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate referral code
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create function to process referral earnings (5% for life)
CREATE OR REPLACE FUNCTION public.process_referral_earning(
  p_buyer_id uuid,
  p_order_amount numeric,
  p_order_id uuid DEFAULT NULL,
  p_universal_order_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_earning numeric;
BEGIN
  -- Find the referrer
  SELECT referrer_id INTO v_referrer_id
  FROM public.referrals
  WHERE referred_id = p_buyer_id;
  
  -- If no referrer, exit
  IF v_referrer_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate 5% earning
  v_earning := p_order_amount * 0.05;
  
  -- Insert earning record
  INSERT INTO public.referral_earnings (referrer_id, referred_id, order_id, universal_order_id, amount, percentage)
  VALUES (v_referrer_id, p_buyer_id, p_order_id, p_universal_order_id, v_earning, 5.00);
  
  -- Update referrer's total earnings
  UPDATE public.profiles
  SET total_referral_earnings = total_referral_earnings + v_earning
  WHERE user_id = v_referrer_id;
END;
$$;