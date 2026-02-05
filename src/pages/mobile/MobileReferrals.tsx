 import React, { useState } from 'react';
 import { MobileLayout } from '@/components/mobile/MobileLayout';
 import { GlassCard } from '@/components/mobile/GlassCard';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { 
   Gift, Copy, Check, Users, TrendingUp, 
   Share2, ChevronRight
 } from 'lucide-react';
 import { useAuth } from '@/hooks/useAuth';
 import { useReferral } from '@/hooks/useReferral';
 import { useToast } from '@/hooks/use-toast';
 import { format } from 'date-fns';
 
 const MobileReferrals = () => {
   const { profile } = useAuth();
   const { referrals, earnings, loading } = useReferral();
   const { toast } = useToast();
   const [copied, setCopied] = useState(false);
 
   const referralLink = `${window.location.origin}/signup?ref=${profile?.referral_code}`;
   const formatPrice = (price: number) => `₦${price.toLocaleString()}`;
 
   const handleCopy = () => {
     navigator.clipboard.writeText(referralLink);
     setCopied(true);
     toast({ title: 'Copied!', description: 'Referral link copied to clipboard' });
     setTimeout(() => setCopied(false), 2000);
   };
 
   const handleShare = async () => {
     if (navigator.share) {
       try {
         await navigator.share({
           title: 'Join Log Hub Marketplace',
           text: 'Sign up with my referral link and get started!',
           url: referralLink
         });
       } catch (e) {
         handleCopy();
       }
     } else {
       handleCopy();
     }
   };
 
   return (
     <MobileLayout title="Referral & Earn">
       <div className="p-4 space-y-6">
         {/* Hero Card */}
         <GlassCard variant="elevated" glow className="bg-gradient-to-br from-primary/20 to-accent/20">
           <div className="p-6 text-center">
             <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4">
               <Gift className="h-8 w-8 text-primary-foreground" />
             </div>
             <h2 className="text-xl font-bold mb-2">Earn 5% Commission</h2>
             <p className="text-sm text-muted-foreground">
               Share your referral link and earn 5% on every purchase your friends make!
             </p>
           </div>
         </GlassCard>
 
         {/* Stats */}
         <div className="grid grid-cols-2 gap-3">
           <GlassCard>
             <div className="p-4 text-center">
               <Users className="h-6 w-6 mx-auto mb-2 text-accent" />
               <p className="text-2xl font-bold">{referrals.length}</p>
               <p className="text-xs text-muted-foreground">Total Referrals</p>
             </div>
           </GlassCard>
           <GlassCard>
             <div className="p-4 text-center">
               <TrendingUp className="h-6 w-6 mx-auto mb-2 text-success" />
               <p className="text-2xl font-bold">{formatPrice(profile?.total_referral_earnings || 0)}</p>
               <p className="text-xs text-muted-foreground">Total Earned</p>
             </div>
           </GlassCard>
         </div>
 
         {/* Referral Link */}
         <GlassCard>
           <div className="p-4 space-y-3">
             <h3 className="font-semibold flex items-center gap-2">
               <Share2 className="h-4 w-4 text-primary" />
               Your Referral Link
             </h3>
             <Input 
               value={referralLink}
               readOnly
               className="glass-input font-mono text-xs"
             />
             <div className="grid grid-cols-2 gap-3">
               <Button onClick={handleCopy} variant="outline" className="rounded-xl">
                 {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                 {copied ? 'Copied!' : 'Copy'}
               </Button>
               <Button onClick={handleShare} className="rounded-xl gradient-primary text-primary-foreground">
                 <Share2 className="h-4 w-4 mr-2" />
                 Share
               </Button>
             </div>
           </div>
         </GlassCard>
 
         {/* Recent Earnings */}
         <div>
           <h3 className="font-semibold mb-3">Recent Earnings</h3>
           {loading ? (
             <div className="flex justify-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
             </div>
           ) : earnings.length === 0 ? (
             <GlassCard>
               <div className="p-8 text-center">
                 <Gift className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                 <p className="text-muted-foreground">No earnings yet</p>
                 <p className="text-xs text-muted-foreground mt-1">
                   Start sharing your referral link!
                 </p>
               </div>
             </GlassCard>
           ) : (
             <div className="space-y-2">
               {earnings.slice(0, 10).map((earning) => (
                 <GlassCard key={earning.id}>
                   <div className="p-3 flex items-center justify-between">
                     <div>
                       <p className="font-medium text-sm">Referral Commission</p>
                       <p className="text-xs text-muted-foreground">
                         {format(new Date(earning.created_at), 'MMM d, yyyy')}
                       </p>
                     </div>
                     <span className="font-bold text-success">+{formatPrice(earning.amount)}</span>
                   </div>
                 </GlassCard>
               ))}
             </div>
           )}
         </div>
       </div>
     </MobileLayout>
   );
 };
 
 export default MobileReferrals;