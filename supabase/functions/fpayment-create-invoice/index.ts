import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FP_BASE = "https://app.fpayment.net/api";
const MERCHANT_ID = Deno.env.get("FPAYMENT_MERCHANT_ID") ?? "";
const API_KEY = Deno.env.get("FPAYMENT_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const USD_TO_NAIRA = 1390;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Please sign in to fund your wallet" }, 401);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Please sign in to fund your wallet" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "createInvoice");

    if (action === "status") {
      const orderId = String(body.order_id ?? "");
      const { data: record } = await admin
        .from("crypto_payments")
        .select("*")
        .eq("order_id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!record) return json({ error: "Payment not found" }, 404);

      const form = new URLSearchParams({
        merchant_id: MERCHANT_ID,
        api_key: API_KEY,
        trans_id: String(record.payment_id ?? ""),
      });
      const res = await fetch(`${FP_BASE}/GetInvoiceStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      const out = await res.json().catch(() => ({}));
      return json({ success: true, payment: record, remote: out });
    }

    // createInvoice
    const amountNaira = Number(body.amount_naira ?? 0);
    if (!amountNaira || amountNaira < USD_TO_NAIRA) {
      return json({ error: "Minimum funding amount is ₦1,390 (about $1)" }, 400);
    }
    if (!MERCHANT_ID || !API_KEY) {
      return json({ error: "Crypto payments are not configured. Please contact support." }, 500);
    }

    const amountUsd = Math.round((amountNaira / USD_TO_NAIRA) * 100) / 100;
    const orderId = `FPY-${user.id.slice(0, 8)}-${Date.now()}`;
    const origin = req.headers.get("origin") || "https://loghubmarketplace.site";
    const returnBase = origin.includes("http") ? origin : "https://loghubmarketplace.site";

    const form = new URLSearchParams({
      merchant_id: MERCHANT_ID,
      api_key: API_KEY,
      name: "Log Hub wallet funding",
      description: user.email ?? user.id,
      amount: String(amountUsd),
      request_id: orderId,
      callback_url: `${SUPABASE_URL}/functions/v1/fpayment-callback`,
      success_url: `${returnBase}/wallet?crypto=success`,
      cancel_url: `${returnBase}/wallet?crypto=cancelled`,
    });

    const res = await fetch(`${FP_BASE}/AddInvoice`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const out = await res.json().catch(() => ({}));
    console.log("FPayment AddInvoice", res.status, JSON.stringify(out));

    if (!res.ok || out?.status !== "success" || !out?.data?.url_payment) {
      return json({ error: out?.msg || "Could not create crypto invoice" }, 400);
    }

    await admin.from("crypto_payments").insert({
      user_id: user.id,
      provider: "fpayment",
      invoice_id: String(out.data.trans_id ?? ""),
      payment_id: String(out.data.trans_id ?? ""),
      order_id: orderId,
      amount_naira: amountNaira,
      amount_usd: Number(out.data.amount ?? amountUsd),
      pay_currency: "USDT",
      status: String(out.data.status ?? "waiting"),
      invoice_url: out.data.url_payment,
      raw: out,
    });

    return json({
      success: true,
      order_id: orderId,
      invoice_url: out.data.url_payment,
      amount_usd: Number(out.data.amount ?? amountUsd),
      amount_naira: amountNaira,
    });
  } catch (e) {
    console.error("fpayment-create-invoice error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
