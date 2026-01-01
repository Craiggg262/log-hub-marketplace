import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Wallet,
  ShoppingCart,
  History,
  Settings,
  Plus,
  Gift,
  Globe
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

  const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Universal Logs", url: "/universal-logs", icon: Globe },
  { title: "Cart", url: "/cart", icon: ShoppingCart },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Fund Wallet", url: "/fund-wallet", icon: Plus },
  { title: "Orders", url: "/orders", icon: History },
  { title: "History", url: "/history", icon: History },
  { title: "Referral Earn", url: "/referral-earn", icon: Gift },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium" 
      : "text-foreground";

  return (
    <Sidebar
      className="w-64"
      collapsible="icon"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavCls}
                        title={item.title}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}