import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Wallet,
  ShoppingCart,
  History,
  Settings,
  Plus,
  User,
  CreditCard,
  MessageCircle,
  ExternalLink,
  LogOut,
  Menu,
  Download,
  Globe,
  Gift,
  LayoutGrid,
  Phone,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InstallPWA } from "@/components/InstallPWA";

interface DrawerSidebarProps {
  trigger?: React.ReactNode;
}

const menuItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Services", url: "/services", icon: LayoutGrid },
  { title: "SMS Verification", url: "/sms-verification", icon: Phone },
  { title: "Universal Logs", url: "/universal-logs", icon: Globe },
  { title: "Orders", url: "/orders", icon: History },
  { title: "Cart", url: "/cart", icon: ShoppingCart },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Fund Wallet", url: "/fund-wallet", icon: Plus },
  { title: "Referral Earn", url: "/referral-earn", icon: Gift },
  { title: "Transactions", url: "/history", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Support", url: "mailto:info.loghubmarketplace@gmail.com", icon: MessageCircle, external: true },
  { title: "Boost Account", url: "https://boosterhub.name.ng", icon: ExternalLink, external: true },
];

export function DrawerSidebar({ trigger }: DrawerSidebarProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      setOpen(false);
      navigate('/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNavClick = (item: typeof menuItems[0]) => {
    if (item.external) {
      window.location.href = item.url;
    } else {
      navigate(item.url);
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-background border-border">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <SheetTitle className="text-2xl font-bold text-primary">
              Log Hub
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-4 py-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground px-3 mb-2">
                  Navigation
                </h3>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.title}
                      onClick={() => handleNavClick(item)}
                      className="w-full flex items-center gap-3 px-3 py-3 text-foreground hover:bg-accent rounded-lg transition-colors"
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm">{item.title}</span>
                      {item.external && (
                        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border space-y-2">
            <div className="w-full">
              <InstallPWA />
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-3"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
