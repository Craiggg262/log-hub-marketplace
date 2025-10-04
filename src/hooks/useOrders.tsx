import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  order_items: {
    id: string;
    log_id: string;
    quantity: number;
    price_per_item: number;
    logs: {
      id: string;
      title: string;
      description: string;
      categories: {
        name: string;
      } | null;
    };
    order_log_items: {
      id: string;
      log_items: {
        id: string;
        account_details: string;
        created_at: string;
      };
    }[];
  }[];
}

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            log_id,
            quantity,
            price_per_item,
            logs (
              id,
              title,
              description,
              categories (
                name
              )
            ),
            order_log_items (
              id,
              log_items (
                id,
                account_details,
                created_at
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const createOrderFromCart = async (cartItems: any[], userProfile: any) => {
    if (!user || cartItems.length === 0) return null;

    try {
      const totalAmount = cartItems.reduce((total, item) => {
        return total + (item.logs.price * item.quantity);
      }, 0);

      // Check if user has sufficient wallet balance
      if (!userProfile || userProfile.wallet_balance < totalAmount) {
        throw new Error(`Insufficient wallet balance. Required: ₦${totalAmount.toLocaleString('en-NG')}, Available: ₦${(userProfile?.wallet_balance || 0).toLocaleString('en-NG')}`);
      }

      // Prepare cart items data for the database function
      const cartItemsData = cartItems.map(item => ({
        log_id: item.log_id,
        quantity: item.quantity,
        price: item.logs.price
      }));

      // Call the database function to create order with proper privileges
      const { data: orderId, error: orderError } = await supabase
        .rpc('create_order_from_cart', {
          p_user_id: user.id,
          p_total_amount: totalAmount,
          p_cart_items: cartItemsData
        });

      if (orderError) throw orderError;

      await fetchOrders();
      return { id: orderId };
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'completed' | 'failed') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  return {
    orders,
    loading,
    createOrderFromCart,
    updateOrderStatus,
    refetch: fetchOrders,
  };
}