import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CITRUS_BASE = "https://citrusmobile.com/api/v2/reseller";
const API_KEY = Deno.env.get("CITRUSSIM_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Pricing: USD -> NGN at 1390, plus a 30% markup
const USD_TO_NAIRA = 1390;
const MARKUP = 1.3;
// Citrus charges a flat provisioning fee per eSIM
const PROVISION_FEE_USD = 1.75;

function nairaPrice(usd: number) {
  return Math.ceil(usd * USD_TO_NAIRA * MARKUP);
}

async function citrus(path: string, method: "GET" | "POST", body?: unknown) {
  const res = await fetch(`${CITRUS_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "countries");

    // ---------- Catalogue ----------
    if (action === "countries") {
      const r = await citrus("/rates", "GET");
      if (!r.ok) return json({ error: r.json?.message || "Could not load eSIM countries" }, 400);
      const countries = (r.json?.countries ?? [])
        .filter((c: any) => c.has_data && c.cheapest_per_gb_usd)
        .map((c: any) => ({
          name: c.name,
          iso2: c.iso2,
          flag: c.flag,
          continent: c.continent,
          operator: c.cheapest_operator,
          per_gb_usd: c.cheapest_per_gb_usd,
          per_gb_naira: nairaPrice(c.cheapest_per_gb_usd),
          networks: (c.networks ?? []).map((n: any) => ({
            operator: n.operator,
            per_gb_usd: n.per_gb_usd,
            per_gb_naira: nairaPrice(n.per_gb_usd),
          })),
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      return json({
        success: true,
        countries,
        provision_fee_naira: nairaPrice(PROVISION_FEE_USD),
        rate: USD_TO_NAIRA,
      });
    }

    // ---------- Quote ----------
    if (action === "quote") {
      const perGbUsd = Number(body.per_gb_usd ?? 0);
      const gb = Number(body.data_gb ?? 0);
      if (!perGbUsd || !gb) return json({ error: "Invalid quote request" }, 400);
      const costUsd = perGbUsd * gb + PROVISION_FEE_USD;
      return json({ success: true, cost_usd: costUsd, price_naira: nairaPrice(costUsd) });
    }

    // ---------- My eSIMs ----------
    if (action === "myEsims") {
      const { data } = await admin
        .from("esim_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return json({ success: true, orders: data ?? [] });
    }

    if (action === "usage") {
      const iccid = String(body.iccid ?? "");
      if (!iccid) return json({ error: "ICCID required" }, 400);
      const { data: owned } = await admin
        .from("esim_orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("iccid", iccid)
        .maybeSingle();
      if (!owned) return json({ error: "eSIM not found" }, 404);
      const r = await citrus(`/esim/${iccid}`, "GET");
      if (!r.ok) return json({ error: r.json?.message || "Could not fetch eSIM" }, 400);
      return json({ success: true, esim: r.json });
    }

    // ---------- Purchase ----------
    if (action === "purchase" || action === "topup") {
      const gb = Number(body.data_gb ?? 0);
      const perGbUsd = Number(body.per_gb_usd ?? 0);
      const countryName = String(body.country_name ?? "");
      const iso2 = String(body.country_iso2 ?? "");
      const operator = body.operator ? String(body.operator) : null;
      const iccid = body.iccid ? String(body.iccid) : null;

      if (!gb || gb <= 0 || !perGbUsd) return json({ error: "Select a country and data amount" }, 400);
      if (action === "topup" && !iccid) return json({ error: "ICCID required for top up" }, 400);

      const dataUsd = perGbUsd * gb;
      const costUsd = action === "topup" ? dataUsd : dataUsd + PROVISION_FEE_USD;
      const priceNaira = nairaPrice(costUsd);

      // Live balance check
      const { data: profile } = await admin
        .from("profiles")
        .select("wallet_balance, is_banned")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return json({ error: "Profile not found" }, 404);
      if (profile.is_banned) return json({ error: "Account suspended" }, 403);
      if (Number(profile.wallet_balance) < priceNaira) {
        return json({ error: "Insufficient wallet balance. Please fund your wallet." }, 400);
      }

      let targetIccid = iccid;
      let provisioned: any = null;

      if (action === "purchase") {
        const p = await citrus("/esim/provision", "POST", {
          end_user_reference: user.id,
          label: `${countryName} - ${gb}GB`,
        });
        if (!p.ok) {
          console.error("Citrus provision failed", p.status, JSON.stringify(p.json));
          const msg = p.status === 402
            ? "eSIM provider balance is temporarily unavailable. Please try again later."
            : p.json?.message || "Could not provision eSIM";
          return json({ error: msg }, 400);
        }
        provisioned = p.json;
        targetIccid = provisioned.iccid;
      }

      // Fund the eSIM wallet with the data allowance
      const f = await citrus(`/esim/${targetIccid}/fund`, "POST", {
        amount: Math.round(dataUsd * 100) / 100,
      });
      if (!f.ok) {
        console.error("Citrus fund failed", f.status, JSON.stringify(f.json));
        return json({ error: f.json?.message || "Could not load data onto the eSIM" }, 400);
      }

      // Debit wallet
      const newBalance = Number(profile.wallet_balance) - priceNaira;
      await admin.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user.id);
      await admin.from("wallet_transactions").insert({
        user_id: user.id,
        amount: -priceNaira,
        transaction_type: "purchase",
        description: action === "topup"
          ? `eSIM top up - ${gb}GB (${targetIccid})`
          : `eSIM purchase - ${countryName} ${gb}GB`,
      });

      let order: any = null;
      if (action === "purchase") {
        const { data: inserted } = await admin
          .from("esim_orders")
          .insert({
            user_id: user.id,
            iccid: targetIccid,
            esim_id: provisioned?.id ?? null,
            country_name: countryName,
            country_iso2: iso2,
            data_gb: gb,
            operator,
            cost_usd: costUsd,
            charged_naira: priceNaira,
            status: "active",
            lpa_string: provisioned?.lpa_string ?? null,
            qr_code: provisioned?.qr_code ?? null,
            direct_install_url: provisioned?.direct_install_url ?? null,
            raw: { provisioned, funded: f.json },
          })
          .select()
          .single();
        order = inserted;
      } else {
        const { data: existing } = await admin
          .from("esim_orders")
          .select("*")
          .eq("user_id", user.id)
          .eq("iccid", targetIccid)
          .maybeSingle();
        if (existing) {
          const { data: updated } = await admin
            .from("esim_orders")
            .update({ data_gb: Number(existing.data_gb) + gb, charged_naira: Number(existing.charged_naira) + priceNaira })
            .eq("id", existing.id)
            .select()
            .single();
          order = updated;
        }
      }

      return json({ success: true, order, charged_naira: priceNaira, new_balance: newBalance });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("citrussim-esim error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
