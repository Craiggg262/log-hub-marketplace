import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-logpay-signature",
};

const WEBHOOK_SECRET = Deno.env.get("LOGPAY_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const raw = await req.text();
    const sig = req.headers.get("x-logpay-signature") || req.headers.get("X-LogPay-Signature") || "";

    if (WEBHOOK_SECRET) {
      const expected = createHmac("sha512", WEBHOOK_SECRET).update(raw).digest("hex");
      if (!sig || sig.toLowerCase() !== expected.toLowerCase()) {
        console.warn("LogPay: invalid signature", { got: sig?.slice(0, 12), exp: expected.slice(0, 12) });
        return new Response("invalid signature", { status: 401, headers: corsHeaders });
      }
    }

    const event = JSON.parse(raw);
    console.log("LogPay webhook event", event?.event, event?.data?.reference);

    if (event?.event !== "transaction.success") {
      return new Response("ignored", { status: 200, headers: corsHeaders });
    }

    const d = event.data || {};
    const reference: string = d.reference || d.provider_reference || "";
    const userId: string | undefined = d.customer_identifier || undefined;
    const email: string | undefined = d.customer_email || undefined;
    const amount = Number(d.net_amount ?? d.amount ?? 0);

    if (!amount || amount <= 0) return new Response("no amount", { status: 200, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Idempotency: skip if a wallet_transactions row for this reference already exists
    const { data: existing } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("transaction_type", "deposit")
      .ilike("description", `%${reference}%`)
      .maybeSingle();
    if (existing) {
      return new Response("already credited", { status: 200, headers: corsHeaders });
    }

    // Resolve the user
    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data: p } = await supabase.from("profiles").select("user_id").eq("email", email).maybeSingle();
      targetUserId = p?.user_id;
    }
    if (!targetUserId) return new Response("no user", { status: 200, headers: corsHeaders });

    const { data: profile } = await supabase
      .from("profiles").select("wallet_balance").eq("user_id", targetUserId).maybeSingle();
    const currentBalance = Number(profile?.wallet_balance ?? 0);

    await supabase.from("profiles").update({
      wallet_balance: currentBalance + amount,
    }).eq("user_id", targetUserId);

    await supabase.from("wallet_transactions").insert({
      user_id: targetUserId,
      amount,
      transaction_type: "deposit",
      description: `LogPay funding (${reference})`,
    });

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("logpay-webhook error", e);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
