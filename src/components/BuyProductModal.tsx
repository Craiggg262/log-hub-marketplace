import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useServerSelection } from '@/hooks/useServerSelection';
import SocialIcon from '@/components/SocialIcon';

interface BuyProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: number | string;
    name: string;
    price: number | string;
    inStock: number;
    category?: string;
  };
  server: 'king' | 'lite';
}

const BuyProductModal: React.FC<BuyProductModalProps> = ({
  open,
  onOpenChange,
  product,
  server,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const unitPrice = parseFloat(String(product.price));
  const total = unitPrice * quantity;
  const walletBalance = profile?.wallet_balance || 0;
  const maxQty = Math.min(product.inStock, 100);

  const handleQuantityChange = (delta: number) => {
    setQuantity((q) => Math.max(1, Math.min(q + delta, maxQty)));
  };

  const formatPrice = (p: number) => `₦${p.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  const handleBuy = async () => {
    if (!user) return;
    if (walletBalance < total) {
      toast({ title: 'Insufficient Balance', description: 'Please fund your wallet first.', variant: 'destructive' });
      return;
    }

    setOrdering(true);
    try {
      if (server === 'king') {
        // Loggsplug order
        const { data, error } = await supabase.functions.invoke('loggsplug-api', {
          body: { action: 'place_order', productId: product.id, qty: quantity },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.message || 'Order failed');

        // Save to universal_logs_orders
        const { data: insertedOrder, error: orderErr } = await supabase
          .from('universal_logs_orders')
          .insert({
            user_id: user.id,
            api_order_id: data.order_id ? String(data.order_id) : null,
            product_id: Number(product.id),
            product_name: product.name,
            quantity,
            price_per_unit: unitPrice,
            total_amount: total,
            status: 'completed',
            order_response: data,
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        // Deduct wallet
        await supabase.from('wallet_transactions').insert({
          user_id: user.id,
          amount: -total,
          transaction_type: 'purchase',
          description: `King Server: ${product.name} x${quantity}`,
        });
        await supabase.from('profiles').update({ wallet_balance: walletBalance - total }).eq('user_id', user.id);

        // Process referral
        try {
          const { processReferralEarning } = await import('@/hooks/useReferral');
          await processReferralEarning(user.id, total, undefined, insertedOrder?.id);
        } catch {}

        toast({ title: 'Order Placed!', description: `${product.name} x${quantity} purchased successfully.` });
      } else {
        // Lite server (no1logs) — use existing ProductDetailsModal flow
        // For lite server, we need to get product details first to get account IDs
        const { data: detailsData, error: detErr } = await supabase.functions.invoke('no1logs-api', {
          body: { action: 'get_product_details', productId: product.id },
        });
        if (detErr) throw detErr;

        const accounts = detailsData?.accounts || [];
        
        // Try related products if no accounts
        let accountIds: number[] = accounts.slice(0, quantity).map((a: any) => a.id);
        
        if (accountIds.length === 0 && detailsData?.related_product?.length > 0) {
          const preferred = detailsData.related_product.find((v: any) => Number(v.in_stock) > 0) || detailsData.related_product[0];
          if (preferred?.id) {
            const { data: relData } = await supabase.functions.invoke('no1logs-api', {
              body: { action: 'get_product_details', productId: preferred.id },
            });
            accountIds = (relData?.accounts || []).slice(0, quantity).map((a: any) => a.id);
          }
        }

        if (accountIds.length === 0) {
          throw new Error('No accounts available for this product right now.');
        }

        const { data: orderData, error: orderErr } = await supabase.functions.invoke('no1logs-api', {
          body: { action: 'place_order', productDetailsIds: accountIds.join(',') },
        });
        if (orderErr) throw orderErr;
        if (orderData?.error) throw new Error(orderData.error);

        const apiOrderId = orderData?.order?.id ?? orderData?.order_id ?? orderData?.id ?? null;

        const { data: insertedOrder, error: insertErr } = await supabase
          .from('universal_logs_orders')
          .insert({
            user_id: user.id,
            api_order_id: apiOrderId != null ? String(apiOrderId) : null,
            product_id: Number(product.id),
            product_name: product.name,
            quantity: accountIds.length,
            price_per_unit: unitPrice,
            total_amount: total,
            status: 'completed',
            order_response: orderData?.order ?? orderData,
          })
          .select()
          .single();
        if (insertErr) throw insertErr;

        await supabase.from('wallet_transactions').insert({
          user_id: user.id,
          amount: -total,
          transaction_type: 'purchase',
          description: `Lite Server: ${product.name} x${accountIds.length}`,
        });
        await supabase.from('profiles').update({ wallet_balance: walletBalance - total }).eq('user_id', user.id);

        try {
          const { processReferralEarning } = await import('@/hooks/useReferral');
          await processReferralEarning(user.id, total, undefined, insertedOrder?.id);
        } catch {}

        toast({ title: 'Order Placed!', description: `${product.name} x${accountIds.length} purchased successfully.` });
      }

      onOpenChange(false);
      setQuantity(1);
    } catch (err) {
      console.error('Order error:', err);
      toast({
        title: 'Order Failed',
        description: err instanceof Error ? err.message : 'Failed to place order',
        variant: 'destructive',
      });
    } finally {
      setOrdering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setQuantity(1); }}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <SocialIcon platform={product.category || ''} size={48} />
          </div>
          <DialogTitle className="text-center text-lg">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price & Stock */}
          <div className="flex items-center justify-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {formatPrice(unitPrice)} / pcs
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {product.inStock} in stock
            </Badge>
          </div>

          <div className="border-t border-border/50" />

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Description</p>
            <p className="text-sm text-foreground">{product.name}</p>
          </div>

          <div className="border-t border-border/50" />

          {/* Quantity & Total */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Quantity</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQty}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(total)}</p>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* Balance */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Balance:</span>
            <span className={`font-bold ${walletBalance >= total ? 'text-success' : 'text-destructive'}`}>
              {formatPrice(walletBalance)}
            </span>
          </div>

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={ordering || !user || walletBalance < total || product.inStock === 0}
            className="w-full h-12 text-lg gap-2 gradient-primary text-primary-foreground rounded-xl"
          >
            {ordering ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                Buy Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyProductModal;
