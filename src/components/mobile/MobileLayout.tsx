 import React, { useEffect } from 'react';
 import { useLocation, useNavigate } from 'react-router-dom';
 import { Home, Grid3X3, Wallet, ShoppingBag, User } from 'lucide-react';
 import { useAuth } from '@/hooks/useAuth';
 import logoImage from '@/assets/logo.png';
 import { cn } from '@/lib/utils';
 
 interface MobileLayoutProps {
   children: React.ReactNode;
   title?: string;
   showHeader?: boolean;
 }
 
 const navItems = [
   { path: '/app', icon: Home, label: 'Home' },
   { path: '/app/services', icon: Grid3X3, label: 'Services' },
   { path: '/app/wallet', icon: Wallet, label: 'Wallet' },
   { path: '/app/orders', icon: ShoppingBag, label: 'Orders' },
   { path: '/app/profile', icon: User, label: 'Profile' },
 ];
 
 export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
   children, 
   title,
   showHeader = true 
 }) => {
   const location = useLocation();
   const navigate = useNavigate();
   const { profile } = useAuth();
 
   // Initialize Capacitor plugins
   useEffect(() => {
     const initCapacitor = async () => {
       try {
         const { StatusBar, Style } = await import('@capacitor/status-bar');
         const { SplashScreen } = await import('@capacitor/splash-screen');
         
         await StatusBar.setStyle({ style: Style.Dark });
         await StatusBar.setBackgroundColor({ color: '#151922' });
         await SplashScreen.hide();
       } catch (e) {
         // Running in browser, not native app
       }
     };
     initCapacitor();
   }, []);
 
   const isActive = (path: string) => {
     if (path === '/app') return location.pathname === '/app';
     return location.pathname.startsWith(path);
   };
 
   return (
     <div className="min-h-screen flex flex-col bg-background silk-gradient">
       {/* Ambient glow effects */}
       <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
       </div>
 
       {/* Header */}
       {showHeader && (
         <header className="glass-header sticky top-0 z-40 px-4 py-3 safe-area-top">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <img src={logoImage} alt="Log Hub" className="h-9 w-9 rounded-xl" />
               <div>
                 <h1 className="text-lg font-bold text-gradient">
                   {title || 'Log Hub'}
                 </h1>
                 {profile?.full_name && (
                   <p className="text-xs text-muted-foreground">
                     Welcome, {profile.full_name.split(' ')[0]}
                   </p>
                 )}
               </div>
             </div>
             
             <div className="glass-button px-3 py-1.5 rounded-full">
               <span className="text-sm font-semibold text-primary">
                 ₦{(profile?.wallet_balance || 0).toLocaleString()}
               </span>
             </div>
           </div>
         </header>
       )}
 
       {/* Main Content */}
       <main className="flex-1 relative z-10 mobile-safe-bottom">
         {children}
       </main>
 
       {/* Bottom Tab Navigation */}
       <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 mobile-nav-safe">
         <div className="flex items-center justify-around px-2 py-2">
           {navItems.map((item) => {
             const active = isActive(item.path);
             return (
               <button
                 key={item.path}
                 onClick={() => navigate(item.path)}
                 className={cn(
                   "flex flex-col items-center justify-center w-16 py-2 rounded-2xl transition-all duration-300 touch-scale touch-highlight",
                   active 
                     ? "glass-glow bg-primary/10" 
                     : "hover:bg-muted/20"
                 )}
               >
                 <item.icon 
                   className={cn(
                     "h-6 w-6 mb-1 transition-colors",
                     active ? "text-primary" : "text-muted-foreground"
                   )} 
                 />
                 <span 
                   className={cn(
                     "text-[10px] font-medium transition-colors",
                     active ? "text-primary" : "text-muted-foreground"
                   )}
                 >
                   {item.label}
                 </span>
                 {active && (
                   <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                 )}
               </button>
             );
           })}
         </div>
       </nav>
     </div>
   );
 };
 
 export default MobileLayout;