import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NP_BASE = "https://api.nowpayments.io/v1";
const API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Conversion rate used across the platform
const USD_TO_NAIRA = 1390;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "createInvoice";
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (action === "currencies") {
      const res = await fetch(`${NP_BASE}/merchant/coins`, { headers: { "x-api-key": API_KEY } });
      const data = await res.json();
      return json({ success: true, currencies: data?.selectedCurrencies ?? [] });
    }

    if (action === "status") {
      const orderId = String(body.order_id ?? "");
      const { data } = await admin
        .from("crypto_payments")
        .select("*")
        .eq("order_id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      return json({ success: true, payment: data });
    }

    // createInvoice
    const amountNaira = Number(body.amount_naira ?? 0);
    if (!amountNaira || amountNaira < 1390) {
      return json({ error: "Minimum funding amount is ₦1,390 (about $1)" }, 400);
    }

    const amountUsd = Math.round((amountNaira / USD_TO_NAIRA) * 100) / 100;
    const orderId = `LHM-${user.id.slice(0, 8)}-${Date.now()}`;
    const origin = req.headers.get("origin") || "https://loghubmarketplace.site";

    const payload: Record<string, unknown> = {
      price_amount: amountUsd,
      price_currency: "usd",
      order_id: orderId,
      order_description: `Log Hub wallet funding - NGN ${amountNaira}`,
      ipn_callback_url: `${SUPABASE_URL}/functions/v1/nowpayments-webhook`,
      success_url: `${origin}/wallet?crypto=success`,
      cancel_url: `${origin}/wallet?crypto=cancelled`,
      is_fee_paid_by_user: true,
    };
    if (body.pay_currency) payload.pay_currency = String(body.pay_currency);

    const res = await fetch(`${NP_BASE}/invoice`, {
      method: "POST",
      headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const invoice = await res.json();
    if (!res.ok) {
      console.error("NOWPayments invoice error", res.status, JSON.stringify(invoice));
      return json({ error: invoice?.message || "Could not create crypto invoice" }, 400);
    }

    await admin.from("crypto_payments").insert({
      user_id: user.id,
      invoice_id: String(invoice.id ?? ""),
      order_id: orderId,
      amount_naira: amountNaira,
      amount_usd: amountUsd,
      pay_currency: invoice.pay_currency ?? null,
      status: "waiting",
      invoice_url: invoice.invoice_url ?? null,
      raw: invoice,
    });

    return json({
      success: true,
      order_id: orderId,
      invoice_url: invoice.invoice_url,
      amount_usd: amountUsd,
      amount_naira: amountNaira,
    });
  } catch (e) {
    console.error("nowpayments-create-invoice error", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
