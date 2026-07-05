import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortalSelector } from "@/components/vtu/PortalSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const MARKUP = 1.2;

const PayElectricity = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refetchProfile } = useAuth() as any;

  const [portal, setPortal] = useState<"1" | "2">("1");
  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [meterNo, setMeterNo] = useState("");
  const [meterType, setMeterType] = useState("prepaid");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [meterName, setMeterName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setServiceId(""); setServices([]); setMeterName(null);
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_services", portal, service_type: "electricity" } })
      .then(({ data }) => setServices(data?.services || []));
  }, [portal]);

  const svc = services.find((s) => String(s.service_id) === serviceId);
  // Derive disco slug from name (used for Portal 1)
  const discoSlug = (svc?.network_name || "").toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");

  const handleVerify = async () => {
    if (portal !== "1") { toast({ title: "Verify not available on Portal 2 — proceed with purchase" }); return; }
    if (!svc || !meterNo) return toast({ title: "Fill disco & meter no", variant: "destructive" });
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("vtu-gateway", {
      body: { action: "verify_electricity", portal, service_id: svc.service_id, meter_no: meterNo, disco: discoSlug },
    });
    setVerifying(false);
    if (error || data?.error) return toast({ title: "Verification failed", description: data?.error || error?.message, variant: "destructive" });
    setMeterName(data.meter_name || "Verified");
  };

  const amtNum = Number(amount) || 0;
  const chargeAmount = Math.round(amtNum * MARKUP * 100) / 100;

  const handleBuy = async () => {
    if (!svc) return toast({ title: "Choose disco", variant: "destructive" });
    if (!meterNo) return toast({ title: "Enter meter number", variant: "destructive" });
    if (!/^0\d{10}$/.test(phone)) return toast({ title: "Invalid phone", variant: "destructive" });
    if (amtNum < 100) return toast({ title: "Minimum ₦100", variant: "destructive" });

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("vtu-gateway", {
      body: {
        action: "buy_electricity",
        portal,
        service_id: svc.service_id,
        meter_no: meterNo,
        meter_type: meterType,
        disco: discoSlug,
        amount: amtNum,
        phone_number: phone,
      },
    });
    setSubmitting(false);
    if (error || data?.error) return toast({ title: "Purchase failed", description: data?.error || error?.message, variant: "destructive" });
    const token = data?.response?.data?.token || data?.response?.data?.data?.token;
    toast({ title: "Purchase successful", description: token ? `Token: ${token}` : "Check your orders for the token" });
    refetchProfile?.();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Pay Electricity</h1>
          </div>
        </div>

        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground mb-2">Wallet Balance</p>
          <p className="text-2xl font-bold text-primary">
            ₦{Number(profile?.wallet_balance || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
        </Card>

        <Card className="p-5 bg-card border-border space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Select Portal</Label>
            <div className="mt-2"><PortalSelector value={portal} onChange={setPortal} /></div>
          </div>

          <div>
            <Label>DISCO</Label>
            <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setMeterName(null); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose distributor" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.service_id} value={String(s.service_id)}>{s.network_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Meter Type</Label>
              <Select value={meterType} onValueChange={setMeterType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepaid">Prepaid</SelectItem>
                  <SelectItem value="postpaid">Postpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (₦)</Label>
              <Input className="mt-1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="1000" />
            </div>
          </div>

          <div>
            <Label>Meter Number</Label>
            <Input className="mt-1" value={meterNo} onChange={(e) => setMeterNo(e.target.value.replace(/\D/g, ""))} placeholder="12345678901" />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input className="mt-1" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="08012345678" />
          </div>

          {portal === "1" && (
            <Button variant="outline" onClick={handleVerify} disabled={verifying || !serviceId || !meterNo} className="w-full">
              {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {meterName ? `Verified: ${meterName}` : "Verify Meter"}
            </Button>
          )}

          {amtNum > 0 && (
            <p className="text-xs text-muted-foreground">
              Total charge: <span className="font-semibold text-foreground">₦{chargeAmount.toLocaleString()}</span>
            </p>
          )}

          <Button onClick={handleBuy} disabled={submitting} className="w-full gradient-primary text-primary-foreground">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? "Processing..." : `Buy Token${amtNum > 0 ? ` — ₦${chargeAmount.toLocaleString()}` : ""}`}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PayElectricity;
