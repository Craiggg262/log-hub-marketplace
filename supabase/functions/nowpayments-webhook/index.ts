import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nowpayments-sig",
};

const IPN_SECRET = Deno.env.get("NOWPAYMENTS_IPN_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Deterministic, key-sorted JSON exactly like NOWPayments' signature spec
function sortedStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(sortedStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${sortedStringify((value as any)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

async function hmacSha512Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-nowpayments-sig") ?? "";
    const payload = JSON.parse(rawBody || "{}");

    const expected = await hmacSha512Hex(IPN_SECRET, sortedStringify(payload));
    if (!signature || signature.toLowerCase() !== expected.toLowerCase()) {
      console.error("NOWPayments IPN signature mismatch", { signature });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = String(payload.order_id ?? "");
    const status = String(payload.payment_status ?? "");
    console.log("NOWPayments IPN", orderId, status);

    const { data: record } = await admin
      .from("crypto_payments")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!record) {
      console.error("Unknown crypto order", orderId);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("crypto_payments")
      .update({
        status,
        payment_id: String(payload.payment_id ?? record.payment_id ?? ""),
        pay_currency: payload.pay_currency ?? record.pay_currency,
        actually_paid: payload.actually_paid ?? record.actually_paid,
        raw: payload,
      })
      .eq("id", record.id);

    const shouldCredit = (status === "finished" || status === "partially_paid") && !record.credited;

    if (shouldCredit) {
      // Credit proportionally to what was actually received (capped at the invoice amount)
      const priceAmount = Number(payload.price_amount ?? record.amount_usd) || Number(record.amount_usd);
      const paidUsd = Number(payload.outcome_amount ?? payload.pay_amount ?? 0);
      let creditNaira = Number(record.amount_naira);
      if (status === "partially_paid" && paidUsd > 0 && priceAmount > 0) {
        creditNaira = Math.floor((paidUsd / priceAmount) * Number(record.amount_naira));
      }
      if (creditNaira > 0) {
        const { data: profile } = await admin
          .from("profiles")
          .select("wallet_balance")
          .eq("user_id", record.user_id)
          .maybeSingle();

        const newBalance = Number(profile?.wallet_balance ?? 0) + creditNaira;

        await admin.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", record.user_id);
        await admin.from("wallet_transactions").insert({
          user_id: record.user_id,
          amount: creditNaira,
          transaction_type: "deposit",
          description: `Crypto funding (${String(payload.pay_currency ?? "crypto").toUpperCase()}) via NOWPayments`,
        });
        await admin.from("crypto_payments").update({ credited: true }).eq("id", record.id);
        console.log("Credited crypto funding", record.user_id, creditNaira);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nowpayments-webhook error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
