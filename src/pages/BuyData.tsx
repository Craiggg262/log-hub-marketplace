import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, ShoppingCart, Wallet, Clock, History, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

interface DataPlan {
  id: number;
  network: string;
  name: string;
  validity: string;
  price: number;
  type: string;
}

interface VtuOrder {
  id: string;
  order_type: string;
  network: string;
  plan_name: string;
  mobile_number: string;
  amount: number;
  status: string;
  created_at: string;
}

const networks = [
  { id: "mtn", name: "MTN", color: "bg-yellow-500" },
  { id: "airtel", name: "Airtel", color: "bg-red-500" },
  { id: "glo", name: "Glo", color: "bg-green-500" },
  { id: "9mobile", name: "9Mobile", color: "bg-green-700" },
];

const planTypes = [
  { id: "all", name: "All Plans" },
  { id: "sme", name: "SME Data" },
  { id: "gifting", name: "Gifting Data" },
  { id: "corporate", name: "Corporate" },
];

const BuyData = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [network, setNetwork] = useState("");
  const [planType, setPlanType] = useState("all");
  const [dataPlan, setDataPlan] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [orders, setOrders] = useState<VtuOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState("purchase");

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const unwrapFunctionError = async (err: unknown) => {
    if (err instanceof FunctionsHttpError) {
      const body = await err.context.json().catch(() => null);
      const msg = body?.error || body?.message || JSON.stringify(body) || err.message;
      return new Error(msg);
    }
    if (err instanceof FunctionsRelayError || err instanceof FunctionsFetchError) {
      return new Error(err.message);
    }
    return err instanceof Error ? err : new Error("Request failed");
  };

  // Fetch plans when network changes
  useEffect(() => {
    if (network) {
      fetchPlans();
    } else {
      setPlans([]);
    }
  }, [network]);

  // Fetch order history when tab changes
  useEffect(() => {
    if (activeTab === "history") {
      fetchOrderHistory();
    }
  }, [activeTab]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await supabase.functions.invoke("betasub-vtu", {
        headers: await getAuthHeaders(),
        body: { action: "getPlans", network },
      });

      if (response.error) throw await unwrapFunctionError(response.error);
      if (response.data?.status === "success") {
        setPlans(response.data.data);
      } else {
        throw new Error(response.data?.error || "Failed to load plans");
      }
    } catch (error: any) {
      console.error("Failed to fetch plans:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load data plans",
        variant: "destructive",
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchOrderHistory = async () => {
    setLoadingOrders(true);
    try {
      const response = await supabase.functions.invoke("betasub-vtu", {
        headers: await getAuthHeaders(),
        body: { action: "getOrderHistory" },
      });

      if (response.error) throw await unwrapFunctionError(response.error);
      if (response.data?.status === "success") {
        setOrders(response.data.data);
      } else {
        throw new Error(response.data?.error || "Failed to load history");
      }
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const filteredPlans = planType === "all" 
    ? plans 
    : plans.filter(p => p.type === planType);

  const selectedPlan = plans.find(p => p.id.toString() === dataPlan);

  const handlePurchase = async () => {
    if (!network || !dataPlan || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (phoneNumber.length !== 11) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 11-digit phone number",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlan && selectedPlan.price > (profile?.wallet_balance || 0)) {
      toast({
        title: "Insufficient Balance",
        description: `You need ₦${selectedPlan.price.toLocaleString()} but have ₦${(profile?.wallet_balance || 0).toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await supabase.functions.invoke("betasub-vtu", {
        headers: await getAuthHeaders(),
        body: {
          action: "buyData",
          network,
          planId: parseInt(dataPlan),
          mobileNumber: phoneNumber,
        },
      });

      if (response.error) throw await unwrapFunctionError(response.error);

      if (response.data?.status === "success") {
        toast({
          title: "Success!",
          description: response.data.message || "Data purchase successful",
        });
        
        // Refresh profile to update balance
        await refreshProfile();
        
        // Reset form
        setDataPlan("");
        setPhoneNumber("");
        
        // Switch to history tab
        setActiveTab("history");
        fetchOrderHistory();
      } else {
        throw new Error(response.data?.error || "Purchase failed");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to complete purchase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Wifi className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Buy Data</h1>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-xl font-bold text-primary">
                ₦{(profile?.wallet_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchase" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Purchase
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-6">
            {/* Form */}
            <Card className="p-6 bg-card border-border space-y-6">
              <div className="space-y-2">
                <Label className="text-foreground">Select Network</Label>
                <Select value={network} onValueChange={(val) => {
                  setNetwork(val);
                  setDataPlan("");
                  setPlanType("all");
                }}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Choose Network" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {networks.map((net) => (
                      <SelectItem key={net.id} value={net.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${net.color}`} />
                          {net.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Plan Type</Label>
                <Select value={planType} onValueChange={setPlanType} disabled={!network}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={network ? "Select plan type" : "Select network first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {planTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Data Plan</Label>
                <Select value={dataPlan} onValueChange={setDataPlan} disabled={!network || loadingPlans}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder={
                      loadingPlans ? "Loading plans..." : 
                      !network ? "Select network first" : 
                      "Select data plan"
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-60">
                    {filteredPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - {plan.validity} - ₦{plan.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Mobile Number</Label>
                <Input
                  type="tel"
                  placeholder="08012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  className="bg-secondary border-border"
                />
              </div>

              {selectedPlan && (
                <div className="p-4 bg-secondary rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Selected Plan</p>
                      <p className="font-medium">{selectedPlan.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedPlan.validity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-2xl font-bold text-primary">₦{selectedPlan.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePurchase}
                disabled={loading || !selectedPlan}
                className="w-full gradient-primary text-primary-foreground py-6 text-lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {loading ? "Processing..." : "Purchase Data"}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <Card className="p-8 text-center bg-card border-border">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No purchase history yet</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4 bg-card border-border">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{order.plan_name}</span>
                          <Badge variant={order.status === "successful" ? "default" : order.status === "failed" ? "destructive" : "secondary"}>
                            {order.status === "successful" && <Check className="h-3 w-3 mr-1" />}
                            {order.status === "failed" && <X className="h-3 w-3 mr-1" />}
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.network} • {order.mobile_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <p className="font-bold text-primary">₦{order.amount.toLocaleString()}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BuyData;
