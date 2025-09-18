-- Fix the function search_path security issue
CREATE OR REPLACE FUNCTION public.get_available_log_items_count(log_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.log_items
  WHERE log_id = log_uuid AND is_available = true;
$$;