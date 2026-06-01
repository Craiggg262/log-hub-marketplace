import { useState } from 'react';

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

// No1logs has been removed entirely. This hook is kept as a no-op stub so any
// legacy imports continue to compile. It returns an empty catalog.
export function useUniversalLogs() {
  const [categories] = useState<UniversalCategory[]>([]);
  return {
    categories,
    loading: false,
    error: null as string | null,
    refetch: async (_search?: string) => {},
    getProductDetails: async (_productId: number) => null,
    getCategoryProducts: async (_categoryId: number) => null,
  };
}
