import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Log {
  id: string;
  title: string;
  description: string;
  price: number;
  category_id: string;
  stock: number;
  in_stock: boolean;
  rating: number;
  reviews: number;
  image: string;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function useLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select(`
          *,
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchCategories()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    logs,
    categories,
    loading,
    error,
    refetch: () => {
      fetchLogs();
      fetchCategories();
    },
  };
}