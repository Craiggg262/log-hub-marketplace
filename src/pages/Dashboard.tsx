import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ShoppingCart, Search, Star, Eye, Filter, Plus, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogs } from '@/hooks/useLogs';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import SocialIcon from '@/components/SocialIcon';

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { logs, categories, loading } = useLogs();
  const { cartItems, addToCart, getTotalItems, clearCart } = useCart();
  const { createOrderFromCart } = useOrders();

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || log.categories?.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
      default:
        return a.title.localeCompare(b.title);
    }
  });

  const handleAddToCart = async (log: any) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart(log.id);
      toast({
        title: "Added to cart",
        description: `${log.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = async () => {
    if (getTotalItems() === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create order in database
      const order = await createOrderFromCart(cartItems, profile);
      
      if (order) {
        // Clear cart after successful order creation
        await clearCart();
        
        // Redirect to WhatsApp
        window.open('https://wa.link/8rqbox', '_blank');
        
        toast({
          title: "Order created successfully",
          description: `Order #${order.id.slice(0, 8)} created. Complete payment via WhatsApp.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error creating order",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || user?.email || 'User'}!</h1>
        <p className="text-muted-foreground mb-4">Discover premium logs from our marketplace</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Card className="flex-1 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold">{formatPrice(profile?.wallet_balance || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex-1 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Cart Items</p>
                  <p className="text-2xl font-bold">{getTotalItems()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Logs</p>
                  <p className="text-2xl font-bold">{logs.filter(log => log.in_stock).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {getTotalItems() > 0 && (
          <div className="mt-4">
            <Button onClick={handleBuyNow} size="lg" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Checkout Cart (₦{getTotalItems() > 0 ? cartItems.reduce((total, item) => total + (item.logs.price * item.quantity), 0).toLocaleString('en-NG') : '0'})
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedLogs.map((log) => (
          <Card key={log.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={log.in_stock ? "default" : "secondary"}>
                  {log.in_stock ? `${log.stock} In Stock` : "Out of Stock"}
                </Badge>
                <div className="flex items-center gap-2">
                  <SocialIcon platform={log.categories?.name || ''} size={20} />
                  <Badge variant="outline" className="capitalize">
                    {log.categories?.name}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-2 flex items-center gap-2">
                <img 
                  src={log.image} 
                  alt={log.categories?.name} 
                  className="w-6 h-6 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {log.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {log.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{log.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({log.reviews} reviews)
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(log.price)}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleAddToCart(log)}
                    disabled={!log.in_stock}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedLogs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No logs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;