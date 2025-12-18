import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UniversalProduct {
  id: number;
  name: string;
  image: string;
  description: string;
  in_stock: number;
  price: string;
}

export interface UniversalCategory {
  id: number;
  name: string;
  products: UniversalProduct[];
}

export function useUniversalLogs() {
  const [categories, setCategories] = useState<UniversalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('no1logs-api', {
        body: { action: 'get_products', search }
      });

      if (error) throw error;
      
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching universal logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const getProductDetails = async (productId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('no1logs-api', {
        body: { action: 'get_product_details', productId }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching product details:', err);
      throw err;
    }
  };

  const getCategoryProducts = async (categoryId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('no1logs-api', {
        body: { action: 'get_category_products', categoryId }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching category products:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchProducts,
    getProductDetails,
    getCategoryProducts,
  };
}
