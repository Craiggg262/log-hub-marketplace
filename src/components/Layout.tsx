import React from 'react';
import { DrawerSidebar } from "@/components/DrawerSidebar";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InstallPWA } from "@/components/InstallPWA";
import logoImage from '@/assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <DrawerSidebar />
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Log Hub" className="h-8 w-8 object-contain rounded-lg" />
              <h1 className="text-xl font-semibold text-gradient">Log Hub</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <InstallPWA />
            <div className="flex items-center gap-2 text-sm bg-card/50 px-3 py-2 rounded-lg border border-border/50">
              <User className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">{profile?.full_name || user?.email || 'User'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;