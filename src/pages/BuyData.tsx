import React, { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";

const MARKUP = 1.2;

const NETWORK_COLORS: Record<string, string> = {
  MTN: "bg-yellow-400 text-black",
  AIRTEL: "bg-red-500 text-white",
  GLO: "bg-green-500 text-white",
  "9MOBILE": "bg-emerald-600 text-white",
};

const BuyData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refetchProfile } = useAuth() as any;

  const [portal, setPortal] = useState<"1" | "2">("1");
  const [services, setServices] = useState<any[]>([]);
  const [network, setNetwork] = useState<string>("");
  const [planType, setPlanType] = useState<string>("");
  const [plans, setPlans] = useState<any[]>([]);
  const [planCode, setPlanCode] = useState<string>("");
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"now" | "later">("now");

  useEffect(() => {
    setServices([]); setNetwork(""); setPlanType(""); setPlans([]); setPlanCode("");
    setLoadingServices(true);
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_services", portal, service_type: "data" } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast({ title: "Failed to load networks", description: data?.error || error?.message, variant: "destructive" });
        } else {
          setServices(data?.services || []);
        }
      })
      .finally(() => setLoadingServices(false));
  }, [portal, toast]);

  // Unique networks list (dedup by name).
  const networks = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string }[] = [];
    for (const s of services) {
      const n = String(s.network_name || "").toUpperCase();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      list.push({ name: n });
    }
    return list;
  }, [services]);

  // Portal 1: data-type chips for the picked network.
  const dataTypes = useMemo(() => {
    if (portal !== "1" || !network) return [] as { type: string; service_id: string | number }[];
    const seen = new Set<string>();
    const list: { type: string; service_id: string | number }[] = [];
    for (const s of services) {
      if (String(s.network_name || "").toUpperCase() !== network) continue;
      const t = String(s.plan_type || "").trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      list.push({ type: t, service_id: s.service_id });
    }
    return list;
  }, [services, network, portal]);

  const currentServiceId = useMemo(() => {
    if (portal === "1") {
      const match = dataTypes.find((d) => d.type === planType);
      return match?.service_id ?? "";
    }
    // Portal 2: static — service_id is the network row id
    const s = services.find((x) => String(x.network_name || "").toUpperCase() === network);
    return s?.service_id ?? "";
  }, [portal, dataTypes, planType, services, network]);

  useEffect(() => {
    if (!currentServiceId) { setPlans([]); setPlanCode(""); return; }
    setLoadingPlans(true);
    setPlanCode("");
    supabase.functions
      .invoke("vtu-gateway", { body: { action: "fetch_data_plans", portal, service_id: currentServiceId } })
      .then(({ data, error }) => {
        if (error || data?.error) {
          toast({ title: "Failed to load plans", description: data?.error || error?.message, variant: "destructive" });
        } else {
          setPlans(data?.plans || []);
        }
      })
      .finally(() => setLoadingPlans(false));
  }, [currentServiceId, portal, toast]);

  const selectedPlan = plans.find((p) => String(p.plan_code) === planCode);
  const baseAmount = Number(selectedPlan?.amount || 0);
  const chargeAmount = Math.round(baseAmount * MARKUP * 100) / 100;

  const handleBuy = async () => {
    if (mode === "later") {
      return toast({ title: "Scheduling coming soon", description: "Buy now is available. Scheduled runs are being wired up." });
    }
    if (!network) return toast({ title: "Choose network", variant: "destructive" });
    if (portal === "1" && !planType) return toast({ title: "Choose data type", variant: "destructive" });
    if (!selectedPlan) return toast({ title: "Choose a data plan", variant: "destructive" });
    if (!/^0\d{10}$/.test(phone)) return toast({ title: "Invalid phone number", variant: "destructive" });

    setSubmitting(true);
    const body: any = {
      action: "buy_data",
      portal,
      service_id: currentServiceId,
      network_name: network,
      phone_number: phone,
      amount: baseAmount,
      plan_code: selectedPlan.plan_code,
      plan_name: selectedPlan.plan_name,
    };
    const { data, error } = await supabase.functions.invoke("vtu-gateway", { body });
    setSubmitting(false);
    if (error || data?.error) {
      toast({ title: "Purchase failed", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Data delivered!", description: `${selectedPlan.plan_name} to ${phone}` });
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

        <Card className="p-5 bg-card border-border space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Select Portal</Label>
            <div className="mt-2"><PortalSelector value={portal} onChange={(v) => setPortal(v)} /></div>
          </div>

          <div>
            <Label>Select Network</Label>
            {loadingServices ? (
              <p className="text-sm text-muted-foreground mt-2">Loading networks...</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {networks.map((n) => {
                  const active = network === n.name;
                  return (
                    <button
                      key={n.name}
                      type="button"
                      onClick={() => { setNetwork(n.name); setPlanType(""); setPlanCode(""); }}
                      className={cn(
                        "rounded-xl border p-3 flex flex-col items-center gap-2 transition",
                        active ? "border-primary bg-primary/10" : "border-border bg-card/60"
                      )}
                    >
                      <span className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold",
                        NETWORK_COLORS[n.name] || "bg-muted text-foreground"
                      )}>
                        {n.name.slice(0, 2)}
                      </span>
                      <span className="text-xs">{n.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {portal === "1" && network && (
            <div>
              <Label>Select Data Type</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {dataTypes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No data types available for {network}.</p>
                )}
                {dataTypes.map((d) => {
                  const active = planType === d.type;
                  return (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() => { setPlanType(d.type); setPlanCode(""); }}
                      className={cn(
                        "px-4 py-2 rounded-full border text-sm transition",
                        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/60 text-muted-foreground"
                      )}
                    >
                      {d.type}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {(portal === "2" ? network : planType) && (
            <div>
              <Label>Data Plan</Label>
              <Select value={planCode} onValueChange={setPlanCode} disabled={loadingPlans}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingPlans ? "Loading plans..." : "Choose plan"} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((pl) => (
                    <SelectItem key={pl.plan_code} value={String(pl.plan_code)}>
                      {pl.plan_name}{pl.validity ? ` • ${pl.validity}` : ""} — ₦{Math.round(pl.amount * MARKUP).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {plans.length === 0 && !loadingPlans && (
                <p className="text-xs text-muted-foreground mt-1">No plans available.</p>
              )}
            </div>
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("now")}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm font-medium transition",
                mode === "now" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              )}
            >
              Buy now
            </button>
            <button
              type="button"
              onClick={() => setMode("later")}
              className={cn(
                "flex-1 py-2 rounded-lg border text-sm font-medium transition",
                mode === "later" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              )}
            >
              Schedule for later
            </button>
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
