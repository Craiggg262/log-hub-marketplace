 import React, { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { MobileLayout } from '@/components/mobile/MobileLayout';
 import { GlassCard } from '@/components/mobile/GlassCard';
 import { QuickActionGrid } from '@/components/mobile/QuickActionGrid';
 import { 
   Wallet, ShoppingCart, Star, Copy, Check, 
   CreditCard, Gift, ChevronRight, TrendingUp
 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { useAuth } from '@/hooks/useAuth';
 import { useLogs } from '@/hooks/useLogs';
 import { useCart } from '@/hooks/useCart';
 import { useToast } from '@/hooks/use-toast';
 import SocialIcon from '@/components/SocialIcon';
 
 const MobileHome = () => {
   const navigate = useNavigate();
   const { profile } = useAuth();
   const { logs, loading } = useLogs();
   const { addToCart, getTotalItems } = useCart();
   const { toast } = useToast();
   const [accountCopied, setAccountCopied] = useState(false);
 
   const formatPrice = (price: number) => `₦${price.toLocaleString()}`;
 
   const handleCopyAccount = () => {
     if (profile?.virtual_account_number) {
       navigator.clipboard.writeText(profile.virtual_account_number);
       setAccountCopied(true);
       toast({ title: 'Copied!', description: 'Account number copied' });
       setTimeout(() => setAccountCopied(false), 2000);
     }
   };
 
   const featuredLogs = logs.filter(log => log.in_stock).slice(0, 6);
 
   return (
     <MobileLayout title="Dashboard">
       <div className="space-y-6">
         {/* Balance Card */}
         <div className="px-4 pt-4">
           <GlassCard variant="elevated" glow className="silk-shimmer">
             <div className="p-5">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                     <Wallet className="h-6 w-6 text-primary-foreground" />
                   </div>
                   <div>
                     <p className="text-xs text-muted-foreground">Available Balance</p>
                     <p className="text-2xl font-bold">{formatPrice(profile?.wallet_balance || 0)}</p>
                   </div>
                 </div>
                 <Button 
                   onClick={() => navigate('/app/wallet/fund')}
                   className="gradient-primary text-primary-foreground rounded-xl"
                   size="sm"
                 >
                   Top Up
                 </Button>
               </div>
 
               {/* Virtual Account */}
               {profile?.virtual_account_number && (
                 <div className="glass-button rounded-xl p-3 mt-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <CreditCard className="h-4 w-4 text-primary" />
                       <div>
                         <p className="text-[10px] text-muted-foreground">{profile.virtual_account_bank}</p>
                         <p className="text-sm font-mono font-bold">{profile.virtual_account_number}</p>
                       </div>
                     </div>
                     <button 
                       onClick={handleCopyAccount}
                       className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                     >
                       {accountCopied ? (
                         <Check className="h-4 w-4 text-success" />
                       ) : (
                         <Copy className="h-4 w-4 text-primary" />
                       )}
                     </button>
                   </div>
                 </div>
               )}
 
               {/* Stats Row */}
               <div className="grid grid-cols-2 gap-3 mt-4">
                 <div className="glass-button rounded-xl p-3 text-center">
                   <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-accent" />
                   <p className="text-lg font-bold">{getTotalItems()}</p>
                   <p className="text-[10px] text-muted-foreground">Cart Items</p>
                 </div>
                 <div className="glass-button rounded-xl p-3 text-center">
                   <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
                   <p className="text-lg font-bold">{formatPrice(profile?.total_referral_earnings || 0)}</p>
                   <p className="text-[10px] text-muted-foreground">Earned</p>
                 </div>
               </div>
             </div>
           </GlassCard>
         </div>
 
         {/* Quick Actions */}
         <div>
           <div className="px-4 flex items-center justify-between mb-2">
             <h2 className="text-sm font-semibold text-foreground/80">Quick Actions</h2>
           </div>
           <QuickActionGrid />
         </div>
 
         {/* Featured Logs */}
         <div className="px-4">
           <div className="flex items-center justify-between mb-3">
             <h2 className="text-sm font-semibold text-foreground/80">Featured Logs</h2>
             <button 
               onClick={() => navigate('/app/logs')}
               className="flex items-center gap-1 text-xs text-primary"
             >
               View All <ChevronRight className="h-3 w-3" />
             </button>
           </div>
 
           {loading ? (
             <div className="flex items-center justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
             </div>
           ) : (
             <div className="grid grid-cols-2 gap-3">
               {featuredLogs.map((log) => (
                 <GlassCard
                   key={log.id}
                   variant="interactive"
                   onClick={() => navigate(`/app/log/${log.id}`)}
                 >
                   <div className="p-3">
                     <div className="flex items-center gap-2 mb-2">
                       <SocialIcon platform={log.categories?.name || ''} size={20} />
                       <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-border/50">
                         {log.categories?.name}
                       </Badge>
                     </div>
                     <h3 className="text-sm font-semibold line-clamp-2 mb-2">{log.title}</h3>
                     <div className="flex items-center justify-between">
                       <span className="text-primary font-bold">{formatPrice(log.price)}</span>
                       <div className="flex items-center gap-1">
                         <Star className="h-3 w-3 fill-primary text-primary" />
                         <span className="text-xs">{log.rating}</span>
                       </div>
                     </div>
                     <Badge 
                       className="mt-2 text-[10px] w-full justify-center bg-success/20 text-success border-success/30"
                     >
                       {log.stock} in stock
                     </Badge>
                   </div>
                 </GlassCard>
               ))}
             </div>
           )}
         </div>
 
         {/* Referral Banner */}
         {profile?.referral_code && (
           <div className="px-4 pb-4">
             <GlassCard 
               variant="interactive" 
               onClick={() => navigate('/app/referrals')}
               className="bg-gradient-to-r from-primary/10 to-accent/10"
             >
               <div className="p-4 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                   <Gift className="h-6 w-6 text-primary" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-semibold">Earn 5% Commission</h3>
                   <p className="text-xs text-muted-foreground">Share your referral link with friends</p>
                 </div>
                 <ChevronRight className="h-5 w-5 text-muted-foreground" />
               </div>
             </GlassCard>
           </div>
         )}
       </div>
     </MobileLayout>
   );
 };
 
 export default MobileHome;