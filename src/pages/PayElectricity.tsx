import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Wallet } from "lucide-react";
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

const discos = [
  { id: "ekedc", name: "Eko Electricity (EKEDC)" },
  { id: "ikedc", name: "Ikeja Electricity (IKEDC)" },
  { id: "aedc", name: "Abuja Electricity (AEDC)" },
  { id: "kedco", name: "Kano Electricity (KEDCO)" },
  { id: "phed", name: "Port Harcourt Electricity (PHED)" },
  { id: "jed", name: "Jos Electricity (JED)" },
  { id: "ibedc", name: "Ibadan Electricity (IBEDC)" },
  { id: "kaedco", name: "Kaduna Electricity (KAEDCO)" },
  { id: "eedc", name: "Enugu Electricity (EEDC)" },
  { id: "bedc", name: "Benin Electricity (BEDC)" },
];

const meterTypes = [
  { id: "prepaid", name: "Prepaid" },
  { id: "postpaid", name: "Postpaid" },
];

const PayElectricity = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [disco, setDisco] = useState("");
  const [meterType, setMeterType] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayBill = async () => {
    if (!disco || !meterType || !meterNumber || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is ₦500",
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
      description: "Electricity payment API will be integrated soon",
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
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Pay Electricity</h1>
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
        <Card className="p-6 bg-card border-border space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground">Distribution Company (DISCO)</Label>
            <Select value={disco} onValueChange={setDisco}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Choose DISCO" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60">
                {discos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Meter Type</Label>
            <Select value={meterType} onValueChange={setMeterType}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Choose Meter Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {meterTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Meter Number</Label>
            <Input
              type="text"
              placeholder="Enter meter number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Phone Number</Label>
            <Input
              type="tel"
              placeholder="Enter phone number (e.g. 08012345678)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Customer Name</Label>
            <Input
              type="text"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Customer Address</Label>
            <Input
              type="text"
              placeholder="Enter customer address"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
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
              min="500"
              className="bg-secondary border-border"
            />
          </div>

          <Button
            onClick={handlePayBill}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground py-6 text-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            {loading ? "Processing..." : "Pay Bill"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PayElectricity;
