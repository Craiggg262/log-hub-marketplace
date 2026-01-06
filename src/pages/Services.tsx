import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Phone, 
  Wifi, 
  Zap, 
  Tv, 
  Package, 
  Star, 
  Wallet,
  Plus,
  Users
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Services = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const quickServices = [
    { 
      title: "Airtime", 
      icon: Phone, 
      url: "/services/airtime",
      description: "Buy airtime for all networks"
    },
    { 
      title: "Data Bundles", 
      icon: Wifi, 
      url: "/services/data",
      description: "Purchase data plans"
    },
    { 
      title: "Electricity", 
      icon: Zap, 
      url: "/services/electricity",
      description: "Pay electricity bills"
    },
    { 
      title: "Cable TV", 
      icon: Tv, 
      url: "/services/cable",
      description: "Subscribe to cable TV"
    },
    { 
      title: "Orders", 
      icon: Package, 
      url: "/orders",
      description: "View your orders"
    },
    { 
      title: "Refer & Earn", 
      icon: Star, 
      url: "/referral-earn",
      description: "Invite friends and earn"
    },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back! 👋
            </h1>
            <p className="text-muted-foreground">
              Manage your services and transactions
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {firstName.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Balance Card */}
        <Card className="p-6 bg-card border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-primary">
                  ₦{(profile?.wallet_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/fund-wallet')}
              className="gradient-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Fund Wallet
            </Button>
          </div>
        </Card>

        {/* Quick Services */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card
                  key={service.title}
                  onClick={() => navigate(service.url)}
                  className="p-6 bg-card border-border hover:border-primary/50 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{service.title}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Additional Navigation */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            onClick={() => navigate('/universal-logs')}
            className="p-6 bg-card border-border hover:border-primary/50 cursor-pointer transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-accent" />
              </div>
              <span className="font-medium text-foreground">Social Media Accounts</span>
            </div>
          </Card>
          <Card
            onClick={() => window.open('https://boosterhub.name.ng', '_blank')}
            className="p-6 bg-card border-border hover:border-primary/50 cursor-pointer transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <span className="font-medium text-foreground">Boosting</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Services;
