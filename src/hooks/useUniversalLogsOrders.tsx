import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UniversalLogsOrder {
  id: string;
  api_order_id: string | null;
  product_id: number;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  status: string;
  order_response: any;
  created_at: string;
}

export function useUniversalLogsOrders() {
  const [orders, setOrders] = useState<UniversalLogsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('universal_logs_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching universal logs orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  return { orders, loading, refetch: fetchOrders };
}