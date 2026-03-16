import React, { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { GlassCard } from '@/components/mobile/GlassCard';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart } from 'lucide-react';
import { useServerSelection } from '@/hooks/useServerSelection';
import { useLoggsplug } from '@/hooks/useLoggsplug';
import { useUniversalLogs } from '@/hooks/useUniversalLogs';
import ServerToggle from '@/components/ServerToggle';
import BuyProductModal from '@/components/BuyProductModal';
import SocialIcon from '@/components/SocialIcon';
import { cn } from '@/lib/utils';

// Detect platform from product/category name
function detectPlatform(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('facebook') || lower.includes('fb')) return 'Facebook';
  if (lower.includes('instagram') || lower.includes('ig')) return 'Instagram';
  if (lower.includes('tiktok') || lower.includes('tik tok')) return 'TikTok';
  if (lower.includes('twitter') || lower.includes('x ')) return 'Twitter';
  if (lower.includes('vpn') || lower.includes('streaming') || lower.includes('netflix') || lower.includes('spotify')) return 'VPN/Streaming';
  if (lower.includes('gmail') || lower.includes('google') || lower.includes('outlook') || lower.includes('email') || lower.includes('yahoo')) return 'Email';
  if (lower.includes('whatsapp')) return 'WhatsApp';
  if (lower.includes('snapchat') || lower.includes('snap')) return 'Snapchat';
  if (lower.includes('telegram')) return 'Telegram';
  if (lower.includes('discord')) return 'Discord';
  if (lower.includes('linkedin')) return 'LinkedIn';
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

const MobileLogs = () => {
  const { server } = useServerSelection();
  const kingData = useLoggsplug();
  const liteData = useUniversalLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [buyProduct, setBuyProduct] = useState<NormalizedProduct | null>(null);

  // Normalize products from both servers
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
      const hiddenCategoryNames = new Set([
        'Dating Facebook',
        'Countries Facebook(Belo 50 Friends)',
        'New Facebook Account Created About 3 months ago',
        'Random Countries Facebook',
      ]);
      const all: NormalizedProduct[] = [];
      for (const cat of liteData.categories) {
        if (hiddenCategoryNames.has(cat.name.trim())) continue;
        for (const p of cat.products) {
          all.push({
            id: p.id,
            name: p.name,
            price: parseFloat(p.price),
            inStock: p.in_stock,
            category: cat.name,
            platform: detectPlatform(cat.name + ' ' + p.name),
          });
        }
      }
      return all;
    }
  }, [server, kingData.products, liteData.categories]);

  const loading = server === 'king' ? kingData.loading : liteData.loading;

  // Get unique platforms
  const platforms = useMemo(() => {
    const set = new Set(products.map((p) => p.platform));
    return Array.from(set).sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = !selectedPlatform || p.platform === selectedPlatform;
      return matchesSearch && matchesPlatform && p.inStock > 0;
    });
  }, [products, searchTerm, selectedPlatform]);

  const formatPrice = (price: number) => `₦${price.toLocaleString()}`;

  return (
    <MobileLayout title="Buy Logs">
      <div className="p-4 space-y-4">
        {/* Server Toggle */}
        <ServerToggle />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="pl-10 glass-input rounded-xl h-12"
          />
        </div>

        {/* Platform Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedPlatform(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              !selectedPlatform
                ? "gradient-primary text-primary-foreground"
                : "glass-button text-foreground"
            )}
          >
            All
          </button>
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
                selectedPlatform === platform
                  ? "gradient-primary text-primary-foreground"
                  : "glass-button text-foreground"
              )}
            >
              <SocialIcon platform={platform} size={16} />
              {platform}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <GlassCard>
            <div className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-semibold mb-2">No logs found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <GlassCard
                key={`${server}-${product.id}`}
                variant="interactive"
                onClick={() => setBuyProduct(product)}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-card/80 flex items-center justify-center flex-shrink-0">
                    <SocialIcon platform={product.platform} size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {formatPrice(product.price)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">
                        {product.inStock} pcs
                      </Badge>
                    </div>
                  </div>
                  <button className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {buyProduct && (
        <BuyProductModal
          open={!!buyProduct}
          onOpenChange={(open) => { if (!open) setBuyProduct(null); }}
          product={buyProduct}
          server={server}
        />
      )}
    </MobileLayout>
  );
};

export default MobileLogs;
