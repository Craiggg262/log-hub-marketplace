 import React, { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { MobileLayout } from '@/components/mobile/MobileLayout';
 import { GlassCard } from '@/components/mobile/GlassCard';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { 
   Search, Star, Filter, ShoppingCart, Plus
 } from 'lucide-react';
 import { useLogs } from '@/hooks/useLogs';
 import { useCart } from '@/hooks/useCart';
 import { useToast } from '@/hooks/use-toast';
 import SocialIcon from '@/components/SocialIcon';
 import { cn } from '@/lib/utils';
 
 const MobileLogs = () => {
   const navigate = useNavigate();
   const { logs, categories, loading } = useLogs();
   const { addToCart } = useCart();
   const { toast } = useToast();
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
 
   const formatPrice = (price: number) => `₦${price.toLocaleString()}`;
 
   const filteredLogs = logs.filter(log => {
     const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesCategory = !selectedCategory || log.categories?.name === selectedCategory;
     return matchesSearch && matchesCategory && log.in_stock;
   });
 
   const handleAddToCart = async (e: React.MouseEvent, logId: string, title: string) => {
     e.stopPropagation();
     try {
       await addToCart(logId);
       toast({ title: 'Added!', description: `${title} added to cart` });
     } catch (error) {
       toast({ title: 'Error', description: 'Failed to add to cart', variant: 'destructive' });
     }
   };
 
   return (
     <MobileLayout title="Buy Logs">
       <div className="p-4 space-y-4">
         {/* Search */}
         <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <Input
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Search logs..."
             className="pl-10 glass-input rounded-xl h-12"
           />
         </div>
 
         {/* Category Filters */}
         <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
           <button
             onClick={() => setSelectedCategory(null)}
             className={cn(
               "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
               !selectedCategory 
                 ? "gradient-primary text-primary-foreground" 
                 : "glass-button text-foreground"
             )}
           >
             All
           </button>
           {categories.map((cat) => (
             <button
               key={cat.id}
               onClick={() => setSelectedCategory(cat.name)}
               className={cn(
                 "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
                 selectedCategory === cat.name 
                   ? "gradient-primary text-primary-foreground" 
                   : "glass-button text-foreground"
               )}
             >
               <SocialIcon platform={cat.name} size={16} />
               {cat.name}
             </button>
           ))}
         </div>
 
         {/* Logs Grid */}
         {loading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
           </div>
         ) : filteredLogs.length === 0 ? (
           <GlassCard>
             <div className="p-12 text-center">
               <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
               <h3 className="font-semibold mb-2">No logs found</h3>
               <p className="text-sm text-muted-foreground">
                 Try adjusting your search or filters
               </p>
             </div>
           </GlassCard>
         ) : (
           <div className="grid grid-cols-2 gap-3">
             {filteredLogs.map((log) => (
               <GlassCard
                 key={log.id}
                 variant="interactive"
                 onClick={() => navigate(`/app/log/${log.id}`)}
               >
                 <div className="p-3">
                   <div className="flex items-center gap-2 mb-2">
                     <SocialIcon platform={log.categories?.name || ''} size={18} />
                     <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50">
                       {log.categories?.name}
                     </Badge>
                   </div>
                   
                   <h3 className="text-sm font-semibold line-clamp-2 mb-2 min-h-[2.5rem]">
                     {log.title}
                   </h3>
                   
                   <div className="flex items-center gap-1 mb-2">
                     <Star className="h-3 w-3 fill-primary text-primary" />
                     <span className="text-xs">{log.rating}</span>
                     <span className="text-xs text-muted-foreground">({log.reviews})</span>
                   </div>
                   
                   <div className="flex items-center justify-between">
                     <span className="text-primary font-bold text-sm">
                       {formatPrice(log.price)}
                     </span>
                     <Button
                       size="sm"
                       onClick={(e) => handleAddToCart(e, log.id, log.title)}
                       className="h-8 w-8 p-0 rounded-lg gradient-primary"
                     >
                       <Plus className="h-4 w-4" />
                     </Button>
                   </div>
                   
                   <Badge 
                     className="mt-2 text-[9px] w-full justify-center bg-success/20 text-success border-none"
                   >
                     {log.stock} available
                   </Badge>
                 </div>
               </GlassCard>
             ))}
           </div>
         )}
       </div>
     </MobileLayout>
   );
 };
 
 export default MobileLogs;