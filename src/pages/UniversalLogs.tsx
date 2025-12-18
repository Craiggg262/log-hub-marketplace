import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, ShoppingCart, MessageCircle, Package, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useUniversalLogs, UniversalProduct, UniversalCategory } from '@/hooks/useUniversalLogs';
import { useAuth } from '@/hooks/useAuth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const UniversalLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();
  const { categories, loading, error, refetch } = useUniversalLogs();

  const handleSearch = () => {
    refetch(searchTerm);
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleContactForPurchase = (product: UniversalProduct) => {
    const message = `Hello! I'm interested in purchasing: ${product.name} (Price: ₦${parseFloat(product.price).toLocaleString('en-NG')})`;
    window.open(`https://wa.me/2347060847925?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatPrice = (price: string) => {
    return `₦${parseFloat(price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Universal Logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Floating WhatsApp Button */}
      <Button
        onClick={() => window.open('https://wa.me/2347060847925', '_blank')}
        className="fixed bottom-20 right-4 md:right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 p-0"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-orange-500/20 rounded-xl p-6 md:p-8 border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Universal Logs</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Browse premium logs from our global inventory. Contact us via WhatsApp to purchase.
        </p>
        
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-card/50"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products found.</p>
          </div>
        ) : (
          categories.map((category) => (
            <Collapsible
              key={category.id}
              open={expandedCategories.has(category.id)}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <Badge variant="secondary">{category.products.length} products</Badge>
                      </div>
                      {expandedCategories.has(category.id) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.products.map((product) => (
                        <Card key={product.id} className="bg-background/50 border-border/30 hover:border-primary/50 transition-colors">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-2">
                              <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
                              <Badge variant={product.in_stock > 0 ? "default" : "secondary"} className="shrink-0">
                                {product.in_stock > 0 ? `${product.in_stock} in stock` : "Out of Stock"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {product.description && (
                              <CardDescription 
                                className="text-xs line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                              />
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(product.price)}
                              </span>
                              <Button
                                onClick={() => handleContactForPurchase(product)}
                                disabled={product.in_stock === 0}
                                size="sm"
                                className="gap-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                Buy Now
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
};

export default UniversalLogs;
