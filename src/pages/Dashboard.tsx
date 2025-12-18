import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ShoppingCart, Search, Star, Eye, Filter, Plus, Minus, MessageCircle } from 'lucide-react';
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

  const handleBuyNow = () => {
    if (getTotalItems() === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart first.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to cart page to complete purchase
    window.location.href = '/cart';
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
    <div className="space-y-6 relative">
      {/* Floating WhatsApp Button */}
      <Button
        onClick={() => window.open('https://chat.whatsapp.com/LltaVAyG0BvJp5t9gmlqz7?mode=ems_copy_h_t', '_blank')}
        className="fixed bottom-20 right-4 md:right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 p-0"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-orange-500/20 rounded-xl p-4 md:p-6 border border-border/50">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!</h1>
        <p className="text-sm md:text-base text-muted-foreground mb-4">Discover premium logs from our marketplace</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                  <Wallet className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-lg md:text-2xl font-bold truncate">{formatPrice(profile?.wallet_balance || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Cart Items</p>
                  <p className="text-lg md:text-2xl font-bold">{getTotalItems()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-5 w-5 md:h-6 md:w-6 text-success" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Available Logs</p>
                  <p className="text-lg md:text-2xl font-bold">{logs.filter(log => log.in_stock).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {getTotalItems() > 0 && (
          <div className="mt-4">
            <Button onClick={handleBuyNow} size="lg" className="gap-2 w-full sm:w-auto gradient-primary text-primary-foreground hover:opacity-90 glow-primary">
              <ShoppingCart className="h-4 w-4" />
              <span className="truncate">Checkout Cart (₦{getTotalItems() > 0 ? cartItems.reduce((total, item) => total + (item.logs.price * item.quantity), 0).toLocaleString('en-NG') : '0'})</span>
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 px-4 sm:px-0">
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
          <SelectTrigger className="w-full sm:w-48">
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
          <SelectTrigger className="w-full sm:w-48">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 sm:px-0">
        {sortedLogs.map((log) => (
          <Card key={log.id} className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={log.in_stock ? "default" : "secondary"} className={log.in_stock ? "bg-success/20 text-success border-success/30" : ""}>
                  {log.in_stock ? `${log.stock} In Stock` : "Out of Stock"}
                </Badge>
                <div className="flex items-center gap-2">
                  <SocialIcon platform={log.categories?.name || ''} size={20} />
                  <Badge variant="outline" className="capitalize border-border/50">
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
            
            <CardContent className="space-y-3 p-4 md:p-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-medium">{log.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({log.reviews} reviews)
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl md:text-2xl font-bold text-primary flex-shrink-0">
                    {formatPrice(log.price)}
                  </span>
                  <Button variant="outline" size="sm" className="shrink-0 border-border/50 hover:border-primary/50">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => handleAddToCart(log)}
                  disabled={!log.in_stock}
                  className="w-full gap-2 gradient-primary text-primary-foreground hover:opacity-90"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="truncate">Add to Cart</span>
                </Button>
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