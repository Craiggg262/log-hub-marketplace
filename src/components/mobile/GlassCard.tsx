 import React from 'react';
 import { cn } from '@/lib/utils';
 
 interface GlassCardProps {
   children: React.ReactNode;
   className?: string;
   onClick?: () => void;
   variant?: 'default' | 'elevated' | 'interactive';
   glow?: boolean;
 }
 
 export const GlassCard: React.FC<GlassCardProps> = ({ 
   children, 
   className, 
   onClick,
   variant = 'default',
   glow = false
 }) => {
   const baseStyles = "rounded-2xl overflow-hidden transition-all duration-300";
   
   const variants = {
     default: "glass-card",
     elevated: "glass-card shadow-xl",
     interactive: "glass-card touch-scale touch-highlight cursor-pointer hover:border-primary/30"
   };
 
   return (
     <div 
       onClick={onClick}
       className={cn(
         baseStyles,
         variants[variant],
         glow && "glass-glow",
         className
       )}
     >
       {children}
     </div>
   );
 };
 
 export default GlassCard;