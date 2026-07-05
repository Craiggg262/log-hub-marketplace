import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tv, Loader2, CheckCircle2 } from "lucide-react";
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

const CableTV = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refetchProfile } = useAuth() as any;

  const [portal, setPortal] = useState<"1" | "2">("1");
  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [smartcard, setSmartcard] = useState("");
  const [phone, setPhone] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<{ name: string; plans: any[] } | null>(null);
  const [planCode, setPlanCode] = useState("");
  const [manualPlanId, setManualPlanId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setServiceId(""); setServices([]); setVerified(null); setPlanCode("");
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_services", portal, service_type: "tv" } })
      .then(({ data }) => setServices(data?.services || []));
  }, [portal]);

  const handleVerify = async () => {
    if (portal !== "1") {
      toast({ title: "Portal 2 has no verify — enter plan ID & amount manually" });
      return;
    }
    if (!serviceId || !smartcard) return toast({ title: "Fill provider & smartcard", variant: "destructive" });
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("vtu-gateway", {
      body: { action: "verify_cabletv", portal, service_id: serviceId, phone: phone || "08000000000", smartcard_number: smartcard },
    });
    setVerifying(false);
    if (error || data?.error) return toast({ title: "Verification failed", description: data?.error || error?.message, variant: "destructive" });
    setVerified({ name: data.smartcard_name || "Verified", plans: data.cable_plans || [] });
  };

  const selectedPlan = verified?.plans.find((p: any) => String(p.plan_code ?? p.code) === planCode);
  const baseAmount = portal === "1"
    ? Number(selectedPlan?.amount || selectedPlan?.price || 0)
    : Number(manualAmount) || 0;
  const chargeAmount = Math.round(baseAmount * MARKUP * 100) / 100;

  const handleBuy = async () => {
    const svc = services.find((s) => String(s.service_id) === serviceId);
    if (!svc) return toast({ title: "Choose provider", variant: "destructive" });
    if (!smartcard) return toast({ title: "Enter smartcard", variant: "destructive" });
    if (!/^0\d{10}$/.test(phone)) return toast({ title: "Invalid phone", variant: "destructive" });

    const body: any = {
      action: "buy_cabletv",
      portal,
      service_id: svc.service_id,
      provider_name: svc.network_name,
      smartcard_number: smartcard,
      phone,
      amount: baseAmount,
    };
    if (portal === "1") {
      if (!selectedPlan) return toast({ title: "Choose plan", variant: "destructive" });
      body.plan_code = selectedPlan.plan_code ?? selectedPlan.code;
      body.plan_name = selectedPlan.plan_name ?? selectedPlan.name;
    } else {
      if (!manualPlanId || baseAmount < 50) return toast({ title: "Enter plan ID and amount", variant: "destructive" });
      body.plan_code = manualPlanId;
      body.plan_name = `Plan #${manualPlanId}`;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("vtu-gateway", { body });
    setSubmitting(false);
    if (error || data?.error) return toast({ title: "Purchase failed", description: data?.error || error?.message, variant: "destructive" });
    toast({ title: "Subscription successful" });
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
            <Tv className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Cable TV</h1>
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
            <Label>Provider</Label>
            <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setVerified(null); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose provider" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.service_id} value={String(s.service_id)}>{s.network_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Smartcard / IUC Number</Label>
            <Input className="mt-1" value={smartcard} onChange={(e) => setSmartcard(e.target.value.replace(/\D/g, ""))} placeholder="1234567890" />
          </div>

          <div>
            <Label>Phone Number</Label>
            <Input className="mt-1" maxLength={11} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="08012345678" />
          </div>

          {portal === "1" ? (
            <>
              <Button variant="outline" onClick={handleVerify} disabled={verifying || !serviceId || !smartcard} className="w-full">
                {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {verified ? `Verified: ${verified.name}` : "Verify Smartcard"}
              </Button>
              {verified && (
                <div>
                  <Label>Plan</Label>
                  <Select value={planCode} onValueChange={setPlanCode}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choose plan" /></SelectTrigger>
                    <SelectContent>
                      {verified.plans.map((pl: any, i: number) => {
                        const code = String(pl.plan_code ?? pl.code ?? i);
                        const price = Number(pl.amount ?? pl.price ?? 0);
                        return (
                          <SelectItem key={code} value={code}>
                            {pl.plan_name ?? pl.name} — ₦{Math.round(price * MARKUP).toLocaleString()}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <Label>Plan ID</Label>
                <Input className="mt-1" inputMode="numeric" value={manualPlanId} onChange={(e) => setManualPlanId(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 15" />
              </div>
              <div>
                <Label>Base Amount (₦)</Label>
                <Input className="mt-1" inputMode="numeric" value={manualAmount} onChange={(e) => setManualAmount(e.target.value.replace(/\D/g, ""))} placeholder="Provider cost of plan" />
              </div>
            </>
          )}

          {baseAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Total charge: <span className="font-semibold text-foreground">₦{chargeAmount.toLocaleString()}</span>
            </p>
          )}

          <Button onClick={handleBuy} disabled={submitting} className="w-full gradient-primary text-primary-foreground">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? "Processing..." : `Subscribe${baseAmount > 0 ? ` — ₦${chargeAmount.toLocaleString()}` : ""}`}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CableTV;
