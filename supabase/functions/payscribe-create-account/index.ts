import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYSCRIBE_BASE = "https://api.payscribe.ng/api/v1";
const API_KEY = Deno.env.get("PAYSCRIBE_API_KEY") ?? "";

async function psReq(path: string, method: "GET" | "POST", body?: unknown) {
  const res = await fetch(`${PAYSCRIBE_BASE}${path}`, {
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

// Recursively walk an object/array and pick the first plausible "id"-like value
function deepFindId(obj: any): string | null {
  if (!obj) return null;
  const keys = ["customer_id", "customerId", "id", "uuid", "reference", "ref"];
  const seen = new Set<any>();
  const stack: any[] = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    for (const k of keys) {
      const v = (cur as any)[k];
      if (typeof v === "string" && v.length > 0) return v;
      if (typeof v === "number") return String(v);
    }
    for (const k of Object.keys(cur)) {
      const v = (cur as any)[k];
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return null;
}

async function findCustomerByEmail(email: string): Promise<string | null> {
  // Try a few likely endpoints — Payscribe variants
  const candidates = [
    `/customers?email=${encodeURIComponent(email)}`,
    `/customers/find?email=${encodeURIComponent(email)}`,
    `/customers/lookup?email=${encodeURIComponent(email)}`,
    `/customers`,
  ];
  for (const path of candidates) {
    try {
      const r = await psReq(path, "GET");
      console.log("Payscribe customer lookup", path, r.status, JSON.stringify(r.json).slice(0, 400));
      if (!r.ok) continue;
      // direct id?
      const direct = deepFindId(r.json);
      // if listing, try filter by email
      const list =
        r.json?.message?.details?.customers ||
        r.json?.data?.customers ||
        r.json?.customers ||
        r.json?.data ||
        r.json?.message?.details ||
        [];
      if (Array.isArray(list)) {
        const match = list.find((c: any) => (c?.email || "").toLowerCase() === email.toLowerCase());
        if (match) return deepFindId(match);
      }
      if (direct) return direct;
    } catch (_) { /* ignore */ }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, email, name, phoneNumber } = await req.json();
    console.log("Payscribe create account request:", { userId, email, name, phoneNumber });

    if (!userId || !email || !name || !phoneNumber) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 14) {
      return new Response(JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check existing in DB
    const { data: existing, error: profErr } = await supabase
      .from("profiles")
      .select("payscribe_account_number, payscribe_account_bank, payscribe_account_name, payscribe_customer_id, full_name")
      .eq("user_id", userId)
      .single();
    if (profErr) {
      return new Response(JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (existing?.payscribe_account_number) {
      return new Response(JSON.stringify({
        success: true,
        message: "Payscribe account already exists",
        data: {
          accountNumber: existing.payscribe_account_number,
          bankName: existing.payscribe_account_bank,
          accountName: existing.payscribe_account_name,
        },
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get or create customer
    let customerId: string | null = existing?.payscribe_customer_id || null;

    if (!customerId) {
      const [first_name, ...rest] = String(name).trim().split(/\s+/);
      const last_name = rest.join(" ") || first_name;
      const custPayload = {
        first_name,
        last_name,
        email,
        phone: cleanPhone,
      };
      const cust = await psReq("/customers/create", "POST", custPayload);
      console.log("Payscribe customer create:", cust.status, JSON.stringify(cust.json));

      if (cust.ok && cust.json?.status !== false) {
        customerId = deepFindId(cust.json);
      }

      // If creation failed (likely "already exists") or no ID — look it up by email
      if (!customerId) {
        console.log("Customer ID not in create response, looking up by email…");
        customerId = await findCustomerByEmail(email);
      }

      if (!customerId) {
        return new Response(JSON.stringify({
          error: "Couldn't get Payscribe customer ID. Please contact support.",
          providerError: cust.json,
        }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Persist customer id so we don't keep retrying
      await supabase.from("profiles").update({
        payscribe_customer_id: customerId,
        phone: cleanPhone,
      }).eq("user_id", userId);
    }

    // Create permanent virtual account on 9PSB
    const accPayload = {
      account_type: "static",
      currency: "NGN",
      customer_id: customerId,
      bank: ["9psb"],
    };

    const acc = await psReq("/collections/virtual-accounts/create", "POST", accPayload);
    console.log("Payscribe account create:", acc.status, JSON.stringify(acc.json));

    if (!acc.ok || acc.json?.status === false) {
      const msg = acc.json?.description || acc.json?.message || "Failed to create Payscribe virtual account";
      return new Response(JSON.stringify({ error: typeof msg === "string" ? msg : "Failed", providerError: acc.json }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const details = acc.json?.message?.details || acc.json?.data || acc.json;
    const accountInfo = Array.isArray(details?.account) ? details.account[0]
      : (details?.account || details?.virtual_account || details);
    const accountNumber: string = accountInfo?.account_number || accountInfo?.accountNumber;
    const bankName: string = accountInfo?.bank_name || accountInfo?.bankName || "9PSB";
    const accountName: string = accountInfo?.account_name || accountInfo?.accountName || name;

    if (!accountNumber) {
      return new Response(JSON.stringify({ error: "Account number missing from Payscribe response", providerError: acc.json }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: updateError } = await supabase.from("profiles").update({
      phone: cleanPhone,
      payscribe_customer_id: customerId,
      payscribe_account_number: accountNumber,
      payscribe_account_bank: bankName,
      payscribe_account_name: accountName,
    }).eq("user_id", userId);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to save account details", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`✅ Payscribe account created for ${email}: ${accountNumber} (${bankName})`);

    return new Response(JSON.stringify({
      success: true,
      message: "Payscribe virtual account created successfully",
      data: { accountNumber, bankName, accountName },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Payscribe create account error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
