import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Search, Package, ShoppingCart, Crown, Zap } from 'lucide-react';
import { useServerSelection } from '@/hooks/useServerSelection';
import { useLoggsplug } from '@/hooks/useLoggsplug';
import { useLogs } from '@/hooks/useLogs';
import BuyProductModal from '@/components/BuyProductModal';
import ProductLogo from '@/components/ProductLogo';
import ServerPicker from '@/components/marketplace/ServerPicker';

function detectPlatform(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('facebook') || lower.includes('fb')) return 'Facebook';
  if (lower.includes('instagram') || lower.includes('ig')) return 'Instagram';
  if (lower.includes('tiktok')) return 'TikTok';
  if (lower.includes('twitter') || lower.includes('x ')) return 'Twitter';
  if (lower.includes('vpn')) return 'VPN';
  if (lower.includes('streaming') || lower.includes('netflix') || lower.includes('spotify')) return 'Streaming';
  if (lower.includes('gmail') || lower.includes('mail')) return 'Email';
  return 'Other';
}

interface NormalizedProduct {
  id: number | string;
  name: string;
  price: number;
  inStock: number;
  category: string;
  platform: string;
  categorySort: number;
  itemSort: number;
  description?: string;
  logo_url?: string | null;
}

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { server } = useServerSelection();
  const kingData = useLoggsplug();
  const liteData = useLogs();

  // Step 1: server pick (handled by ServerPicker which sets the global state)
  const [step, setStep] = useState<'server' | 'categories' | 'products'>('server');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [buyProduct, setBuyProduct] = useState<NormalizedProduct | null>(null);

  const products: NormalizedProduct[] = useMemo(() => {
    if (server === 'king') {
      return kingData.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.display_price),
        inStock: p.in_stock,
        category: p.category || 'Other',
        platform: detectPlatform((p.category || '') + ' ' + p.name),
        categorySort: 999,
        itemSort: 999,
        logo_url: null,
      }));
    }
    return liteData.logs.map((log) => ({
      id: log.id,
      name: log.title,
      price: log.price,
      inStock: log.stock,
      category: log.categories?.name || 'Other',
      platform: log.categories?.name || detectPlatform(log.title),
      categorySort: log.categories?.sort_order ?? 999,
      itemSort: log.sort_order ?? 999,
      description: log.description,
      logo_url: log.logo_url,
    }));
  }, [server, kingData.products, liteData.logs]);

  const loading = server === 'king' ? kingData.loading : liteData.loading;

  const categories = useMemo(() => {
    const map = new Map<string, { name: string; sort: number; count: number; sample: NormalizedProduct }>();
    for (const p of products) {
      if (p.inStock <= 0) continue;
      const existing = map.get(p.category);
      if (existing) {
        existing.count++;
      } else {
        map.set(p.category, { name: p.category, sort: p.categorySort, count: 1, sample: p });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => a.sort - b.sort || a.name.localeCompare(b.name)
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.inStock > 0)
      .filter((p) => (activeCategory ? p.category === activeCategory : true))
      .filter((p) => (search ? p.name.toLowerCase().includes(search.toLowerCase()) : true))
      .sort((a, b) => (a.itemSort - b.itemSort) || a.name.localeCompare(b.name));
  }, [products, activeCategory, search]);

  const formatPrice = (p: number) =>
    `₦${p.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  // Allow direct entry to categories if server already chosen
  React.useEffect(() => {
    if (step === 'server' && (kingData.products.length > 0 || liteData.logs.length > 0)) {
      // do nothing — let user click the picker
    }
  }, [step, kingData.products.length, liteData.logs.length]);

  // STEP: SERVER ----------------------------------------------------------
  if (step === 'server') {
    return (
      <div className="space-y-6">
        <ServerPicker onPicked={() => setStep('categories')} />
        <div className="text-center text-xs text-muted-foreground">
          You can switch server at any time from this page.
        </div>
      </div>
    );
  }

  const ServerSwitchBar = () => (
    <div className="flex items-center justify-between gap-3 glass-card rounded-2xl p-3">
      <button
        onClick={() => {
          if (step === 'products') {
            setActiveCategory(null);
            setStep('categories');
          } else {
            setStep('server');
          }
        }}
        className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>
      <div className="flex items-center gap-2 text-xs">
        {server === 'king' ? (
          <Crown className="h-4 w-4 text-primary" />
        ) : (
          <Zap className="h-4 w-4 text-accent" />
        )}
        <span className="font-semibold">{server === 'king' ? 'King Server' : 'Lite Server'}</span>
      </div>
      <button
        onClick={() => setStep('server')}
        className="text-xs text-primary hover:underline"
      >
        Switch
      </button>
    </div>
  );

  // STEP: CATEGORIES ------------------------------------------------------
  if (step === 'categories') {
    return (
      <div className="space-y-5">
        <ServerSwitchBar />
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading inventory…' : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} available`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No stock available on this server yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setActiveCategory(c.name);
                  setStep('products');
                }}
                className="glass-card rounded-2xl p-4 text-left transition-all hover:scale-[1.03] hover:border-primary/50 group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <ProductLogo logoUrl={c.sample.logo_url} platform={c.sample.platform} size={44} />
                  <Badge variant="secondary" className="text-[10px]">{c.count}</Badge>
                </div>
                <p className="font-bold text-sm leading-tight line-clamp-2">{c.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {c.count} product{c.count !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // STEP: PRODUCTS --------------------------------------------------------
  return (
    <div className="space-y-5">
      <ServerSwitchBar />
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight">{activeCategory}</h1>
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 glass-input rounded-xl h-11"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No products match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredProducts.map((p) => (
            <button
              key={`${server}-${p.id}`}
              onClick={() => setBuyProduct(p)}
              className="glass-card rounded-2xl p-4 text-left transition-all hover:scale-[1.01] hover:border-primary/50"
            >
              <div className="flex items-center gap-3">
                <ProductLogo logoUrl={p.logo_url} platform={p.platform} size={56} rounded="2xl" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm line-clamp-2 leading-tight uppercase">{p.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-success">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      {p.inStock} Available
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary text-base">{formatPrice(p.price)}</span>
                    <span className="text-xs gradient-primary text-primary-foreground rounded-lg px-3 py-1 font-semibold inline-flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" /> Buy
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {buyProduct && (
        <BuyProductModal
          open={!!buyProduct}
          onOpenChange={(o) => {
            if (!o) setBuyProduct(null);
          }}
          product={buyProduct}
          server={server}
          onSuccess={() => {
            setBuyProduct(null);
            navigate(window.location.pathname.startsWith('/app') ? '/app/orders' : '/orders');
          }}
        />
      )}
    </div>
  );
};

export default Marketplace;
