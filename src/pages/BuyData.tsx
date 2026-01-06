import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, ShoppingCart, Wallet, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const networks = [
  { id: "mtn", name: "MTN", color: "bg-yellow-500" },
  { id: "airtel", name: "Airtel", color: "bg-red-500" },
  { id: "glo", name: "Glo", color: "bg-green-500" },
  { id: "9mobile", name: "9Mobile", color: "bg-green-700" },
];

const planTypes = [
  { id: "sme", name: "SME Data" },
  { id: "gifting", name: "Gifting Data" },
  { id: "corporate", name: "Corporate Gifting" },
];

// Sample data plans - will be replaced with API data
const dataPlans: Record<string, { id: string; name: string; price: number }[]> = {
  mtn: [
    { id: "mtn_500mb", name: "500MB - 30 Days", price: 150 },
    { id: "mtn_1gb", name: "1GB - 30 Days", price: 260 },
    { id: "mtn_2gb", name: "2GB - 30 Days", price: 520 },
    { id: "mtn_3gb", name: "3GB - 30 Days", price: 780 },
    { id: "mtn_5gb", name: "5GB - 30 Days", price: 1300 },
  ],
  airtel: [
    { id: "airtel_500mb", name: "500MB - 30 Days", price: 150 },
    { id: "airtel_1gb", name: "1GB - 30 Days", price: 260 },
    { id: "airtel_2gb", name: "2GB - 30 Days", price: 520 },
    { id: "airtel_5gb", name: "5GB - 30 Days", price: 1300 },
  ],
  glo: [
    { id: "glo_1gb", name: "1GB - 30 Days", price: 260 },
    { id: "glo_2gb", name: "2GB - 30 Days", price: 520 },
    { id: "glo_3gb", name: "3GB - 30 Days", price: 780 },
    { id: "glo_5gb", name: "5GB - 30 Days", price: 1300 },
  ],
  "9mobile": [
    { id: "9mobile_1gb", name: "1GB - 30 Days", price: 260 },
    { id: "9mobile_2gb", name: "2GB - 30 Days", price: 520 },
    { id: "9mobile_5gb", name: "5GB - 30 Days", price: 1300 },
  ],
};

const BuyData = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [network, setNetwork] = useState("");
  const [planType, setPlanType] = useState("");
  const [dataPlan, setDataPlan] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const availablePlans = network ? dataPlans[network] || [] : [];
  const selectedPlan = availablePlans.find(p => p.id === dataPlan);

  const handlePurchase = async () => {
    if (!network || !planType || !dataPlan || !phoneNumber) {
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
        description: "Please fund your wallet to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // TODO: Integrate with actual API
    toast({
      title: "Coming Soon",
      description: "Data purchase API will be integrated soon",
    });
    
    setLoading(false);
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

        {/* Buy Again Section - Placeholder */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Buy Again</span>
          </div>
          <p className="text-sm text-muted-foreground">Your recent purchases will appear here</p>
        </div>

        {/* Form */}
        <Card className="p-6 bg-card border-border space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground">Select Network</Label>
            <Select value={network} onValueChange={(val) => {
              setNetwork(val);
              setDataPlan("");
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
            <Select value={dataPlan} onValueChange={setDataPlan} disabled={!planType}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={planType ? "Select data plan" : "Select plan type first"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availablePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ₦{plan.price.toLocaleString()}
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
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">₦{selectedPlan.price.toLocaleString()}</p>
            </div>
          )}

          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground py-6 text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {loading ? "Processing..." : "Purchase Data"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default BuyData;
