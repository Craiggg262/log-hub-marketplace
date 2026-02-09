import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import BuyAirtime from "./pages/BuyAirtime";
import BuyData from "./pages/BuyData";
import PayElectricity from "./pages/PayElectricity";
import CableTV from "./pages/CableTV";
import Wallet from "./pages/Wallet";
import FundWallet from "./pages/FundWallet";
import OrderDetails from "./pages/OrderDetails";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";

import UniversalLogs from "./pages/UniversalLogs";
import ReferralEarn from "./pages/ReferralEarn";
import SmsVerification from "./pages/SmsVerification";
 
// Mobile App Pages
import MobileHome from "./pages/mobile/MobileHome";
import MobileServices from "./pages/mobile/MobileServices";
import MobileWallet from "./pages/mobile/MobileWallet";
import MobileOrders from "./pages/mobile/MobileOrders";
import MobileProfile from "./pages/mobile/MobileProfile";
import MobileLogs from "./pages/mobile/MobileLogs";
import MobileReferrals from "./pages/mobile/MobileReferrals";
import MobileInstall from "./pages/mobile/MobileInstall";
import MobileLogin from "./pages/mobile/MobileLogin";
import MobileSignup from "./pages/mobile/MobileSignup";

const queryClient = new QueryClient();

// Detect if running as installed PWA
function isPWAStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}

function AppContent() {
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
  };

  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
  };
 
  const MobileProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background silk-gradient">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    return user ? <>{children}</> : <Navigate to="/app/login" replace />;
  };

  const MobileAuthRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background silk-gradient">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    return user ? <Navigate to="/app" replace /> : <>{children}</>;
  };

  // PWA redirect: if opened as standalone PWA, redirect root to /app
  const PWARedirect = () => {
    if (isPWAStandalone()) {
      return <Navigate to="/app/login" replace />;
    }
    return <Index />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PWARedirect />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
        <Route path="/services/airtime" element={<ProtectedRoute><BuyAirtime /></ProtectedRoute>} />
        <Route path="/services/data" element={<ProtectedRoute><BuyData /></ProtectedRoute>} />
        <Route path="/services/electricity" element={<ProtectedRoute><PayElectricity /></ProtectedRoute>} />
        <Route path="/services/cable" element={<ProtectedRoute><CableTV /></ProtectedRoute>} />
        <Route path="/universal-logs" element={<ProtectedRoute><UniversalLogs /></ProtectedRoute>} />
        <Route path="/sms-verification" element={<ProtectedRoute><SmsVerification /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/fund-wallet" element={<ProtectedRoute><FundWallet /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/referral-earn" element={<ProtectedRoute><ReferralEarn /></ProtectedRoute>} />
        
        {/* Mobile App Routes */}
        <Route path="/install" element={<MobileInstall />} />
        <Route path="/app/login" element={<MobileAuthRoute><MobileLogin /></MobileAuthRoute>} />
        <Route path="/app/signup" element={<MobileAuthRoute><MobileSignup /></MobileAuthRoute>} />
        <Route path="/app" element={<MobileProtectedRoute><MobileHome /></MobileProtectedRoute>} />
        <Route path="/app/services" element={<MobileProtectedRoute><MobileServices /></MobileProtectedRoute>} />
        <Route path="/app/services/airtime" element={<MobileProtectedRoute><BuyAirtime /></MobileProtectedRoute>} />
        <Route path="/app/services/data" element={<MobileProtectedRoute><BuyData /></MobileProtectedRoute>} />
        <Route path="/app/services/electricity" element={<MobileProtectedRoute><PayElectricity /></MobileProtectedRoute>} />
        <Route path="/app/services/cable" element={<MobileProtectedRoute><CableTV /></MobileProtectedRoute>} />
        <Route path="/app/wallet" element={<MobileProtectedRoute><MobileWallet /></MobileProtectedRoute>} />
        <Route path="/app/wallet/fund" element={<MobileProtectedRoute><FundWallet /></MobileProtectedRoute>} />
        <Route path="/app/orders" element={<MobileProtectedRoute><MobileOrders /></MobileProtectedRoute>} />
        <Route path="/app/order/:orderId" element={<MobileProtectedRoute><OrderDetails /></MobileProtectedRoute>} />
        <Route path="/app/cart" element={<MobileProtectedRoute><Cart /></MobileProtectedRoute>} />
        <Route path="/app/profile" element={<MobileProtectedRoute><MobileProfile /></MobileProtectedRoute>} />
        <Route path="/app/logs" element={<MobileProtectedRoute><MobileLogs /></MobileProtectedRoute>} />
        <Route path="/app/referrals" element={<MobileProtectedRoute><MobileReferrals /></MobileProtectedRoute>} />
        <Route path="/app/sms" element={<MobileProtectedRoute><SmsVerification /></MobileProtectedRoute>} />
        <Route path="/app/history" element={<MobileProtectedRoute><History /></MobileProtectedRoute>} />
        <Route path="/app/settings" element={<MobileProtectedRoute><Settings /></MobileProtectedRoute>} />
         
        {/* Admin Route */}
        <Route path="/admin" element={<Admin />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
