// Proxy for reallysimplesocial.com Perfect-Panel API.
// Actions: services (list), balance, add (place order), status (single), sync (batch refresh + refund), list (user orders).
// Provider rates are NGN per 1000 — we display them x2 as the user markup.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const API_URL = "https://reallysimplesocial.com/api/v2";
const API_KEY = Deno.env.get("REALLYSIMPLESOCIAL_API_KEY") ?? "";
const MARKUP_MULTIPLIER = 2;

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

function normalizeStatus(s: string | undefined): string {
  if (!s) return "Pending";
  const v = String(s).toLowerCase();
  if (v.includes("cancel")) return "Cancelled";
  if (v.includes("partial")) return "Partial";
  if (v.includes("complet")) return "Completed";
  if (v.includes("progress") || v.includes("processing")) return "In progress";
  if (v.includes("pending")) return "Pending";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function refundUser(supabase: any, userId: string, amount: number, description: string) {
  if (amount <= 0) return;
  const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", userId).maybeSingle();
  const bal = Number(profile?.wallet_balance ?? 0);
  await supabase.from("profiles").update({ wallet_balance: bal + amount }).eq("user_id", userId);
  await supabase.from("wallet_transactions").insert({
    user_id: userId,
    amount,
    transaction_type: "refund",
    description,
  });
}

async function syncOrder(supabase: any, row: any) {
  const finalized = ["Completed", "Cancelled", "Partial"].includes(row.status);
  if (finalized && Number(row.refunded_amount ?? 0) > 0) return row;

  const { json: st } = await panel({ action: "status", order: row.provider_order });
  const newStatus = normalizeStatus(st?.status);
  const remains = st?.remains != null ? Number(st.remains) : row.remains;
  const startCount = st?.start_count != null ? Number(st.start_count) : row.start_count;

  const updates: any = { status: newStatus, remains, start_count: startCount };

  // Refund logic — only refund once (when refunded_amount is still 0)
  if (Number(row.refunded_amount ?? 0) === 0) {
    if (newStatus === "Cancelled") {
      const refund = Number(row.charge_amount);
      await refundUser(supabase, row.user_id, refund, `Boosting order #${row.provider_order} cancelled — full refund`);
      updates.refunded_amount = refund;
    } else if (newStatus === "Partial" && remains > 0) {
      const perUnit = Number(row.charge_amount) / Number(row.quantity);
      const refund = Math.round(perUnit * remains * 100) / 100;
      await refundUser(supabase, row.user_id, refund, `Boosting order #${row.provider_order} partial — refund for ${remains} undelivered`);
      updates.refunded_amount = refund;
    }
  }

  await supabase.from("boosting_orders").update(updates).eq("id", row.id);
  return { ...row, ...updates };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!API_KEY) return j({ success: false, error: "Boosting API not configured" }, 500);
    const body = await req.json();
    const { action, userId } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "services") {
      const { json: data } = await panel({ action: "services" });
      const services = Array.isArray(data) ? data : [];
      const withDisplay = services.map((s: any) => {
        const providerPer1k = Number(s.rate ?? 0);
        const displayNairaPer1k = providerPer1k * MARKUP_MULTIPLIER;
        return {
          service: String(s.service),
          name: s.name,
          category: s.category,
          type: s.type,
          min: Number(s.min ?? 0),
          max: Number(s.max ?? 0),
          rate_naira_per_1000: displayNairaPer1k,
          rate_display: nairaDisplay(displayNairaPer1k),
          average_time: s.average_time ?? s.avg_time ?? null,
        };
      });
      return j({ success: true, data: withDisplay });
    }

    if (action === "add") {
      const { service, link, quantity } = body;
      if (!service || !link || !quantity) return j({ success: false, error: "service, link, quantity required" }, 400);
      if (!userId) return j({ success: false, error: "Auth required" }, 401);

      const { json: svcData } = await panel({ action: "services" });
      const svc = Array.isArray(svcData) ? svcData.find((s: any) => String(s.service) === String(service)) : null;
      if (!svc) return j({ success: false, error: "Unknown service" }, 400);

      const providerPer1k = Number(svc.rate ?? 0);
      const chargeNaira = (providerPer1k * MARKUP_MULTIPLIER * Number(quantity)) / 1000;

      const { data: profile } = await supabase.from("profiles").select("wallet_balance").eq("user_id", userId).maybeSingle();
      const balance = Number(profile?.wallet_balance ?? 0);
      if (balance < chargeNaira) return j({ success: false, error: `Insufficient balance. Need ${nairaDisplay(chargeNaira)}` }, 402);

      const { json: orderRes, ok } = await panel({ action: "add", service, link, quantity });
      if (!ok || orderRes?.error) return j({ success: false, error: orderRes?.error || "Provider error" }, 502);

      await supabase.from("profiles").update({ wallet_balance: balance - chargeNaira }).eq("user_id", userId);
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: -chargeNaira,
        transaction_type: "purchase",
        description: `Boosting order #${orderRes?.order} • ${svc.name} × ${quantity}`,
      });

      await supabase.from("boosting_orders").insert({
        user_id: userId,
        provider_order: String(orderRes?.order),
        service_id: String(service),
        service_name: svc.name,
        link,
        quantity: Number(quantity),
        charge_amount: chargeNaira,
        status: "Pending",
        average_time: svc.average_time ?? svc.avg_time ?? null,
      });

      return j({ success: true, order: orderRes?.order, charged: chargeNaira });
    }

    if (action === "status") {
      const { order } = body;
      if (!order) return j({ success: false, error: "order required" }, 400);
      const { json: data } = await panel({ action: "status", order });
      return j({ success: true, data });
    }

    if (action === "list") {
      if (!userId) return j({ success: false, error: "Auth required" }, 401);
      const { data: rows } = await supabase
        .from("boosting_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      // Sync live status for non-finalized rows
      const synced: any[] = [];
      for (const r of rows ?? []) {
        try {
          const updated = await syncOrder(supabase, r);
          synced.push(updated);
        } catch (_e) {
          synced.push(r);
        }
      }
      return j({ success: true, data: synced });
    }

    return j({ success: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error("boosting-proxy error", e);
    return j({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
