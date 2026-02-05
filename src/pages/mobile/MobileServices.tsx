 import React from 'react';
 import { useNavigate } from 'react-router-dom';
 import { MobileLayout } from '@/components/mobile/MobileLayout';
 import { GlassCard } from '@/components/mobile/GlassCard';
 import { 
   Phone, Wifi, Zap, Tv, Globe, ShoppingCart,
   ChevronRight, Smartphone, CreditCard
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface ServiceItem {
   icon: React.ElementType;
   title: string;
   description: string;
   path: string;
   color: string;
   bgColor: string;
 }
 
 const services: ServiceItem[] = [
   {
     icon: ShoppingCart,
     title: 'Buy Social Logs',
     description: 'Premium Facebook, Instagram, TikTok accounts',
     path: '/app/logs',
     color: 'text-primary',
     bgColor: 'bg-primary/20'
   },
   {
     icon: Globe,
     title: 'SMS Verification',
     description: 'Get OTP codes for any service',
     path: '/app/sms',
     color: 'text-accent',
     bgColor: 'bg-accent/20'
   },
   {
     icon: Phone,
     title: 'Buy Airtime',
     description: 'All networks at discount rates',
     path: '/app/services/airtime',
     color: 'text-blue-400',
     bgColor: 'bg-blue-500/20'
   },
   {
     icon: Wifi,
     title: 'Buy Data',
     description: 'Affordable data bundles',
     path: '/app/services/data',
     color: 'text-green-400',
     bgColor: 'bg-green-500/20'
   },
   {
     icon: Zap,
     title: 'Pay Electricity',
     description: 'DISCO bills payment',
     path: '/app/services/electricity',
     color: 'text-yellow-400',
     bgColor: 'bg-yellow-500/20'
   },
   {
     icon: Tv,
     title: 'Cable TV',
     description: 'DStv, GOtv, Startimes',
     path: '/app/services/cable',
     color: 'text-purple-400',
     bgColor: 'bg-purple-500/20'
   },
 ];
 
 const MobileServices = () => {
   const navigate = useNavigate();
 
   return (
     <MobileLayout title="Services">
       <div className="p-4 space-y-4">
         {/* Header */}
         <div className="mb-2">
           <h2 className="text-lg font-bold">All Services</h2>
           <p className="text-sm text-muted-foreground">
             Choose from our range of services
           </p>
         </div>
 
         {/* Services List */}
         <div className="space-y-3">
           {services.map((service) => (
             <GlassCard
               key={service.path}
               variant="interactive"
               onClick={() => navigate(service.path)}
             >
               <div className="p-4 flex items-center gap-4">
                 <div className={cn(
                   "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                   service.bgColor
                 )}>
                   <service.icon className={cn("h-7 w-7", service.color)} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h3 className="font-semibold">{service.title}</h3>
                   <p className="text-sm text-muted-foreground truncate">
                     {service.description}
                   </p>
                 </div>
                 <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
               </div>
             </GlassCard>
           ))}
         </div>
 
         {/* Info Card */}
         <GlassCard className="mt-6 bg-gradient-to-r from-accent/10 to-primary/10">
           <div className="p-4">
             <div className="flex items-center gap-3 mb-2">
               <Smartphone className="h-5 w-5 text-primary" />
               <span className="font-semibold">Quick Tip</span>
             </div>
             <p className="text-sm text-muted-foreground">
               Fund your wallet using the virtual account number for instant deposits. 
               All transactions are processed automatically.
             </p>
           </div>
         </GlassCard>
       </div>
     </MobileLayout>
   );
 };
 
 export default MobileServices;