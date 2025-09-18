import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Log } from './useLogs';

export interface CartItem {
  id: string;
  user_id: string;
  log_id: string;
  quantity: number;
  created_at: string;
  logs: Log;
}

export function useCart() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          logs (
            *,
            categories (
              id,
              name,
              icon,
              color
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (logId: string, quantity: number = 1) => {
    if (!user) throw new Error('Must be logged in to add to cart');

    try {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          log_id: logId,
          quantity,
        });

      if (error) throw error;
      await fetchCart();
    } catch (err) {
      throw err;
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (err) {
      throw err;
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;
      await fetchCart();
    } catch (err) {
      throw err;
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems([]);
    } catch (err) {
      throw err;
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.logs.price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  return {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems,
    refetch: fetchCart,
  };
}