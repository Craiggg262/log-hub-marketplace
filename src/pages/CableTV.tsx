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
  // Portal 2 plans (static from API function)
  const [portal2Plans, setPortal2Plans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setServiceId(""); setServices([]); setVerified(null); setPlanCode(""); setPortal2Plans([]);
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_services", portal, service_type: "tv" } })
      .then(({ data }) => setServices(data?.services || []));
  }, [portal]);

  // Portal 2: fetch plans when provider changes
  useEffect(() => {
    if (portal !== "2" || !serviceId) { setPortal2Plans([]); return; }
    setLoadingPlans(true);
    setPlanCode("");
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_cable_plans", portal, service_id: serviceId } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast({ title: "Failed to load plans", description: data?.error || error?.message, variant: "destructive" });
        } else {
          setPortal2Plans(data?.plans || []);
        }
      })
      .finally(() => setLoadingPlans(false));
  }, [serviceId, portal, toast]);

  const handleVerify = async () => {
    if (!serviceId || !smartcard) return toast({ title: "Fill provider & smartcard", variant: "destructive" });
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke("vtu-gateway", {
      body: { action: "verify_cabletv", portal, service_id: serviceId, phone: phone || "08000000000", smartcard_number: smartcard },
    });
    setVerifying(false);
    if (error || data?.error) return toast({ title: "Verification failed", description: data?.error || error?.message, variant: "destructive" });
    setVerified({ name: data.smartcard_name || "Verified", plans: data.cable_plans || [] });
  };

  const selectedPortal1Plan = verified?.plans.find((p: any) => String(p.plan_code ?? p.code) === planCode);
  const selectedPortal2Plan = portal2Plans.find((p) => String(p.plan_code) === planCode);
  const baseAmount = portal === "1"
    ? Number(selectedPortal1Plan?.amount || selectedPortal1Plan?.price || 0)
    : Number(selectedPortal2Plan?.amount || 0);
  const chargeAmount = Math.round(baseAmount * MARKUP * 100) / 100;

  const handleBuy = async () => {
    const svc = services.find((s) => String(s.service_id) === serviceId);
    if (!svc) return toast({ title: "Choose provider", variant: "destructive" });
    if (!smartcard) return toast({ title: "Enter smartcard number", variant: "destructive" });
    if (!/^0\d{10}$/.test(phone)) return toast({ title: "Invalid phone", variant: "destructive" });
    if (!planCode) return toast({ title: "Choose plan", variant: "destructive" });

    const body: any = {
      action: "buy_cabletv",
      portal,
      service_id: svc.service_id,
      provider_name: svc.network_name,
      smartcard_number: smartcard,
      phone,
      amount: baseAmount,
      plan_code: planCode,
    };
    if (portal === "1") {
      body.plan_name = selectedPortal1Plan?.plan_name ?? selectedPortal1Plan?.name;
    } else {
      body.plan_name = selectedPortal2Plan?.plan_name;
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
            <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setVerified(null); setPlanCode(""); }}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose decoder" /></SelectTrigger>
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
            <div>
              <Label>Plan</Label>
              <Select value={planCode} onValueChange={setPlanCode} disabled={!serviceId || loadingPlans}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingPlans ? "Loading plans..." : "Choose plan"} />
                </SelectTrigger>
                <SelectContent>
                  {portal2Plans.map((pl) => (
                    <SelectItem key={pl.plan_code} value={String(pl.plan_code)}>
                      {pl.plan_name} — ₦{Math.round(pl.amount * MARKUP).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {portal2Plans.length === 0 && serviceId && !loadingPlans && (
                <p className="text-xs text-muted-foreground mt-1">No plans available.</p>
              )}
            </div>
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
