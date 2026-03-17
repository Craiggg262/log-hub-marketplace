import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Package, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useServerSelection } from '@/hooks/useServerSelection';
import { useLoggsplug } from '@/hooks/useLoggsplug';
import { useLogs } from '@/hooks/useLogs';
import ServerToggle from '@/components/ServerToggle';
import BuyProductModal from '@/components/BuyProductModal';
import SocialIcon from '@/components/SocialIcon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

function detectPlatform(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('facebook') || lower.includes('fb')) return 'Facebook';
  if (lower.includes('instagram') || lower.includes('ig')) return 'Instagram';
  if (lower.includes('tiktok') || lower.includes('tik tok')) return 'TikTok';
  if (lower.includes('twitter') || lower.includes('x ')) return 'Twitter';
  if (lower.includes('vpn') || lower.includes('streaming')) return 'VPN/Streaming';
  return 'Other';
}

interface NormalizedProduct {
  id: number | string;
  name: string;
  price: number;
  inStock: number;
  category: string;
  platform: string;
}

const UniversalLogs = () => {
  const { server } = useServerSelection();
  const kingData = useLoggsplug();
  const liteData = useLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [buyProduct, setBuyProduct] = useState<NormalizedProduct | null>(null);

  const products: NormalizedProduct[] = useMemo(() => {
    if (server === 'king') {
      return kingData.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.display_price),
        inStock: p.in_stock,
        category: p.category,
        platform: detectPlatform(p.category + ' ' + p.name),
      }));
    } else {
      return liteData.logs.map((log) => ({
        id: log.id,
        name: log.title,
        price: log.price,
        inStock: log.stock,
        category: log.categories?.name || 'Other',
        platform: detectPlatform((log.categories?.name || '') + ' ' + log.title),
      }));
    }
  }, [server, kingData.products, liteData.logs]);

  const loading = server === 'king' ? kingData.loading : liteData.loading;
  const error = server === 'king' ? kingData.error : liteData.error;

  const grouped = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPlatform = !selectedPlatform || p.platform === selectedPlatform;
      return matchSearch && matchPlatform && p.inStock > 0;
    });

    const map = new Map<string, NormalizedProduct[]>();
    for (const p of filtered) {
      if (!map.has(p.platform)) map.set(p.platform, []);
      map.get(p.platform)!.push(p);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products, searchTerm, selectedPlatform]);

  const platforms = useMemo(() => {
    const set = new Set(products.map((p) => p.platform));
    return Array.from(set).sort();
  }, [products]);

  const togglePlatform = (p: string) => {
    setExpandedPlatforms((prev) => {
      const s = new Set(prev);
      s.has(p) ? s.delete(p) : s.add(p);
      return s;
    });
  };

  const formatPrice = (p: number) => `₦${p.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/20 via-accent/10 to-orange-500/20 rounded-xl p-6 border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Buy Logs</h1>
        </div>
        <p className="text-muted-foreground mb-4">Choose your server and browse premium logs.</p>
        <ServerToggle className="mb-4" />
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card/50"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant={!selectedPlatform ? 'default' : 'outline'} size="sm" onClick={() => setSelectedPlatform(null)}>
          All
        </Button>
        {platforms.map((p) => (
          <Button
            key={p}
            variant={selectedPlatform === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlatform(p)}
            className="gap-1"
          >
            <SocialIcon platform={p} size={14} />
            {p}
          </Button>
        ))}
      </div>

      {error && <p className="text-destructive text-center">{error}</p>}
      
      {grouped.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No products found.</p>
        </div>
      ) : (
        grouped.map(([platform, prods]) => (
          <Collapsible key={platform} open={expandedPlatforms.has(platform)} onOpenChange={() => togglePlatform(platform)}>
            <Card className="overflow-hidden border-border/50 bg-card/80">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SocialIcon platform={platform} size={20} />
                      <CardTitle className="text-lg">{platform}</CardTitle>
                      <Badge variant="secondary">{prods.length}</Badge>
                    </div>
                    {expandedPlatforms.has(platform) ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prods.map((product) => (
                      <Card key={`${server}-${product.id}`} className="bg-background/50 border-border/30 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setBuyProduct(product)}>
                        <CardContent className="p-4 flex items-center gap-3">
                          <SocialIcon platform={product.platform} size={24} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold line-clamp-2">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-primary font-bold text-sm">{formatPrice(product.price)}</span>
                              <Badge variant="outline" className="text-[10px]">{product.inStock} pcs</Badge>
                            </div>
                          </div>
                          <button className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-primary" />
                          </button>
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

      {buyProduct && (
        <BuyProductModal
          open={!!buyProduct}
          onOpenChange={(open) => { if (!open) setBuyProduct(null); }}
          product={buyProduct}
          server={server}
        />
      )}
    </div>
  );
};

export default UniversalLogs;
