 import React from 'react';
 import { useNavigate } from 'react-router-dom';
 import { MobileLayout } from '@/components/mobile/MobileLayout';
 import { GlassCard } from '@/components/mobile/GlassCard';
 import { Button } from '@/components/ui/button';
 import { 
   User, Mail, Phone, Gift, Settings, 
   LogOut, ChevronRight, Shield, HelpCircle,
   ExternalLink
 } from 'lucide-react';
 import { useAuth } from '@/hooks/useAuth';
 import { cn } from '@/lib/utils';
 
 interface MenuItem {
   icon: React.ElementType;
   label: string;
   path?: string;
   action?: () => void;
   color?: string;
   external?: boolean;
 }
 
 const MobileProfile = () => {
   const navigate = useNavigate();
   const { user, profile, signOut } = useAuth();
 
   const handleSignOut = async () => {
     await signOut();
     navigate('/login');
   };
 
   const menuItems: MenuItem[] = [
     { icon: Gift, label: 'Referral & Earn', path: '/app/referrals' },
     { icon: Settings, label: 'Settings', path: '/app/settings' },
     { icon: Shield, label: 'Privacy Policy', path: '/app/privacy' },
     { icon: HelpCircle, label: 'Help & Support', action: () => window.open('https://wa.me/+12252801497', '_blank'), external: true },
     { 
       icon: ExternalLink, 
       label: 'Boost Account', 
       action: () => window.open('https://boosterhub.name.ng', '_blank'),
       external: true
     },
   ];
 
   return (
     <MobileLayout title="Profile" showHeader={false}>
       <div className="p-4 space-y-6">
         {/* Profile Header */}
         <div className="pt-8 pb-4 text-center">
           <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4">
             <User className="h-12 w-12 text-primary-foreground" />
           </div>
           <h2 className="text-xl font-bold">{profile?.full_name || 'User'}</h2>
           <p className="text-sm text-muted-foreground">{user?.email}</p>
         </div>
 
         {/* Profile Info Card */}
         <GlassCard>
           <div className="p-4 space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                 <Mail className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Email</p>
                 <p className="font-medium">{user?.email}</p>
               </div>
             </div>
             
             {profile?.phone && (
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                   <Phone className="h-5 w-5 text-accent" />
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground">Phone</p>
                   <p className="font-medium">{profile.phone}</p>
                 </div>
               </div>
             )}
 
             {profile?.referral_code && (
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                   <Gift className="h-5 w-5 text-success" />
                 </div>
                 <div>
                   <p className="text-xs text-muted-foreground">Referral Code</p>
                   <p className="font-mono font-bold text-primary">{profile.referral_code}</p>
                 </div>
               </div>
             )}
           </div>
         </GlassCard>
 
         {/* Menu Items */}
         <div className="space-y-2">
           {menuItems.map((item) => (
             <GlassCard
               key={item.label}
               variant="interactive"
               onClick={() => item.path ? navigate(item.path) : item.action?.()}
             >
               <div className="p-4 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                   <item.icon className={cn("h-5 w-5", item.color || "text-foreground")} />
                 </div>
                 <span className="flex-1 font-medium">{item.label}</span>
                 {item.external ? (
                   <ExternalLink className="h-4 w-4 text-muted-foreground" />
                 ) : (
                   <ChevronRight className="h-5 w-5 text-muted-foreground" />
                 )}
               </div>
             </GlassCard>
           ))}
         </div>
 
         {/* Logout Button */}
         <Button 
           onClick={handleSignOut}
           variant="outline" 
           className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
         >
           <LogOut className="h-5 w-5 mr-2" />
           Sign Out
         </Button>
 
         <p className="text-center text-xs text-muted-foreground pb-4">
           Log Hub Marketplace v1.0.0
         </p>
       </div>
     </MobileLayout>
   );
 };
 
 export default MobileProfile;