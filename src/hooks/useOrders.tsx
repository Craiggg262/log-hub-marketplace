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

  const createOrderFromCart = async (cartItems: any[]) => {
    if (!user || cartItems.length === 0) return null;

    try {
      const totalAmount = cartItems.reduce((total, item) => {
        return total + (item.logs.price * item.quantity);
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'completed' // Mark as completed since payment is from wallet
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and assign log items
      for (const cartItem of cartItems) {
        // Create order item
        const { data: orderItem, error: orderItemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            log_id: cartItem.log_id,
            quantity: cartItem.quantity,
            price_per_item: cartItem.logs.price
          })
          .select()
          .single();

        if (orderItemError) throw orderItemError;

        // Get available log items for this log
        const { data: availableLogItems, error: logItemsError } = await supabase
          .from('log_items')
          .select('*')
          .eq('log_id', cartItem.log_id)
          .eq('is_available', true)
          .limit(cartItem.quantity);

        if (logItemsError) throw logItemsError;

        if (!availableLogItems || availableLogItems.length < cartItem.quantity) {
          throw new Error(`Insufficient stock for ${cartItem.logs.title}`);
        }

        // Assign log items to order and mark as unavailable
        for (const logItem of availableLogItems) {
          // Create order_log_items relationship
          const { error: orderLogItemError } = await supabase
            .from('order_log_items')
            .insert({
              order_item_id: orderItem.id,
              log_item_id: logItem.id
            });

          if (orderLogItemError) throw orderLogItemError;

          // Mark log item as unavailable
          const { error: updateError } = await supabase
            .from('log_items')
            .update({ is_available: false })
            .eq('id', logItem.id);

          if (updateError) throw updateError;
        }

        // Update log stock count
        const { data: remainingItems } = await supabase
          .from('log_items')
          .select('id')
          .eq('log_id', cartItem.log_id)
          .eq('is_available', true);

        const remainingCount = remainingItems?.length || 0;
        
        await supabase
          .from('logs')
          .update({ 
            stock: remainingCount,
            in_stock: remainingCount > 0
          })
          .eq('id', cartItem.log_id);
      }

      await fetchOrders();
      return order;
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