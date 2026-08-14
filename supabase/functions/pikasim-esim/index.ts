import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PIKA_BASE = "https://pikasim.com/api/v1/reseller";
const API_KEY = Deno.env.get("PIKASIM_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Pricing: provider USD -> NGN at 1390, then a 40% markup
const USD_TO_NAIRA = 1390;
const MARKUP = 1.4;

function nairaFromCents(cents: number) {
  return Math.ceil((Number(cents) / 100) * USD_TO_NAIRA * MARKUP);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function pika(path: string, method: "GET" | "POST" = "GET", body?: unknown) {
  const res = await fetch(`${PIKA_BASE}${path}`, {
    method,
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let out: any = {};
  try { out = text ? JSON.parse(text) : {}; } catch { out = { raw: text }; }
  return { ok: res.ok && out?.success !== false, status: res.status, json: out };
}

// ---------- catalogue helpers ----------

type Cat = "country" | "regional" | "global" | "unlimited" | "phone";

function categorise(p: any): Cat {
  if (p.planType === "data-voice-text" || p.hasVoice || p.smsStatus === 1) return "phone";
  if (p.isUnlimited || p.dataType === 2 || p.pricingType === "per_day") return "unlimited";
  if (p.isGlobalPackage) return "global";
  if (!p.locationCode && p.region) return "regional";
  if (!p.locationCode) return "global";
  return "country";
}

function shape(p: any) {
  const cents = Number(p.price ?? 0);
  return {
    package_code: p.packageCode,
    name: p.name,
    category: categorise(p),
    plan_type: p.planType ?? (p.hasVoice ? "data-voice-text" : "data"),
    location: p.locationNetworkList?.[0]?.locationName ?? p.location ?? p.region ?? null,
    location_code: p.locationCode ?? null,
    region: p.region ?? null,
    is_global: !!p.isGlobalPackage,
    volume_gb: p.volumeGB ?? null,
    is_unlimited: !!p.isUnlimited,
    daily_data_gb: p.dailyDataGB ?? null,
    fup_mbps: p.fupMbps ?? null,
    validity_days: p.validityDays ?? p.duration ?? null,
    duration: p.duration ?? null,
    duration_unit: p.durationUnit ?? "DAY",
    speed: p.speed ?? null,
    pricing_type: p.pricingType ?? "fixed",
    price_cents: cents,
    price_usd: cents / 100,
    price_naira: nairaFromCents(cents),
    has_voice: !!p.hasVoice,
    has_sms: !!p.hasSms || p.smsStatus === 1,
    voice_minutes: Number(p.voiceMinutes ?? 0),
    sms_count: Number(p.smsCount ?? 0),
    phone_number_included: !!p.phoneNumberIncluded,
    non_refundable: !!p.nonRefundable,
    requires_activation_date: !!p.requiresActivationDate,
    supports_topup: !!p.supportTopUpType,
    max_privacy: !!p.maxPrivacy,
    description: p.description ?? null,
  };
}

let catalogCache: { at: number; data: any[] } | null = null;

async function loadCatalog(force = false) {
  if (!force && catalogCache && Date.now() - catalogCache.at < 10 * 60 * 1000) {
    return catalogCache.data;
  }
  const all: any[] = [];
  for (let page = 1; page <= 12; page++) {
    const r = await pika(`/packages?type=all&limit=200&page=${page}`);
    if (!r.ok) {
      if (page === 1) throw new Error(r.json?.error || `Provider returned ${r.status}`);
      break;
    }
    const list = r.json?.data?.packages ?? [];
    all.push(...list);
    const pages = r.json?.data?.pagination?.pages ?? 1;
    if (page >= pages) break;
  }
  const shaped = all.map(shape).filter((p) => p.package_code && p.price_cents > 0);
  catalogCache = { at: Date.now(), data: shaped };
  return shaped;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!API_KEY) return json({ error: "PikaSim is not configured yet." }, 500);

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "catalog");

    // ---------- Catalogue ----------
    if (action === "catalog") {
      let packages: any[];
      try {
        packages = await loadCatalog(!!body.refresh);
      } catch (e) {
        console.error("pikasim catalog failed", e);
        return json({ error: `Could not load eSIM plans: ${(e as Error).message}` }, 400);
      }
      const counts: Record<string, number> = {};
      for (const p of packages) counts[p.category] = (counts[p.category] ?? 0) + 1;
      return json({ success: true, packages, counts, rate: USD_TO_NAIRA });
    }

    // ---------- My eSIMs ----------
    if (action === "myEsims") {
      const { data: rows } = await admin
        .from("pikasim_esim_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Refresh anything still provisioning
      for (const row of rows ?? []) {
        if (row.iccid || !row.provider_order_id) continue;
        const r = await pika(`/orders/${row.provider_order_id}`);
        const d = r.json?.data;
        const esim = d?.esim ?? d?.esims?.[0];
        if (r.ok && esim?.iccid) {
          await admin.from("pikasim_esim_orders").update({
            iccid: esim.iccid,
            qr_code_url: esim.qrCodeUrl ?? null,
            activation_code: esim.activationCode ?? null,
            lpa_url: esim.lpaUrl ?? null,
            short_url: esim.shortUrl ?? null,
            status: "completed",
          }).eq("id", row.id);
          row.iccid = esim.iccid;
          row.qr_code_url = esim.qrCodeUrl ?? null;
          row.activation_code = esim.activationCode ?? null;
          row.lpa_url = esim.lpaUrl ?? null;
          row.short_url = esim.shortUrl ?? null;
          row.status = "completed";
        } else if (r.ok && d?.status === "failed") {
          await admin.from("pikasim_esim_orders").update({ status: "failed" }).eq("id", row.id);
          row.status = "failed";
        }
      }

      return json({ success: true, orders: rows ?? [] });
    }

    // ---------- Usage ----------
    if (action === "usage") {
      const iccid = String(body.iccid ?? "");
      if (!iccid) return json({ error: "ICCID required" }, 400);
      const { data: owned } = await admin
        .from("pikasim_esim_orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("iccid", iccid)
        .maybeSingle();
      if (!owned) return json({ error: "eSIM not found" }, 404);
      const r = await pika(`/esims/${iccid}/usage`);
      if (!r.ok) return json({ error: r.json?.error || "Could not fetch usage" }, 400);
      return json({ success: true, usage: r.json?.data });
    }

    // ---------- Top up options ----------
    if (action === "topupOptions") {
      const iccid = String(body.iccid ?? "");
      if (!iccid) return json({ error: "ICCID required" }, 400);
      const { data: owned } = await admin
        .from("pikasim_esim_orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("iccid", iccid)
        .maybeSingle();
      if (!owned) return json({ error: "eSIM not found" }, 404);
      const r = await pika(`/esims/${iccid}/topup-options`);
      if (!r.ok) return json({ error: r.json?.error || "No top-ups available" }, 400);
      const options = (r.json?.data?.topupPackages ?? []).map((t: any) => ({
        package_code: t.packageCode,
        name: t.name,
        volume_gb: t.volumeGB ?? null,
        duration: t.duration ?? null,
        voice_minutes: t.voiceMinutes ?? 0,
        sms_count: t.smsCount ?? 0,
        price_usd: Number(t.price ?? 0) / 100,
        price_naira: nairaFromCents(Number(t.price ?? 0)),
      }));
      return json({ success: true, options });
    }

    // ---------- Purchase / Top up ----------
    if (action === "purchase" || action === "topup") {
      const packageCode = String(body.package_code ?? "");
      const iccid = body.iccid ? String(body.iccid) : null;
      const activationDate = body.activation_date ? String(body.activation_date) : null;
      if (!packageCode) return json({ error: "Select a plan first" }, 400);
      if (action === "topup" && !iccid) return json({ error: "ICCID required for top up" }, 400);

      // Always price from a live provider lookup so a stale UI can never underpay
      let pkg: any = null;
      let priceNaira = 0;
      let costUsd = 0;

      if (action === "purchase") {
        const pr = await pika(`/packages/${encodeURIComponent(packageCode)}`);
        if (!pr.ok) {
          const replacement = pr.json?.replacement;
          return json({
            error: pr.json?.code === "PACKAGE_RETIRED"
              ? `That plan was replaced${replacement ? ` by "${replacement.name}"` : ""}. Please refresh the plan list.`
              : (pr.json?.error || "This plan is no longer available"),
          }, 400);
        }
        const raw = pr.json?.data?.package ?? pr.json?.data;
        pkg = shape(raw);
        if (pkg.pricing_type === "per_day") {
          return json({ error: "This plan is not available for purchase right now." }, 400);
        }
        costUsd = pkg.price_usd;
        priceNaira = pkg.price_naira;
      } else {
        const { data: owned } = await admin
          .from("pikasim_esim_orders")
          .select("id, package_name")
          .eq("user_id", user.id)
          .eq("iccid", iccid)
          .maybeSingle();
        if (!owned) return json({ error: "eSIM not found" }, 404);
        const tr = await pika(`/esims/${iccid}/topup-options`);
        if (!tr.ok) return json({ error: tr.json?.error || "No top-ups available" }, 400);
        const found = (tr.json?.data?.topupPackages ?? []).find((t: any) => t.packageCode === packageCode);
        if (!found) return json({ error: "That top-up is no longer available" }, 400);
        costUsd = Number(found.price ?? 0) / 100;
        priceNaira = nairaFromCents(Number(found.price ?? 0));
        pkg = { package_code: packageCode, name: found.name, volume_gb: found.volumeGB ?? null };
      }

      // Live balance check
      const { data: profile } = await admin
        .from("profiles")
        .select("wallet_balance, is_banned")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) return json({ error: "Profile not found" }, 404);
      if (profile.is_banned) return json({ error: "Account suspended" }, 403);
      if (Number(profile.wallet_balance) < priceNaira) {
        return json({ error: "Insufficient wallet balance. Please fund your wallet." }, 400);
      }

      const externalOrderId = `LHM-${user.id.slice(0, 8)}-${Date.now()}`;

      // Place the provider order first — only debit once it is accepted
      const orderBody: Record<string, unknown> = { packageCode, externalOrderId };
      if (activationDate) orderBody.activationDate = activationDate;

      const or = action === "purchase"
        ? await pika("/orders", "POST", orderBody)
        : await pika(`/esims/${iccid}/topup`, "POST", orderBody);

      if (!or.ok) {
        console.error("pikasim order failed", or.status, JSON.stringify(or.json));
        const msg = or.status === 402
          ? "eSIM provider is temporarily out of balance. Please try again shortly."
          : (or.json?.error || "Could not create the eSIM order");
        return json({ error: msg }, 400);
      }

      const orderData = or.json?.data ?? {};
      const providerOrderId = orderData.orderId ?? orderData.id ?? null;

      // Debit the wallet
      const newBalance = Number(profile.wallet_balance) - priceNaira;
      await admin.from("profiles").update({ wallet_balance: newBalance }).eq("user_id", user.id);
      await admin.from("wallet_transactions").insert({
        user_id: user.id,
        amount: -priceNaira,
        transaction_type: "purchase",
        description: action === "topup"
          ? `eSIM top up - ${pkg.name} (${iccid})`
          : `eSIM purchase - ${pkg.name}`,
      });

      // Poll briefly for provisioning so the QR code is usually ready right away
      let esim: any = null;
      if (providerOrderId) {
        for (let i = 0; i < 8; i++) {
          await new Promise((r) => setTimeout(r, 2500));
          const st = await pika(`/orders/${providerOrderId}`);
          const d = st.json?.data;
          const e = d?.esim ?? d?.esims?.[0];
          if (e?.iccid) { esim = e; break; }
          if (d?.status === "failed") break;
        }
      }

      let order: any = null;
      if (action === "purchase") {
        const { data: inserted } = await admin
          .from("pikasim_esim_orders")
          .insert({
            user_id: user.id,
            package_code: packageCode,
            package_name: pkg.name,
            plan_type: pkg.plan_type ?? "data",
            category: pkg.category ?? "country",
            location: pkg.location,
            location_code: pkg.location_code,
            region: pkg.region,
            data_gb: pkg.volume_gb,
            is_unlimited: !!pkg.is_unlimited,
            validity_days: pkg.validity_days,
            has_voice: !!pkg.has_voice,
            has_sms: !!pkg.has_sms,
            voice_minutes: pkg.voice_minutes ?? 0,
            sms_count: pkg.sms_count ?? 0,
            cost_usd: costUsd,
            charged_naira: priceNaira,
            provider_order_id: providerOrderId,
            external_order_id: externalOrderId,
            iccid: esim?.iccid ?? null,
            qr_code_url: esim?.qrCodeUrl ?? null,
            activation_code: esim?.activationCode ?? null,
            lpa_url: esim?.lpaUrl ?? null,
            short_url: esim?.shortUrl ?? null,
            status: esim?.iccid ? "completed" : "processing",
            raw: { order: orderData, esim },
          })
          .select()
          .single();
        order = inserted;
      } else {
        const { data: existing } = await admin
          .from("pikasim_esim_orders")
          .select("*")
          .eq("user_id", user.id)
          .eq("iccid", iccid)
          .maybeSingle();
        if (existing) {
          const { data: updated } = await admin
            .from("pikasim_esim_orders")
            .update({
              charged_naira: Number(existing.charged_naira) + priceNaira,
              data_gb: Number(existing.data_gb ?? 0) + Number(pkg.volume_gb ?? 0),
            })
            .eq("id", existing.id)
            .select()
            .single();
          order = updated;
        }
      }

      return json({
        success: true,
        order,
        charged_naira: priceNaira,
        new_balance: newBalance,
        pending: !esim?.iccid,
      });
    }

    // ---------- Cancel an unused eSIM ----------
    if (action === "cancel") {
      const iccid = String(body.iccid ?? "");
      const { data: owned } = await admin
        .from("pikasim_esim_orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("iccid", iccid)
        .maybeSingle();
      if (!owned) return json({ error: "eSIM not found" }, 404);
      if (owned.status === "cancelled") return json({ error: "Already cancelled" }, 400);

      const r = await pika(`/esims/${iccid}/cancel`, "POST", {});
      if (!r.ok) {
        return json({ error: r.json?.error || "This eSIM can no longer be cancelled" }, 400);
      }

      const { data: profile } = await admin
        .from("profiles").select("wallet_balance").eq("user_id", user.id).maybeSingle();
      const refunded = Number(owned.charged_naira);
      await admin.from("profiles")
        .update({ wallet_balance: Number(profile?.wallet_balance ?? 0) + refunded })
        .eq("user_id", user.id);
      await admin.from("wallet_transactions").insert({
        user_id: user.id,
        amount: refunded,
        transaction_type: "refund",
        description: `eSIM cancelled refund - ${owned.package_name}`,
      });
      await admin.from("pikasim_esim_orders").update({ status: "cancelled" }).eq("id", owned.id);

      return json({ success: true, refunded_naira: refunded });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("pikasim-esim error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
