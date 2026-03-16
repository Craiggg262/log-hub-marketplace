import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LoggsplugProduct {
  id: number;
  name: string;
  category: string;
  base_price: number;
  reseller_price: number;
  display_price: string;
  in_stock: number;
}

export interface LoggsplugCategory {
  name: string;
  products: LoggsplugProduct[];
}

export function useLoggsplug() {
  const [products, setProducts] = useState<LoggsplugProduct[]>([]);
  const [categories, setCategories] = useState<LoggsplugCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('loggsplug-api', {
        body: { action: 'get_products' },
      });

      if (error) throw error;

      if (data?.success && Array.isArray(data.data)) {
        setProducts(data.data);

        // Group by category
        const categoryMap = new Map<string, LoggsplugProduct[]>();
        for (const product of data.data) {
          const cat = product.category || 'Other';
          if (!categoryMap.has(cat)) categoryMap.set(cat, []);
          categoryMap.get(cat)!.push(product);
        }

        const cats: LoggsplugCategory[] = Array.from(categoryMap.entries()).map(
          ([name, products]) => ({ name, products })
        );
        setCategories(cats);
      } else {
        setProducts([]);
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching loggsplug products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async (productId: number, qty: number) => {
    const { data, error } = await supabase.functions.invoke('loggsplug-api', {
      body: { action: 'place_order', productId, qty },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || 'Order failed');
    return data;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    categories,
    loading,
    error,
    refetch: fetchProducts,
    placeOrder,
  };
}
