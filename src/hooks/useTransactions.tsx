import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'deposit' | 'purchase' | 'refund';
  description: string;
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (
    amount: number,
    type: 'deposit' | 'purchase' | 'refund',
    description: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          amount,
          transaction_type: type,
          description
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update user's wallet balance
      if (type === 'deposit' || type === 'refund') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', user.id)
          .single();
          
        if (profile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              wallet_balance: profile.wallet_balance + amount
            })
            .eq('user_id', user.id);
          
          if (profileError) throw profileError;
        }
      } else if (type === 'purchase') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', user.id)
          .single();
          
        if (profile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
              wallet_balance: profile.wallet_balance - Math.abs(amount)
            })
            .eq('user_id', user.id);
          
          if (profileError) throw profileError;
        }
      }

      await fetchTransactions();
      return data;
    } catch (err) {
      console.error('Error creating transaction:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [user]);

  return {
    transactions,
    loading,
    createTransaction,
    refetch: fetchTransactions,
  };
}