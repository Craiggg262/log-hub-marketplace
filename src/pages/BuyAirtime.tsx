import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, ShoppingCart, Wallet } from "lucide-react";
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

const BuyAirtime = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [network, setNetwork] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!network || !phoneNumber || !amount) {
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

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 50) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₦50",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > (profile?.wallet_balance || 0)) {
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
      description: "Airtime purchase API will be integrated soon",
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
            <Phone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Buy Airtime</h1>
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
            <Label className="text-foreground">Select Network</Label>
            <Select value={network} onValueChange={setNetwork}>
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
            <Label className="text-foreground">Mobile Number</Label>
            <Input
              type="tel"
              placeholder="08012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Amount (₦)</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="50"
              className="bg-secondary border-border"
            />
          </div>

          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground py-6 text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {loading ? "Processing..." : "Purchase Airtime"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default BuyAirtime;
