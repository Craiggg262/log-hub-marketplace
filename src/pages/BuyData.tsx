import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, Loader2 } from "lucide-react";
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

const BuyData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refetchProfile } = useAuth() as any;

  const [portal, setPortal] = useState<"1" | "2">("1");
  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [plans, setPlans] = useState<any[]>([]);
  const [planCode, setPlanCode] = useState<string>("");
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Portal 2 manual bundle
  const [bundleId, setBundleId] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setServiceId(""); setPlanCode(""); setPlans([]); setBundleId(""); setManualAmount("");
    setServices([]);
    setLoadingServices(true);
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_services", portal, service_type: portal === "1" ? "data" : "data" } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast({ title: "Failed to load networks", description: data?.error || error?.message, variant: "destructive" });
        } else {
          setServices(data?.services || []);
        }
      })
      .finally(() => setLoadingServices(false));
  }, [portal, toast]);

  useEffect(() => {
    if (!serviceId || portal !== "1") { setPlans([]); return; }
    setLoadingPlans(true);
    setPlanCode("");
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_data_plans", portal, service_id: serviceId } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast({ title: "Failed to load plans", description: data?.error || error?.message, variant: "destructive" });
        } else {
          setPlans(data?.plans || []);
        }
      })
      .finally(() => setLoadingPlans(false));
  }, [serviceId, portal, toast]);

  const svc = services.find((s) => String(s.service_id) === serviceId);
  const selectedPlan = plans.find((p) => String(p.plan_code) === planCode);

  const baseAmount = portal === "1"
    ? Number(selectedPlan?.amount || 0)
    : Number(manualAmount) || 0;
  const chargeAmount = Math.round(baseAmount * MARKUP * 100) / 100;

  const handleBuy = async () => {
    if (!svc) return toast({ title: "Choose network", variant: "destructive" });
    if (!/^0\d{10}$/.test(phone)) return toast({ title: "Invalid phone number", variant: "destructive" });

    if (portal === "1") {
      if (!selectedPlan) return toast({ title: "Choose a data plan", variant: "destructive" });
    } else {
      if (!bundleId) return toast({ title: "Enter bundle ID", variant: "destructive" });
      if (baseAmount < 50) return toast({ title: "Enter valid amount", variant: "destructive" });
    }

    setSubmitting(true);
    const body: any = {
      action: "buy_data",
      portal,
      service_id: svc.service_id,
      network_name: svc.network_name,
      phone_number: phone,
    };
    if (portal === "1") {
      body.amount = baseAmount;
      body.plan_code = selectedPlan.plan_code;
      body.plan_name = selectedPlan.plan_name;
    } else {
      body.amount = baseAmount;
      body.bundle_id = bundleId;
    }
    const { data, error } = await supabase.functions.invoke("vtu-gateway", { body });
    setSubmitting(false);
    if (error || data?.error) {
      toast({ title: "Purchase failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Data delivered!", description: `${selectedPlan?.plan_name || `Bundle #${bundleId}`} to ${phone}` });
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
            <Wifi className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Buy Data</h1>
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
            <Label>Network</Label>
            <Select value={serviceId} onValueChange={setServiceId} disabled={loadingServices}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={loadingServices ? "Loading..." : "Choose network"} />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.service_id} value={String(s.service_id)}>
                    {s.network_name} {s.provider ? `(${s.provider})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {portal === "1" ? (
            <div>
              <Label>Data Plan</Label>
              <Select value={planCode} onValueChange={setPlanCode} disabled={!serviceId || loadingPlans}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingPlans ? "Loading plans..." : "Choose plan"} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((pl) => (
                    <SelectItem key={pl.plan_code} value={String(pl.plan_code)}>
                      {pl.plan_name} {pl.validity ? `• ${pl.validity}` : ""} — ₦{Math.round(pl.amount * MARKUP).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plans.length === 0 && serviceId && !loadingPlans && (
                <p className="text-xs text-muted-foreground mt-1">No plans available for this network.</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <Label>Bundle ID</Label>
                <Input
                  className="mt-1"
                  inputMode="numeric"
                  placeholder="e.g. 12"
                  value={bundleId}
                  onChange={(e) => setBundleId(e.target.value.replace(/\D/g, ""))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Find bundle IDs at{" "}
                  <a href="https://www.cheapdatahub.ng/api/plan-ids/" target="_blank" rel="noreferrer" className="text-primary underline">
                    cheapdatahub.ng/api/plan-ids
                  </a>
                </p>
              </div>
              <div>
                <Label>Base Amount (₦)</Label>
                <Input
                  className="mt-1"
                  inputMode="numeric"
                  placeholder="Provider cost of that bundle"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </>
          )}

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

          {baseAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Total charge: <span className="font-semibold text-foreground">₦{chargeAmount.toLocaleString()}</span>
            </p>
          )}

          <Button onClick={handleBuy} disabled={submitting} className="w-full gradient-primary text-primary-foreground">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? "Processing..." : `Buy Data${baseAmount > 0 ? ` — ₦${chargeAmount.toLocaleString()}` : ""}`}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default BuyData;
