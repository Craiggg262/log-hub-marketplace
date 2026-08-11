import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortalSelector } from "@/components/vtu/PortalSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from '@/lib/currency';

const MARKUP = 1.2;

const BuyAirtime = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refetchProfile } = useAuth() as any;

  const [portal, setPortal] = useState<"1" | "2">("1");
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceId, setServiceId] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setServiceId("");
    setServices([]);
    setLoadingServices(true);
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_services", portal, service_type: "airtime" } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast({ title: "Failed to load networks", description: data?.error || error?.message, variant: "destructive" });
        } else {
          setServices(data?.services || []);
        }
      })
      .finally(() => setLoadingServices(false));
  }, [portal, toast]);

  const amtNum = Number(amount) || 0;
  const chargeAmount = Math.round(amtNum * MARKUP * 100) / 100;

  const handleBuy = async () => {
    const svc = services.find((s) => String(s.service_id) === serviceId);
    if (!svc) return toast({ title: "Choose network", variant: "destructive" });
    if (!/^0\d{10}$/.test(phone)) return toast({ title: "Invalid phone number", variant: "destructive" });
    if (amtNum < 50) return toast({ title: "Minimum ₦50", variant: "destructive" });

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("vtu-gateway", {
      body: {
        action: "buy_airtime",
        portal,
        service_id: svc.service_id,
        network_name: svc.network_name,
        phone_number: phone,
        amount: amtNum,
      },
    });
    setSubmitting(false);

    if (error || data?.error) {
      toast({ title: "Purchase failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Airtime sent!", description: `₦${amtNum} to ${phone}` });
    refetchProfile?.();
    setAmount("");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Buy Airtime</h1>
          </div>
        </div>

        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground mb-2">Wallet Balance</p>
          <p className="text-2xl font-bold text-primary">
            {formatPrice(Number(profile?.wallet_balance || 0))}
          </p>
        </Card>

        <Card className="p-5 bg-card border-border space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Select Portal</Label>
            <div className="mt-2">
              <PortalSelector value={portal} onChange={setPortal} />
            </div>
          </div>

          <div>
            <Label>Network</Label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={loadingServices}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={loadingServices ? "Loading..." : "Choose network"} />
              </SelectTrigger>
              <SelectContent>
                {Array.from(new Map(services.map((s: any) => [String(s.network_name || "").toUpperCase(), s])).values()).map((s: any) => (
                  <SelectItem key={s.service_id} value={String(s.service_id)}>
                    {String(s.network_name || "").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input
              className="mt-1"
              inputMode="numeric"
              placeholder="08012345678"
              value={phone}
              maxLength={11}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div>
            <Label>Amount (₦)</Label>
            <Input
              className="mt-1"
              inputMode="numeric"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            />
            {amtNum > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                You'll be charged <span className="font-semibold text-foreground">{formatPrice(chargeAmount)}</span> (includes service fee)
              </p>
            )}
          </div>

          <Button onClick={handleBuy} disabled={submitting} className="w-full gradient-primary text-primary-foreground">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? "Processing..." : `Buy Airtime${amtNum > 0 ? ` — ${formatPrice(chargeAmount)}` : ""}`}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default BuyAirtime;
