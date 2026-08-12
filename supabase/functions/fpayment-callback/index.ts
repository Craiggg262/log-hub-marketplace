import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCHANT_ID = Deno.env.get("FPAYMENT_MERCHANT_ID") ?? "";
const API_KEY = Deno.env.get("FPAYMENT_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (params[k.toLowerCase()] = v));

    // FPayment documents GET callbacks, but accept POST bodies too
    if (req.method === "POST") {
      const raw = await req.text();
      try {
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) params[k.toLowerCase()] = String(v);
      } catch {
        new URLSearchParams(raw).forEach((v, k) => (params[k.toLowerCase()] = v));
      }
    }

    console.log("FPayment callback", JSON.stringify({ ...params, api_key: "***" }));

    if (params.merchant_id !== MERCHANT_ID || params.api_key !== API_KEY) {
      console.error("FPayment callback credential mismatch");
      return new Response(JSON.stringify({ status: "error", message: "Invalid Merchant ID or API Key." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestId = params.request_id ?? "";
    const status = (params.status ?? "").toLowerCase();

    const { data: record } = await admin
      .from("crypto_payments")
      .select("*")
      .eq("order_id", requestId)
      .maybeSingle();

    if (!record) {
      console.error("FPayment: unknown request_id", requestId);
      return new Response(JSON.stringify({ status: "success", message: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("crypto_payments")
      .update({
        status,
        payment_id: params.trans_id ?? record.payment_id,
        actually_paid: params.received ? Number(params.received) : record.actually_paid,
        raw: params,
      })
      .eq("id", record.id);

    if (status === "completed" && !record.credited) {
      const receivedUsd = Number(params.received ?? 0);
      const invoiceUsd = Number(record.amount_usd) || 0;
      let creditNaira = Number(record.amount_naira);
      if (receivedUsd > 0 && invoiceUsd > 0 && receivedUsd < invoiceUsd) {
        creditNaira = Math.floor((receivedUsd / invoiceUsd) * Number(record.amount_naira));
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
          description: "Crypto funding (USDT) via FPayment",
        });
        await admin.from("crypto_payments").update({ credited: true }).eq("id", record.id);
        console.log("✅ Credited FPayment funding", record.user_id, creditNaira);
      }
    }

    return new Response(JSON.stringify({ status: "success", message: "Callback has been processed successfully." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fpayment-callback error", e);
    return new Response(JSON.stringify({ status: "error", message: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
