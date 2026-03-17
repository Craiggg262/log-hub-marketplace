import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Wallet, ShoppingCart, Search, Eye, MessageCircle, Copy, Check, Gift, Phone, Wifi, Zap, Tv, CreditCard, Globe, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useServerSelection } from '@/hooks/useServerSelection';
import { useLoggsplug } from '@/hooks/useLoggsplug';
import { useLogs } from '@/hooks/useLogs';
import ServerToggle from '@/components/ServerToggle';
import BuyProductModal from '@/components/BuyProductModal';
import SocialIcon from '@/components/SocialIcon';

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [accountCopied, setAccountCopied] = useState(false);
  const [buyProduct, setBuyProduct] = useState<NormalizedProduct | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { server } = useServerSelection();
  const kingData = useLoggsplug();
  const liteData = useLogs();

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

  const platforms = useMemo(() => {
    const set = new Set(products.map((p) => p.platform));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = !selectedPlatform || p.platform === selectedPlatform;
      return matchesSearch && matchesPlatform && p.inStock > 0;
    });
  }, [products, searchTerm, selectedPlatform]);

  const formatPrice = (price: number) => `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Referral link copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAccountNumber = () => {
    if (profile?.virtual_account_number) {
      navigator.clipboard.writeText(profile.virtual_account_number);
      setAccountCopied(true);
      toast({ title: 'Copied!', description: 'Account number copied to clipboard' });
      setTimeout(() => setAccountCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* WhatsApp Group Link */}
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
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Available Logs</p>
                  <p className="text-lg md:text-2xl font-bold">{products.filter(p => p.inStock > 0).length}</p>
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
                  <p className="text-xs md:text-sm text-muted-foreground">Server</p>
                  <p className="text-lg md:text-2xl font-bold">{server === 'king' ? 'King' : 'Lite'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Virtual Account Section */}
        {profile?.virtual_account_number && (
          <div className="mt-4 p-3 bg-card/50 rounded-lg border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Your Funding Account</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{profile.virtual_account_bank}</span></p>
              <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{profile.virtual_account_name}</span></p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Account:</span>
                <span className="font-mono font-bold text-primary">{profile.virtual_account_number}</span>
                <Button onClick={handleCopyAccountNumber} variant="ghost" size="sm" className="h-6 px-2">
                  {accountCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Transfer to this account to fund your wallet instantly</p>
          </div>
        )}

        {/* Referral Link Section */}
        {profile?.referral_code && (
          <div className="mt-4 p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Your Referral Link</span>
            </div>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-xs bg-background/50" />
              <Button onClick={handleCopyReferralLink} variant="outline" size="sm" className="shrink-0 gap-1">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Earn 5% on every purchase your referrals make!</p>
          </div>
        )}
      </div>

      {/* Quick Services Section */}
      <div className="px-4 sm:px-0">
        <h2 className="text-lg font-semibold mb-3">Quick Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card onClick={() => navigate('/sms-verification')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">SMS Verify</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/airtime')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                <Phone className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-sm font-medium">Buy Airtime</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/data')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <Wifi className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-sm font-medium">Buy Data</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/electricity')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
              <span className="text-sm font-medium">Electricity</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/cable')} className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                <Tv className="h-6 w-6 text-purple-500" />
              </div>
              <span className="text-sm font-medium">Cable TV</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Server Toggle */}
      <div className="px-4 sm:px-0">
        <h2 className="text-lg font-semibold mb-3">Choose Server</h2>
        <ServerToggle />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 px-4 sm:px-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Platform Filters */}
      <div className="flex gap-2 flex-wrap px-4 sm:px-0">
        <Button variant={!selectedPlatform ? 'default' : 'outline'} size="sm" onClick={() => setSelectedPlatform(null)}>All</Button>
        {platforms.map((p) => (
          <Button key={p} variant={selectedPlatform === p ? 'default' : 'outline'} size="sm" onClick={() => setSelectedPlatform(p)} className="gap-1">
            <SocialIcon platform={p} size={14} />
            {p}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No logs found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4 sm:px-0">
          {filteredProducts.map((product) => (
            <Card
              key={`${server}-${product.id}`}
              className="overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 cursor-pointer"
              onClick={() => setBuyProduct(product)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <SocialIcon platform={product.platform} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-2">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary font-bold text-sm">{formatPrice(product.price)}</span>
                    <Badge variant="outline" className="text-[10px]">{product.inStock} pcs</Badge>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Buy Modal */}
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

export default Dashboard;
