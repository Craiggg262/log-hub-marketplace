import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payscribe-signature",
};

const WEBHOOK_SECRET = Deno.env.get("PAYSCRIBE_WEBHOOK_SECRET") ?? "";

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rawBody = await req.text();
    const signature = req.headers.get("x-payscribe-signature") || req.headers.get("X-Payscribe-Signature") || "";

    if (WEBHOOK_SECRET) {
      const expected = await hmacSha256Hex(WEBHOOK_SECRET, rawBody);
      if (signature.toLowerCase() !== expected.toLowerCase()) {
        console.error("Payscribe webhook signature mismatch", { got: signature, expected });
        return new Response(JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const body = JSON.parse(rawBody);
    console.log("Payscribe webhook:", JSON.stringify(body));

    const eventType: string = body.event_type || "";
    // Only credit for completed payments
    if (!eventType.includes("payment")) {
      return new Response(JSON.stringify({ message: "Ignored event", eventType }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const transId: string = body.trans_id || body.event_id || `PSC_${Date.now()}`;
    const amount: number = Number(body.amount || 0);
    const accountNumber: string = body.customer?.number || body.account?.number || "";

    if (!accountNumber || !amount) {
      console.warn("Missing account or amount", { accountNumber, amount });
      return new Response(JSON.stringify({ message: "Missing data, ignored" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, email, wallet_balance")
      .eq("payscribe_account_number", accountNumber)
      .single();

    if (profileError || !profile) {
      console.error("User not found for Payscribe account:", accountNumber);
      return new Response(JSON.stringify({ error: "User not found", accountNumber }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const description = `Payscribe deposit - Ref: ${transId}`;
    const { data: existing } = await supabase
      .from("wallet_transactions").select("id").eq("description", description).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ message: "Already processed", reference: transId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: txError } = await supabase.from("wallet_transactions").insert({
      user_id: profile.user_id,
      amount,
      transaction_type: "deposit",
      description,
    });
    if (txError) {
      return new Response(JSON.stringify({ error: "Transaction insert failed", details: txError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const newBalance = Number(profile.wallet_balance || 0) + amount;
    const { error: updErr } = await supabase
      .from("profiles").update({ wallet_balance: newBalance }).eq("user_id", profile.user_id);
    if (updErr) {
      return new Response(JSON.stringify({ error: "Balance update failed", details: updErr }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`✅ Payscribe deposit for ${profile.email}: ₦${amount}. New balance: ₦${newBalance}`);
    return new Response(JSON.stringify({ success: true, newBalance }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("Payscribe webhook error:", e);
    return new Response(JSON.stringify({ error: "Internal error", message: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
