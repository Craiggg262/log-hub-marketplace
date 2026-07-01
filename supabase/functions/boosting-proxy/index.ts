// Proxy for reallysimplesocial.com Perfect-Panel API.
// Actions: services (list), balance, add (place order), status (single/multi).
// Adds a 2x markup for prices shown to end users.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_URL = "https://reallysimplesocial.com/api/v2";
const API_KEY = Deno.env.get("REALLYSIMPLESOCIAL_API_KEY") ?? "";
const NAIRA_PER_DOLLAR = 1400; // markup base — matches SMS pricing
const MARKUP_MULTIPLIER = 2;    // display price is 2x provider price

async function panel(payload: Record<string, string | number>) {
  const form = new URLSearchParams();
  form.set("key", API_KEY);
  for (const [k, v] of Object.entries(payload)) form.set(k, String(v));
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

const nairaDisplay = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!API_KEY) return json({ success: false, error: "Boosting API not configured" }, 500);
    const body = await req.json();
    const { action, userId } = body;

    if (action === "services") {
      const { json: data } = await panel({ action: "services" });
      const services = Array.isArray(data) ? data : [];
      const withDisplay = services.map((s: any) => {
        const providerPer1k = Number(s.rate ?? 0); // USD per 1000
        const displayNairaPer1k = providerPer1k * NAIRA_PER_DOLLAR * MARKUP_MULTIPLIER;
        return {
          service: String(s.service),
          name: s.name,
          category: s.category,
          type: s.type,
          min: Number(s.min ?? 0),
          max: Number(s.max ?? 0),
          rate_naira_per_1000: displayNairaPer1k,
          rate_display: nairaDisplay(displayNairaPer1k),
        };
      });
      return json({ success: true, data: withDisplay });
    }

    if (action === "add") {
      const { service, link, quantity } = body;
      if (!service || !link || !quantity) return json({ success: false, error: "service, link, quantity required" }, 400);
      if (!userId) return json({ success: false, error: "Auth required" }, 401);

      // Compute charge based on markup
      const { json: svcData } = await panel({ action: "services" });
      const svc = Array.isArray(svcData) ? svcData.find((s: any) => String(s.service) === String(service)) : null;
      if (!svc) return json({ success: false, error: "Unknown service" }, 400);

      const providerPer1k = Number(svc.rate ?? 0);
      const chargeNaira = (providerPer1k * NAIRA_PER_DOLLAR * MARKUP_MULTIPLIER * Number(quantity)) / 1000;

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", userId).maybeSingle();
      const balance = Number(profile?.wallet_balance ?? 0);
      if (balance < chargeNaira) return json({ success: false, error: `Insufficient balance. Need ${nairaDisplay(chargeNaira)}` }, 402);

      // Place order at provider
      const { json: orderRes, ok } = await panel({ action: "add", service, link, quantity });
      if (!ok || orderRes?.error) return json({ success: false, error: orderRes?.error || "Provider error" }, 502);

      // Debit wallet
      await supabase.from("profiles").update({ wallet_balance: balance - chargeNaira }).eq("user_id", userId);
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: -chargeNaira,
        transaction_type: "purchase",
        description: `Boosting order #${orderRes?.order} • ${svc.name} × ${quantity}`,
      });

      return json({ success: true, order: orderRes?.order, charged: chargeNaira });
    }

    if (action === "status") {
      const { order } = body;
      if (!order) return json({ success: false, error: "order required" }, 400);
      const { json: data } = await panel({ action: "status", order });
      return json({ success: true, data });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error("boosting-proxy error", e);
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
