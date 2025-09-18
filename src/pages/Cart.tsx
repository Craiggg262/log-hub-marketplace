import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, Plus, Minus, Trash2, MessageCircle } from 'lucide-react';
import SocialIcon from '@/components/SocialIcon';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getTotalAmount, getTotalItems, clearCart, loading } = useCart();
  const { profile } = useAuth();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart first.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = getTotalAmount();
    
    if (!profile || profile.wallet_balance < totalAmount) {
      toast({
        title: "Insufficient funds",
        description: "Please add funds to your wallet to complete this purchase.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to WhatsApp for purchase completion
    const message = `Hello! I want to purchase ${getTotalItems()} items from my cart for ${formatPrice(totalAmount)}. My email: ${profile.email}`;
    const whatsappUrl = `https://wa.link/8rqbox?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecting to WhatsApp",
      description: "Complete your purchase via WhatsApp support.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground">Review your selected items</p>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">Start shopping to add items to your cart.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Browse Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground">{getTotalItems()} items in your cart</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => clearCart()}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <SocialIcon platform={item.logs.categories?.name || ''} size={24} />
                    <img 
                      src={item.logs.image} 
                      alt={item.logs.categories?.name} 
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{item.logs.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.logs.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="capitalize">
                          {item.logs.categories?.name}
                        </Badge>
                        <Badge variant={item.logs.in_stock ? "default" : "secondary"}>
                          {item.logs.in_stock ? `${item.logs.stock} Available` : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium px-3">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.logs.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatPrice(item.logs.price * item.quantity)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.logs.price)} each
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items ({getTotalItems()})</span>
                  <span>{formatPrice(getTotalAmount())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee</span>
                  <span>₦0.00</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(getTotalAmount())}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Wallet Balance: {formatPrice(profile?.wallet_balance || 0)}
                </div>
                {profile && profile.wallet_balance < getTotalAmount() && (
                  <div className="text-sm text-destructive">
                    Insufficient funds. Please add {formatPrice(getTotalAmount() - profile.wallet_balance)} to your wallet.
                  </div>
                )}
              </div>

              <Button 
                onClick={handleCheckout} 
                className="w-full gap-2" 
                size="lg"
                disabled={!profile || profile.wallet_balance < getTotalAmount()}
              >
                <MessageCircle className="h-4 w-4" />
                Checkout via WhatsApp
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                You will be redirected to WhatsApp to complete your purchase
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;