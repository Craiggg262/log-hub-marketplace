-- Add phone number and virtual account columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS virtual_account_number TEXT,
ADD COLUMN IF NOT EXISTS virtual_account_bank TEXT,
ADD COLUMN IF NOT EXISTS virtual_account_name TEXT;