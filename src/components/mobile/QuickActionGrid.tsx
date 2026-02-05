 import React from 'react';
 import { useNavigate } from 'react-router-dom';
 import { 
   Phone, Wifi, Zap, Tv, Globe, ShoppingCart, 
   Gift, CreditCard, History, MessageCircle
 } from 'lucide-react';
 import { GlassCard } from './GlassCard';
 import { cn } from '@/lib/utils';
 
 interface QuickAction {
   icon: React.ElementType;
   label: string;
   path: string;
   color: string;
   bgColor: string;
 }
 
 const actions: QuickAction[] = [
   { icon: ShoppingCart, label: 'Buy Logs', path: '/app', color: 'text-primary', bgColor: 'bg-primary/20' },
   { icon: Globe, label: 'SMS Verify', path: '/app/sms', color: 'text-accent', bgColor: 'bg-accent/20' },
   { icon: Phone, label: 'Airtime', path: '/app/services/airtime', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
   { icon: Wifi, label: 'Data', path: '/app/services/data', color: 'text-green-400', bgColor: 'bg-green-500/20' },
   { icon: Zap, label: 'Electricity', path: '/app/services/electricity', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
   { icon: Tv, label: 'Cable TV', path: '/app/services/cable', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
   { icon: CreditCard, label: 'Fund Wallet', path: '/app/wallet/fund', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
   { icon: Gift, label: 'Referrals', path: '/app/referrals', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
 ];
 
 export const QuickActionGrid: React.FC = () => {
   const navigate = useNavigate();
 
   return (
     <div className="grid grid-cols-4 gap-3 p-4">
       {actions.map((action) => (
         <GlassCard
           key={action.path}
           variant="interactive"
           onClick={() => navigate(action.path)}
           className="aspect-square"
         >
           <div className="h-full flex flex-col items-center justify-center p-2 gap-1.5">
             <div className={cn(
               "w-10 h-10 rounded-xl flex items-center justify-center",
               action.bgColor
             )}>
               <action.icon className={cn("h-5 w-5", action.color)} />
             </div>
             <span className="text-[10px] font-medium text-center text-foreground/80 leading-tight">
               {action.label}
             </span>
           </div>
         </GlassCard>
       ))}
     </div>
   );
 };
 
 export default QuickActionGrid;