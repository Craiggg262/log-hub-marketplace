import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-pikasim-signature, x-webhook-signature",
};

const SECRET = Deno.env.get("PIKASIM_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const raw = await req.text();
    const provided = (
      req.headers.get("x-pikasim-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-webhook-signature") ||
      ""
    ).replace(/^sha256=/i, "").trim();

    if (SECRET && provided) {
      const expected = await hmacHex(SECRET, raw);
      if (expected.toLowerCase() !== provided.toLowerCase()) {
        console.error("pikasim-webhook invalid signature");
        return json({ error: "Invalid signature" }, 401);
      }
    }

    const payload = JSON.parse(raw || "{}");
    const event = String(payload.event ?? payload.type ?? "");
    const data = payload.data ?? payload;
    console.log("pikasim-webhook", event, JSON.stringify(data).slice(0, 800));

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const providerOrderId = data.orderId ?? data.order_id ?? data.order?.orderId ?? null;
    const externalOrderId = data.externalOrderId ?? data.external_order_id ?? null;
    const esim = data.esim ?? data.esims?.[0] ?? null;
    const iccid = esim?.iccid ?? data.iccid ?? null;

    if (!providerOrderId && !externalOrderId && !iccid) {
      return json({ success: true, ignored: true });
    }

    let q = admin.from("pikasim_esim_orders").select("*").limit(1);
    if (providerOrderId) q = q.eq("provider_order_id", String(providerOrderId));
    else if (externalOrderId) q = q.eq("external_order_id", String(externalOrderId));
    else q = q.eq("iccid", String(iccid));

    const { data: rows } = await q;
    const order = rows?.[0];
    if (!order) return json({ success: true, ignored: true });

    const update: Record<string, unknown> = {};

    if (iccid) update.iccid = iccid;
    if (esim?.qrCodeUrl) update.qr_code_url = esim.qrCodeUrl;
    if (esim?.activationCode) update.activation_code = esim.activationCode;
    if (esim?.lpaUrl) update.lpa_url = esim.lpaUrl;
    if (esim?.shortUrl) update.short_url = esim.shortUrl;

    const status = String(data.status ?? "").toLowerCase();
    if (event.includes("failed") || status === "failed") update.status = "failed";
    else if (event.includes("cancel") || status === "cancelled") update.status = "cancelled";
    else if (iccid || status === "completed" || event.includes("ready") || event.includes("delivered")) {
      update.status = "completed";
    }

    if (Object.keys(update).length) {
      await admin.from("pikasim_esim_orders").update(update).eq("id", order.id);
    }

    // Auto-refund a failed order once
    if (update.status === "failed" && order.status !== "failed" && Number(order.charged_naira) > 0) {
      const { data: profile } = await admin
        .from("profiles").select("wallet_balance").eq("user_id", order.user_id).maybeSingle();
      const refund = Number(order.charged_naira);
      await admin.from("profiles")
        .update({ wallet_balance: Number(profile?.wallet_balance ?? 0) + refund })
        .eq("user_id", order.user_id);
      await admin.from("wallet_transactions").insert({
        user_id: order.user_id,
        amount: refund,
        transaction_type: "refund",
        description: `eSIM failed refund - ${order.package_name}`,
      });
    }

    return json({ success: true });
  } catch (e) {
    console.error("pikasim-webhook error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
