 import React, { useState, useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { MobileLayout } from '@/components/mobile/MobileLayout';
 import { GlassCard } from '@/components/mobile/GlassCard';
 import { PullToRefresh } from '@/components/mobile/PullToRefresh';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { 
   Wallet, Plus, ArrowUpRight, ArrowDownLeft, 
   Copy, Check, CreditCard, History, ChevronRight
 } from 'lucide-react';
 import { useAuth } from '@/hooks/useAuth';
 import { useTransactions } from '@/hooks/useTransactions';
 import { useToast } from '@/hooks/use-toast';
 import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import FundingAccountsDisplay from '@/components/FundingAccountsDisplay';
 
 const MobileWallet = () => {
   const navigate = useNavigate();
   const { profile } = useAuth();
   const { transactions, loading } = useTransactions();
   const { toast } = useToast();
   const [copied, setCopied] = useState(false);
 
   const formatPrice = (price: number) => `₦${price.toLocaleString()}`;
 
   const handleCopyAccount = () => {
     if (profile?.virtual_account_number) {
       navigator.clipboard.writeText(profile.virtual_account_number);
       setCopied(true);
       toast({ title: 'Copied!', description: 'Account number copied' });
       setTimeout(() => setCopied(false), 2000);
     }
   };
 
  const recentTransactions = transactions.slice(0, 5);

  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  return (
    <MobileLayout title="Wallet">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-6">
         {/* Balance Card */}
         <GlassCard variant="elevated" glow className="silk-shimmer">
           <div className="p-6 text-center">
             <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
             <p className="text-4xl font-bold mb-4">
               {formatPrice(profile?.wallet_balance || 0)}
             </p>
             
             <Button 
               onClick={() => navigate('/app/wallet/fund')}
               className="w-full gradient-primary text-primary-foreground rounded-xl h-12 text-base"
             >
               <Plus className="h-5 w-5 mr-2" />
               Add Funds
             </Button>
           </div>
         </GlassCard>
 
        {/* Funding Accounts */}
        {(profile?.virtual_account_number || (profile as any)?.payscribe_account_number) && (
          <GlassCard>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-semibold">Your Funding Account(s)</span>
              </div>
              <FundingAccountsDisplay variant="mobile-full" />
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Transfer to any account to fund your wallet instantly
              </p>
            </div>
          </GlassCard>
        )}
 
         {/* Recent Transactions */}
         <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="font-semibold flex items-center gap-2">
               <History className="h-4 w-4" />
               Recent Transactions
             </h3>
             <button 
               onClick={() => navigate('/app/history')}
               className="text-xs text-primary flex items-center gap-1"
             >
               View All <ChevronRight className="h-3 w-3" />
             </button>
           </div>
 
           {loading ? (
             <div className="flex justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
             </div>
           ) : recentTransactions.length === 0 ? (
             <GlassCard>
               <div className="p-8 text-center">
                 <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                 <p className="text-muted-foreground">No transactions yet</p>
               </div>
             </GlassCard>
           ) : (
             <div className="space-y-2">
               {recentTransactions.map((tx) => (
                 <GlassCard key={tx.id} variant="interactive">
                   <div className="p-3 flex items-center gap-3">
                     <div className={cn(
                       "w-10 h-10 rounded-xl flex items-center justify-center",
                       tx.transaction_type === 'deposit' 
                         ? "bg-success/20" 
                         : "bg-destructive/20"
                     )}>
                       {tx.transaction_type === 'deposit' ? (
                         <ArrowDownLeft className="h-5 w-5 text-success" />
                       ) : (
                         <ArrowUpRight className="h-5 w-5 text-destructive" />
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-medium truncate">
                         {tx.description || tx.transaction_type}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                       </p>
                     </div>
                     <span className={cn(
                       "font-semibold",
                       tx.transaction_type === 'deposit' ? "text-success" : "text-destructive"
                     )}>
                       {tx.transaction_type === 'deposit' ? '+' : '-'}
                       {formatPrice(tx.amount)}
                     </span>
                   </div>
                 </GlassCard>
               ))}
             </div>
           )}
         </div>
        </div>
      </PullToRefresh>
    </MobileLayout>
   );
 };
 
 export default MobileWallet;