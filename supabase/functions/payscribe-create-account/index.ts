import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYSCRIBE_BASE = "https://api.payscribe.ng/api/v1";
const API_KEY = Deno.env.get("PAYSCRIBE_API_KEY") ?? "";

async function ps(path: string, body?: unknown) {
  const res = await fetch(`${PAYSCRIBE_BASE}${path}`, {
    method: "POST",
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, email, name, phoneNumber, idType, idNumber, bank } = await req.json();
    console.log("Payscribe create account request:", { userId, email, name, phoneNumber, idType, hasIdNumber: !!idNumber, bank });

    if (!userId || !email || !name || !phoneNumber) {
      return new Response(JSON.stringify({ error: "Missing required fields: userId, email, name, phoneNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 14) {
      return new Response(JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let cleanIdType: "bvn" | "nin" | null = null;
    let cleanIdNumber: string | null = null;
    if (idType || idNumber) {
      if (idType !== "bvn" && idType !== "nin") {
        return new Response(JSON.stringify({ error: 'idType must be "bvn" or "nin"' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      cleanIdNumber = String(idNumber || "").replace(/\D/g, "");
      if (cleanIdNumber.length !== 11) {
        return new Response(JSON.stringify({ error: "idNumber must be exactly 11 digits" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      cleanIdType = idType;
    }

    const selectedBank: string = bank === "9psb" ? "9psb" : "palmpay";
    if (selectedBank === "palmpay" && (!cleanIdType || !cleanIdNumber)) {
      return new Response(JSON.stringify({ error: "PalmPay requires BVN or NIN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check existing
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

    // Create or reuse customer
    let customerId = existing?.payscribe_customer_id || null;
    if (!customerId) {
      const [first_name, ...rest] = String(name).split(" ");
      const last_name = rest.join(" ") || first_name;
      const custPayload: Record<string, unknown> = {
        first_name,
        last_name,
        email,
        phone: cleanPhone,
      };
      if (cleanIdType && cleanIdNumber) {
        custPayload.identity_type = cleanIdType;
        custPayload.identity_number = cleanIdNumber;
      }
      const cust = await ps("/customers/create", custPayload);
      console.log("Payscribe customer response:", cust.status, JSON.stringify(cust.json));
      if (!cust.ok || cust.json?.status === false) {
        const msg = cust.json?.description || cust.json?.message || "Failed to create Payscribe customer";
        return new Response(JSON.stringify({ error: msg, providerError: cust.json }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      customerId =
        cust.json?.message?.details?.id ||
        cust.json?.message?.details?.customer?.id ||
        cust.json?.data?.id ||
        cust.json?.id ||
        null;
      if (!customerId) {
        return new Response(JSON.stringify({ error: "Customer ID missing from Payscribe response", providerError: cust.json }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Create permanent virtual account
    const accPayload: Record<string, unknown> = {
      account_type: "static",
      currency: "NGN",
      customer_id: customerId,
      bank: [selectedBank],
    };
    if (selectedBank === "palmpay" && cleanIdType && cleanIdNumber) {
      accPayload.identity_type = cleanIdType;
      accPayload.identity_number = cleanIdNumber;
      accPayload.bvn = cleanIdNumber;
    }

    const acc = await ps("/collections/virtual-accounts/create", accPayload);
    console.log("Payscribe account response:", acc.status, JSON.stringify(acc.json));
    if (!acc.ok || acc.json?.status === false) {
      const msg = acc.json?.description || acc.json?.message || "Failed to create Payscribe virtual account";
      // Still save customer id so we don't recreate next time
      if (customerId) {
        await supabase.from("profiles").update({ payscribe_customer_id: customerId, phone: cleanPhone }).eq("user_id", userId);
      }
      return new Response(JSON.stringify({ error: msg, providerError: acc.json }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const details = acc.json?.message?.details || {};
    const accountInfo = Array.isArray(details.account) ? details.account[0] : details.account;
    const accountNumber: string = accountInfo?.account_number;
    const bankName: string = accountInfo?.bank_name || (selectedBank === "9psb" ? "9PSB" : "PalmPay");
    const accountName: string = accountInfo?.account_name || name;

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
