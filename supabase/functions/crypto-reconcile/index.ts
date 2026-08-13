import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FP_MERCHANT = Deno.env.get("FPAYMENT_MERCHANT_ID") ?? "";
const FP_KEY = Deno.env.get("FPAYMENT_API_KEY") ?? "";
const NP_KEY = Deno.env.get("NOWPAYMENTS_API_KEY") ?? "";

const PAID_STATES = ["completed", "complete", "finished", "confirmed", "paid", "success", "successful"];
const PARTIAL_STATES = ["partially_paid", "partial"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
async function creditWallet(admin: any, record: any, receivedUsd: number, providerLabel: string) {
  const invoiceUsd = Number(record.amount_usd) || 0;
  let creditNaira = Number(record.amount_naira) || 0;

  // Credit proportionally when the user underpaid the invoice
  if (receivedUsd > 0 && invoiceUsd > 0 && receivedUsd < invoiceUsd * 0.995) {
    creditNaira = Math.floor((receivedUsd / invoiceUsd) * Number(record.amount_naira));
  }
  if (creditNaira <= 0) return 0;

  // Atomic-ish guard: only the first update that flips credited=false -> true wins
  const { data: claimed } = await admin
    .from("crypto_payments")
    .update({ credited: true })
    .eq("id", record.id)
    .eq("credited", false)
    .select("id")
    .maybeSingle();
  if (!claimed) return 0;

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
    description: `Crypto funding via ${providerLabel}`,
  });
  console.log("✅ credited", providerLabel, record.user_id, creditNaira);
  return creditNaira;
}

// deno-lint-ignore no-explicit-any
async function checkFpayment(record: any) {
  const form = new URLSearchParams({
    merchant_id: FP_MERCHANT,
    api_key: FP_KEY,
    trans_id: String(record.payment_id ?? record.invoice_id ?? ""),
  });
  const res = await fetch("https://app.fpayment.net/api/GetInvoiceStatus", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const out = await res.json().catch(() => ({}));
  const d = out?.data ?? out ?? {};
  const status = String(d.status ?? out?.status ?? "").toLowerCase();
  const received = Number(d.received ?? d.amount_received ?? 0);
  return { status, received, raw: out };
}

// deno-lint-ignore no-explicit-any
async function checkNowpayments(record: any) {
  const res = await fetch(
    `https://api.nowpayments.io/v1/payment/?invoiceId=${encodeURIComponent(String(record.invoice_id ?? ""))}&limit=10`,
    { headers: { "x-api-key": NP_KEY } },
  );
  const out = await res.json().catch(() => ({}));
  const payments: any[] = out?.data ?? [];
  let status = "";
  let received = 0;
  for (const p of payments) {
    const s = String(p.payment_status ?? "").toLowerCase();
    if (PAID_STATES.includes(s)) {
      status = "completed";
      received = Number(p.price_amount ?? record.amount_usd ?? 0);
      break;
    }
    if (PARTIAL_STATES.includes(s)) {
      status = "partially_paid";
      received = Number(p.actually_paid_at_fiat ?? p.outcome_amount ?? 0);
    } else if (!status) {
      status = s;
    }
  }
  return { status, received, raw: out };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const orderId = body.order_id ? String(body.order_id) : null;
    const userId = body.user_id ? String(body.user_id) : null;

    let query = admin
      .from("crypto_payments")
      .select("*")
      .eq("credited", false)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50);

    if (orderId) query = admin.from("crypto_payments").select("*").eq("order_id", orderId).limit(1);
    else if (userId) query = query.eq("user_id", userId);

    const { data: records, error } = await query;
    if (error) throw error;

    const results: unknown[] = [];
    let creditedTotal = 0;

    for (const record of records ?? []) {
      if (record.credited) continue;
      try {
        const provider = String(record.provider ?? "nowpayments");
        const check = provider === "fpayment" ? await checkFpayment(record) : await checkNowpayments(record);

        if (check.status && check.status !== record.status) {
          await admin
            .from("crypto_payments")
            .update({ status: check.status, actually_paid: check.received || record.actually_paid, raw: check.raw })
            .eq("id", record.id);
        }

        let credited = 0;
        if (PAID_STATES.includes(check.status) || PARTIAL_STATES.includes(check.status)) {
          credited = await creditWallet(
            admin,
            record,
            check.received,
            provider === "fpayment" ? "FPayment" : "NOWPayments",
          );
          creditedTotal += credited;
        }

        results.push({ order_id: record.order_id, provider, status: check.status, credited });
      } catch (e) {
        console.error("reconcile error for", record.order_id, e);
        results.push({ order_id: record.order_id, error: (e as Error).message });
      }
    }

    return json({ success: true, checked: results.length, credited_naira: creditedTotal, results });
  } catch (e) {
    console.error("crypto-reconcile error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
