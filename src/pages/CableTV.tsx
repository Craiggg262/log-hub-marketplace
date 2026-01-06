import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tv, Wallet, FolderOpen } from "lucide-react";
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

const providers = [
  { id: "dstv", name: "DSTV" },
  { id: "gotv", name: "GOtv" },
  { id: "startimes", name: "StarTimes" },
  { id: "showmax", name: "Showmax" },
];

// Sample packages - will be replaced with API data
const packages: Record<string, { id: string; name: string; price: number }[]> = {
  dstv: [
    { id: "dstv_padi", name: "DStv Padi", price: 2500 },
    { id: "dstv_yanga", name: "DStv Yanga", price: 3500 },
    { id: "dstv_confam", name: "DStv Confam", price: 6200 },
    { id: "dstv_compact", name: "DStv Compact", price: 10500 },
    { id: "dstv_compact_plus", name: "DStv Compact Plus", price: 16600 },
    { id: "dstv_premium", name: "DStv Premium", price: 24500 },
  ],
  gotv: [
    { id: "gotv_smallie", name: "GOtv Smallie", price: 1100 },
    { id: "gotv_jinja", name: "GOtv Jinja", price: 2250 },
    { id: "gotv_jolli", name: "GOtv Jolli", price: 3300 },
    { id: "gotv_max", name: "GOtv Max", price: 4850 },
    { id: "gotv_supa", name: "GOtv Supa", price: 6400 },
  ],
  startimes: [
    { id: "startimes_nova", name: "StarTimes Nova", price: 1200 },
    { id: "startimes_basic", name: "StarTimes Basic", price: 2100 },
    { id: "startimes_smart", name: "StarTimes Smart", price: 2800 },
    { id: "startimes_classic", name: "StarTimes Classic", price: 3000 },
    { id: "startimes_super", name: "StarTimes Super", price: 5500 },
  ],
  showmax: [
    { id: "showmax_mobile", name: "Showmax Mobile", price: 1200 },
    { id: "showmax_standard", name: "Showmax Standard", price: 2900 },
    { id: "showmax_pro", name: "Showmax Pro", price: 6300 },
    { id: "showmax_pro_mobile", name: "Showmax Pro Mobile", price: 3200 },
  ],
};

const CableTV = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [provider, setProvider] = useState("");
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [loading, setLoading] = useState(false);

  const availablePackages = provider ? packages[provider] || [] : [];
  const packageDetails = availablePackages.find(p => p.id === selectedPackage);

  const handleSubscribe = async () => {
    if (!provider || !smartCardNumber || !selectedPackage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (packageDetails && packageDetails.price > (profile?.wallet_balance || 0)) {
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
      description: "Cable TV subscription API will be integrated soon",
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
            <Tv className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Cable TV Subscription</h1>
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

        {/* Form */}
        <Card className="p-6 bg-card border-border space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground">Cable Provider</Label>
            <Select value={provider} onValueChange={(val) => {
              setProvider(val);
              setSelectedPackage("");
            }}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Choose Provider" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Smart Card Number</Label>
            <Input
              type="text"
              placeholder="Enter smart card number"
              value={smartCardNumber}
              onChange={(e) => setSmartCardNumber(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Select Package</Label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage} disabled={!provider}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder={provider ? "Select package" : "Select provider first"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60">
                {availablePackages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} - ₦{pkg.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {packageDetails && (
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">₦{packageDetails.price.toLocaleString()}</p>
            </div>
          )}

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground py-6 text-lg"
          >
            <FolderOpen className="w-5 h-5 mr-2" />
            {loading ? "Processing..." : "Subscribe Now"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CableTV;
