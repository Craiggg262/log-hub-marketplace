import React from 'react';
import { DrawerSidebar } from "@/components/DrawerSidebar";
import { User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { InstallPWA } from "@/components/InstallPWA";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Header */}
      <header className="h-16 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <DrawerSidebar />
            <h1 className="text-xl font-semibold text-primary">Log Hub</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <InstallPWA />
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
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