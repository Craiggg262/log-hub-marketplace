 import React, { useCallback } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { MobileLayout } from '@/components/mobile/MobileLayout';
 import { GlassCard } from '@/components/mobile/GlassCard';
 import { PullToRefresh } from '@/components/mobile/PullToRefresh';
 import { Badge } from '@/components/ui/badge';
 import { 
   ShoppingBag, ChevronRight, Package, Clock, 
   CheckCircle, XCircle
 } from 'lucide-react';
 import { useOrders } from '@/hooks/useOrders';
 import { format } from 'date-fns';
 import { cn } from '@/lib/utils';
 
 const MobileOrders = () => {
   const navigate = useNavigate();
   const { orders, loading } = useOrders();
 
   const formatPrice = (price: number) => `₦${price.toLocaleString()}`;
 
   const getStatusConfig = (status: string) => {
     switch (status) {
       case 'completed':
         return { 
           icon: CheckCircle, 
           color: 'text-success', 
           bgColor: 'bg-success/20',
           label: 'Completed'
         };
       case 'pending':
         return { 
           icon: Clock, 
           color: 'text-warning', 
           bgColor: 'bg-warning/20',
           label: 'Pending'
         };
       case 'failed':
         return { 
           icon: XCircle, 
           color: 'text-destructive', 
           bgColor: 'bg-destructive/20',
           label: 'Failed'
         };
       default:
         return { 
           icon: Package, 
           color: 'text-muted-foreground', 
           bgColor: 'bg-muted/20',
           label: status
         };
     }
   };
 
  const handleRefresh = useCallback(async () => {
    window.location.reload();
  }, []);

  return (
    <MobileLayout title="Orders">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-4">
         {/* Header */}
         <div className="mb-2">
           <h2 className="text-lg font-bold">Order History</h2>
           <p className="text-sm text-muted-foreground">
             View your purchase history
           </p>
         </div>
 
         {loading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
           </div>
         ) : orders.length === 0 ? (
           <GlassCard>
             <div className="p-12 text-center">
               <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
               <h3 className="font-semibold mb-2">No orders yet</h3>
               <p className="text-sm text-muted-foreground">
                 Your purchase history will appear here
               </p>
             </div>
           </GlassCard>
         ) : (
           <div className="space-y-3">
             {orders.map((order) => {
               const statusConfig = getStatusConfig(order.status);
               const StatusIcon = statusConfig.icon;
               
               return (
                 <GlassCard
                   key={order.id}
                   variant="interactive"
                   onClick={() => navigate(`/app/order/${order.id}`)}
                 >
                   <div className="p-4">
                     <div className="flex items-start justify-between mb-3">
                       <div className="flex items-center gap-3">
                         <div className={cn(
                           "w-10 h-10 rounded-xl flex items-center justify-center",
                           statusConfig.bgColor
                         )}>
                           <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                         </div>
                         <div>
                           <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                           <p className="text-xs text-muted-foreground">
                             {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                           </p>
                         </div>
                       </div>
                       <ChevronRight className="h-5 w-5 text-muted-foreground" />
                     </div>
                     
                     <div className="flex items-center justify-between pt-2 border-t border-border/30">
                       <Badge 
                         variant="outline" 
                         className={cn("border-none", statusConfig.bgColor, statusConfig.color)}
                       >
                         {statusConfig.label}
                       </Badge>
                       <span className="font-bold text-primary">
                         {formatPrice(order.total_amount)}
                       </span>
                     </div>
                   </div>
                 </GlassCard>
               );
             })}
           </div>
         )}
        </div>
      </PullToRefresh>
    </MobileLayout>
   );
 };
 
 export default MobileOrders;