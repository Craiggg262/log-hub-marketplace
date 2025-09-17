import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ShoppingCart, Search, Star, Eye, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Log {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  image: string;
}

const Dashboard = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const { toast } = useToast();

  useEffect(() => {
    // Mock data for logs
    const mockLogs: Log[] = [
      {
        id: '1',
        title: 'Premium Netflix Logs',
        description: 'High-quality Netflix account logs with warranty',
        price: 15.99,
        category: 'streaming',
        rating: 4.8,
        reviews: 245,
        inStock: true,
        image: '/placeholder.svg'
      },
      {
        id: '2',
        title: 'Spotify Premium Logs',
        description: 'Fresh Spotify premium account access',
        price: 8.99,
        category: 'streaming',
        rating: 4.6,
        reviews: 189,
        inStock: true,
        image: '/placeholder.svg'
      },
      {
        id: '3',
        title: 'PayPal Logs',
        description: 'Verified PayPal account logs',
        price: 25.99,
        category: 'finance',
        rating: 4.9,
        reviews: 156,
        inStock: false,
        image: '/placeholder.svg'
      },
      {
        id: '4',
        title: 'Amazon Prime Logs',
        description: 'Amazon Prime account with benefits',
        price: 12.99,
        category: 'shopping',
        rating: 4.7,
        reviews: 203,
        inStock: true,
        image: '/placeholder.svg'
      },
      {
        id: '5',
        title: 'Disney+ Logs',
        description: 'Disney Plus premium access logs',
        price: 10.99,
        category: 'streaming',
        rating: 4.5,
        reviews: 167,
        inStock: true,
        image: '/placeholder.svg'
      },
      {
        id: '6',
        title: 'Hulu Premium Logs',
        description: 'Hulu premium account logs',
        price: 9.99,
        category: 'streaming',
        rating: 4.4,
        reviews: 124,
        inStock: true,
        image: '/placeholder.svg'
      }
    ];
    setLogs(mockLogs);
  }, []);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const walletBalance = user.walletBalance || 0;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
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

  const handlePurchase = (log: Log) => {
    if (walletBalance < log.price) {
      toast({
        title: "Insufficient funds",
        description: "Please add funds to your wallet to purchase this log.",
        variant: "destructive",
      });
      return;
    }

    // Simulate purchase
    const newBalance = walletBalance - log.price;
    const updatedUser = { ...user, walletBalance: newBalance };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    toast({
      title: "Purchase successful!",
      description: `You have successfully purchased ${log.title}`,
    });
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'streaming', label: 'Streaming' },
    { value: 'finance', label: 'Finance' },
    { value: 'shopping', label: 'Shopping' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.fullName || 'User'}!</h1>
        <p className="text-muted-foreground mb-4">Discover premium logs from our marketplace</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Card className="flex-1 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold">${walletBalance.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="flex-1 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Available Logs</p>
                  <p className="text-2xl font-bold">{logs.filter(log => log.inStock).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
            {categories.map((category) => (
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
              <div className="flex justify-between items-start">
                <Badge variant={log.inStock ? "default" : "secondary"}>
                  {log.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {log.category}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{log.title}</CardTitle>
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
                  ${log.price}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handlePurchase(log)}
                    disabled={!log.inStock || walletBalance < log.price}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Buy Now
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