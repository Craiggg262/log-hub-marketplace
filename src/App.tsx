import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Wallet from "./pages/Wallet";
import FundWallet from "./pages/FundWallet";
import Orders from "./pages/Orders";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import AISupport from "./components/AISupport";

const queryClient = new QueryClient();

function AppContent() {
  // Protected Route Component - now inside AuthProvider context
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

  // Auth Route Component - now inside AuthProvider context
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

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/fund-wallet" element={<ProtectedRoute><FundWallet /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        
        {/* Admin Route - Completely separate, no layout */}
        <Route path="/admin" element={<Admin />} />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AISupport />
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
