import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, ShoppingCart, Minus, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProductAccount {
  id: number;
  url: string;
}

interface RelatedProduct {
  id: number;
  image?: string;
  description?: string;
  in_stock: number;
  price: string;
}

interface ProductDetails {
  product: {
    id: number;
    product_name: string;
  };
  accounts: ProductAccount[];
  related_product?: RelatedProduct[];
}

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number;
  productName: string;
  price: string;
  inStock: number;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
  price,
  inStock,
}) => {
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [details, setDetails] = useState<ProductDetails | null>(null);

  const [activeProductId, setActiveProductId] = useState(productId);
  const [variants, setVariants] = useState<RelatedProduct[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const [unitPrice, setUnitPrice] = useState(price);
  const [availableStock, setAvailableStock] = useState(inStock);

  const [quantity, setQuantity] = useState(1);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const { toast } = useToast();
  const { user, profile } = useAuth();

  const maxPurchasable = useMemo(() => {
    const accountsLen = details?.accounts?.length ?? 0;
    if (accountsLen > 0) return accountsLen;
    if (Number.isFinite(availableStock) && availableStock > 0) return availableStock;
    return inStock > 0 ? inStock : 1;
  }, [details?.accounts?.length, availableStock, inStock]);

  useEffect(() => {
    if (!open || !productId) return;

    setDetails(null);
    setQuantity(1);
    setSelectedAccounts([]);

    setActiveProductId(productId);
    setVariants([]);
    setSelectedVariantId(null);

    setUnitPrice(price);
    setAvailableStock(inStock);

    void fetchProductDetails(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId]);

  useEffect(() => {
    // Auto-select accounts based on quantity
    const accounts = details?.accounts ?? [];
    if (accounts.length > 0) {
      const accountIds = accounts.slice(0, quantity).map((a) => a.id);
      setSelectedAccounts(accountIds);
    } else {
      setSelectedAccounts([]);
    }
  }, [quantity, details]);

  const fetchProductDetails = async (id: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('no1logs-api', {
        body: { action: 'get_product_details', productId: id },
      });

      if (error) throw error;

      setDetails(data);

      const rel: RelatedProduct[] = Array.isArray((data as any)?.related_product)
        ? ((data as any).related_product as RelatedProduct[])
        : [];

      if (rel.length > 0) {
        setVariants(rel);
      }

      const accounts = Array.isArray((data as any)?.accounts) ? ((data as any).accounts as ProductAccount[]) : [];

      if (accounts.length > 0) {
        setAvailableStock(accounts.length);
        return;
      }

      // Some products return related_product variants instead of accounts on the first call.
      // Auto-pick the first in-stock variant (or first) and refetch details for that variant.
      if (rel.length > 0) {
        const preferred = rel.find((v) => Number(v.in_stock) > 0) ?? rel[0];
        if (preferred) {
          setSelectedVariantId(preferred.id);
          setUnitPrice(String(preferred.price ?? price));
          setAvailableStock(Number(preferred.in_stock ?? inStock));

          if (preferred.id !== id) {
            setActiveProductId(preferred.id);
            const { data: d2, error: e2 } = await supabase.functions.invoke('no1logs-api', {
              body: { action: 'get_product_details', productId: preferred.id },
            });
            if (e2) throw e2;
            setDetails(d2);

            const accounts2 = Array.isArray((d2 as any)?.accounts) ? ((d2 as any).accounts as ProductAccount[]) : [];
            if (accounts2.length > 0) {
              setAvailableStock(accounts2.length);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVariantChange = async (value: string) => {
    const id = Number(value);
    if (!Number.isFinite(id)) return;

    const v = variants.find((x) => x.id === id);
    setSelectedVariantId(id);
    setActiveProductId(id);

    if (v?.price) setUnitPrice(String(v.price));
    if (typeof v?.in_stock === 'number') setAvailableStock(v.in_stock);

    await fetchProductDetails(id);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(quantity + delta, maxPurchasable));
    setQuantity(newQuantity);
  };

  const calculateTotal = () => {
    return parseFloat(unitPrice) * quantity;
  };

  const handleOrder = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to place an order',
        variant: 'destructive',
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({
        title: 'Unable to Place Order',
        description: 'No account IDs were returned for this product. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    const totalCost = calculateTotal();
    const walletBalance = profile?.wallet_balance || 0;

    if (walletBalance < totalCost) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ₦${totalCost.toLocaleString('en-NG')} but only have ₦${walletBalance.toLocaleString('en-NG')}. Please fund your wallet.`,
        variant: 'destructive',
      });
      return;
    }

    setOrdering(true);
    try {
      const { data, error } = await supabase.functions.invoke('no1logs-api', {
        body: {
          action: 'place_order',
          productDetailsIds: selectedAccounts.join(','),
        },
      });

      if (error) throw error;

      if ((data as any)?.status && (data as any).status !== 'success') {
        throw new Error((data as any)?.message || 'Order failed');
      }

      const apiOrderId = (data as any)?.order?.id ?? (data as any)?.id ?? null;
      const orderPayload = (data as any)?.order ?? data;

      const displayProductName =
        (orderPayload as any)?.product_name || details?.product?.product_name || productName;

      // Save order to database
      const { error: orderError } = await supabase.from('universal_logs_orders').insert({
        user_id: user.id,
        api_order_id: apiOrderId != null ? String(apiOrderId) : null,
        product_id: activeProductId,
        product_name: displayProductName,
        quantity,
        price_per_unit: parseFloat(unitPrice),
        total_amount: totalCost,
        status: 'completed',
        order_response: orderPayload,
      });

      if (orderError) throw orderError;

      // Deduct from wallet
      const { error: walletError } = await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: -totalCost,
        transaction_type: 'purchase',
        description: `Universal Logs: ${displayProductName} x${quantity}`,
      });

      if (walletError) throw walletError;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: walletBalance - totalCost })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Order Placed Successfully!',
        description: `Your order for ${displayProductName} has been placed. Check your order history for details.`,
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Error placing order:', err);
      toast({
        title: 'Order Failed',
        description: err instanceof Error ? err.message : 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setOrdering(false);
    }
  };

  const formatPrice = (p: string | number) => {
    return `₦${parseFloat(String(p)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {productName}
          </DialogTitle>
          <DialogDescription>View available accounts and place your order directly</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Price and Stock Info */}
            <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Price per unit</p>
                <p className="text-2xl font-bold text-primary">{formatPrice(unitPrice)}</p>
              </div>
              <Badge variant={availableStock > 0 ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {details.accounts?.length ? details.accounts.length : availableStock} Available
              </Badge>
            </div>

            {/* Variant selector (for products that return related_product first) */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Select Variant</h4>
                <Select value={selectedVariantId ? String(selectedVariantId) : ''} onValueChange={handleVariantChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {`#${v.id} • ${v.in_stock} in stock • ${formatPrice(v.price)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVariantId && (
                  <p className="text-xs text-muted-foreground">Selected product ID: {activeProductId}</p>
                )}
              </div>
            )}

            {/* Available Accounts Preview */}
            {details.accounts && details.accounts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Available Accounts ({details.accounts.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {details.accounts.slice(0, 6).map((account, index) => (
                    <Card
                      key={account.id}
                      className={`bg-card/50 border ${selectedAccounts.includes(account.id) ? 'border-primary' : 'border-border/50'}`}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Account #{index + 1}</span>
                        {account.url && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {details.accounts.length > 6 && (
                  <p className="text-sm text-muted-foreground text-center">+{details.accounts.length - 6} more accounts available</p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h4 className="font-semibold">Select Quantity</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-accent/20 rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-8 w-8"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxPurchasable}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">{formatPrice(calculateTotal())}</p>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            {user && (
              <div className="p-4 bg-card/50 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Your Wallet Balance</span>
                  <span className="font-bold">{formatPrice(profile?.wallet_balance || 0)}</span>
                </div>
                {(profile?.wallet_balance || 0) < calculateTotal() && (
                  <p className="text-destructive text-sm mt-2">Insufficient balance. Please fund your wallet.</p>
                )}
              </div>
            )}

            {/* Order Button */}
            <Button
              onClick={handleOrder}
              disabled={ordering || !user || (profile?.wallet_balance || 0) < calculateTotal() || quantity === 0}
              className="w-full h-12 text-lg gap-2"
            >
              {ordering ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing Order...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Place Order - {formatPrice(calculateTotal())}
                </>
              )}
            </Button>

            {!user && <p className="text-center text-muted-foreground text-sm">Please login to place an order</p>}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No details available for this product</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;
