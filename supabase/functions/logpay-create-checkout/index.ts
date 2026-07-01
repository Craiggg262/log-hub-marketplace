import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGPAY_BASE = "https://logpay.site";
const SECRET_KEY = Deno.env.get("LOGPAY_SECRET_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, amount, email, name, callbackUrl } = await req.json();

    if (!userId || !amount || !email) {
      return json({ success: false, error: "userId, amount and email are required" }, 400);
    }
    if (!SECRET_KEY) {
      return json({ success: false, error: "LogPay is not configured" }, 500);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const res = await fetch(`${LOGPAY_BASE}/api/public/v1/checkout-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        customer_email: email,
        customer_name: name || email.split("@")[0],
        customer_identifier: userId,
        callback_url: callbackUrl || "",
        payment_channels: ["transfer", "card", "bank", "ussd"],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("LogPay create session failed", res.status, data);
      return json({ success: false, error: (data && (data.message || data.error)) || "LogPay error" }, 502);
    }

    // Persist the pending reference so the webhook can attribute it if
    // customer_identifier is not echoed back.
    if (data?.reference) {
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: 0,
        transaction_type: "pending_topup",
        description: `LogPay pending ${data.reference}`,
      });
    }

    return json({ success: true, data });
  } catch (e) {
    console.error("logpay-create-checkout error", e);
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
