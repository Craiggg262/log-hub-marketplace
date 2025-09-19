import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Wallet,
  ShoppingCart,
  History,
  Settings,
  Plus
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
  { title: "Cart", url: "/cart", icon: ShoppingCart },
  { title: "Wallet", url: "/wallet", icon: Wallet },
  { title: "Fund Wallet", url: "/fund-wallet", icon: Plus },
  { title: "Orders", url: "/orders", icon: History },
  { title: "History", url: "/history", icon: History },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
      : "hover:bg-accent hover:text-accent-foreground";

  return (
    <Sidebar
      className="w-64"
      collapsible="none"
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
                  <SidebarMenuButton asChild className="flex items-center justify-center md:justify-start">
                    <NavLink 
                      to={item.url} 
                      className={getNavCls}
                      title={item.title}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="transition-opacity duration-200">
                        {item.title}
                      </span>
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