import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Wallet, ShoppingCart, MessageCircle, Copy, Check, Gift, Phone, Wifi, Zap, Tv, Globe, Package, ChevronRight, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FundingAccountsDisplay from '@/components/FundingAccountsDisplay';

const Dashboard = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const formatPrice = (price: number) =>
    `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Referral link copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
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

      {/* Welcome Hero */}
      <div className="glass-card silk-shimmer rounded-2xl p-5 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-5">
          Digital solutions for every market
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <Card className="glass-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Wallet Balance</p>
                  <p className="text-xl md:text-2xl font-bold truncate">
                    {formatPrice(profile?.wallet_balance || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="glass-card border-0 cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => navigate('/fund-wallet')}
          >
            <CardContent className="p-4 h-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top up</p>
                  <p className="text-base font-semibold">Add Funds</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card
            className="glass-card border-0 cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => navigate('/orders')}
          >
            <CardContent className="p-4 h-full flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Activity</p>
                  <p className="text-base font-semibold">My Orders</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Virtual Account Cards */}
        <div className="mt-4">
          <FundingAccountsDisplay variant="desktop" />
        </div>

        {/* Referral */}
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
            <p className="text-xs text-muted-foreground mt-1">
              Earn 5% on every purchase your referrals make!
            </p>
          </div>
        )}
      </div>

      {/* Browse Marketplace primary CTA */}
      <Card
        onClick={() => navigate('/universal-logs')}
        className="glass-card silk-shimmer border-0 cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
      >
        <CardContent className="p-6 md:p-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-primary flex items-center justify-center">
              <ShoppingCart className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-bold">Browse Marketplace</h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                Pick a server, choose a category, then buy in seconds
              </p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 text-primary shrink-0" />
        </CardContent>
      </Card>

      {/* Quick Services */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card onClick={() => navigate('/sms-verification')} className="cursor-pointer hover:border-primary/50 transition-all glass-card border-0">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">SMS Verify</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/airtime')} className="cursor-pointer hover:border-primary/50 transition-all glass-card border-0">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                <Phone className="h-6 w-6 text-blue-500" />
              </div>
              <span className="text-sm font-medium">Buy Airtime</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/data')} className="cursor-pointer hover:border-primary/50 transition-all glass-card border-0">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                <Wifi className="h-6 w-6 text-green-500" />
              </div>
              <span className="text-sm font-medium">Buy Data</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/electricity')} className="cursor-pointer hover:border-primary/50 transition-all glass-card border-0">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
              <span className="text-sm font-medium">Electricity</span>
            </CardContent>
          </Card>
          <Card onClick={() => navigate('/services/cable')} className="cursor-pointer hover:border-primary/50 transition-all glass-card border-0">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                <Tv className="h-6 w-6 text-purple-500" />
              </div>
              <span className="text-sm font-medium">Cable TV</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
