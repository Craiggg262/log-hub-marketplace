// VTU Gateway - proxies to Portal 1 (vtugate.com) and Portal 2 (cheapdatahub.ng)
// Applies a 20% markup to all user-facing prices.
// IMPORTANT: All handled/user-facing errors are returned as HTTP 200 with { error }
// so the browser client doesn't hit "Edge function returned non-2xx".
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MARKUP = 1.2;

const VTUGATE_KEY = Deno.env.get("VTUGATE_API_KEY") ?? "";
const CDH_KEY = Deno.env.get("CHEAPDATAHUB_API_KEY") ?? "";
const VTUGATE_BASE = "https://api.vtugate.com/api/v1";
const CDH_BASE = "https://www.cheapdatahub.ng/api/v1/resellers";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Return errors as 200 so the browser SDK receives the message cleanly.
const err = (message: string, extra: Record<string, unknown> = {}) =>
  json({ error: message, ...extra }, 200);

async function vtugate(path: string, params: Record<string, string | number>) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) body.append(k, String(v));
  const res = await fetch(`${VTUGATE_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${VTUGATE_KEY}`,
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.status == 1, status: res.status, data };
}

async function cdh(path: string, body: Record<string, unknown>, method = "POST") {
  const res = await fetch(`${CDH_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CDH_KEY}`,
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  const ok =
    res.ok &&
    (data?.status === "true" ||
      data?.status === true ||
      data?.status === 1 ||
      data?.status === "success");
  return { ok, status: res.status, data };
}

// ---------- CheapDataHub static catalogs ----------
// Airtime & Data provider IDs (network = provider_id for airtime, used as filter for data)
const CDH_NETWORKS = [
  { id: 1, name: "MTN" },
  { id: 2, name: "GLO" },
  { id: 3, name: "9MOBILE" },
  { id: 4, name: "AIRTEL" },
];
// Best-known mapping from CDH numeric disco IDs (7-10 confirmed by API responses).
const CDH_DISCOS = [
  { id: 1, name: "Ikeja Electric (IKEDC)" },
  { id: 2, name: "Eko Electric (EKEDC)" },
  { id: 3, name: "Kano Electric (KEDCO)" },
  { id: 4, name: "Port Harcourt Electric (PHED)" },
  { id: 5, name: "Ibadan Electric (IBEDC)" },
  { id: 6, name: "Kaduna Electric (KAEDC)" },
  { id: 7, name: "Jos Electric (JED)" },
  { id: 8, name: "Enugu Electric (EEDC)" },
  { id: 9, name: "Yola Electric (YEDC)" },
  { id: 10, name: "Benin Electric (BEDC)" },
];
// Cable providers - internal grouping only; API uses plan_id directly.
const CDH_CABLE = [
  { id: 1, name: "DStv" },
  { id: 2, name: "GOtv" },
  { id: 3, name: "StarTimes" },
];

// Full CheapDataHub data plans (source: https://www.cheapdatahub.ng/api/plan-ids/)
// network is one of: MTN | AIRTEL | GLO | 9MOBILE
type CdhPlan = { network: string; plan_name: string; plan_id: number; price: number };
const CDH_DATA_PLANS: CdhPlan[] = [
  { network: "AIRTEL", plan_name: "1GB (Social Bundle) Gifting (3 Days)", plan_id: 70, price: 295 },
  { network: "AIRTEL", plan_name: "500MB Gifting (7 days)", plan_id: 13, price: 490 },
  { network: "AIRTEL", plan_name: "1.5GB Gifting (1 Day)", plan_id: 69, price: 500 },
  { network: "AIRTEL", plan_name: "1.5GB Gifting (2 Days)", plan_id: 66, price: 599 },
  { network: "AIRTEL", plan_name: "1GB Gifting (7 Days)", plan_id: 15, price: 785 },
  { network: "AIRTEL", plan_name: "2GB Gifting (30 Days)", plan_id: 17, price: 1470 },
  { network: "AIRTEL", plan_name: "5GB Gifting (7 Days)", plan_id: 52, price: 1570 },
  { network: "AIRTEL", plan_name: "3GB Gifting (30 Days)", plan_id: 18, price: 1960 },
  { network: "AIRTEL", plan_name: "6GB SME (7 Days)", plan_id: 22, price: 2455 },
  { network: "AIRTEL", plan_name: "4GB Gifting (30 Days)", plan_id: 19, price: 2570 },
  { network: "AIRTEL", plan_name: "8GB Gifting (30 Days)", plan_id: 20, price: 2999 },
  { network: "AIRTEL", plan_name: "10GB Gifting (30 Days)", plan_id: 21, price: 4070 },
  { network: "GLO", plan_name: "200MB Corporate Gifting (1 Day)", plan_id: 42, price: 92 },
  { network: "GLO", plan_name: "500MB Corporate Gifting (30 Days)", plan_id: 35, price: 225 },
  { network: "GLO", plan_name: "1GB Corporate Gifting (3 Days)", plan_id: 68, price: 300 },
  { network: "GLO", plan_name: "1GB Corporate Gifting (30 Days)", plan_id: 36, price: 425 },
  { network: "GLO", plan_name: "1GB Gifting (14 Days)", plan_id: 41, price: 485 },
  { network: "GLO", plan_name: "2GB Corporate Gifting (30 Days)", plan_id: 40, price: 850 },
  { network: "GLO", plan_name: "3GB Corporate Gifting (30 Days)", plan_id: 37, price: 1300 },
  { network: "GLO", plan_name: "5GB Corporate Gifting (7 Days)", plan_id: 54, price: 1699 },
  { network: "GLO", plan_name: "5GB Corporate Gifting (30 Days)", plan_id: 38, price: 2250 },
  { network: "GLO", plan_name: "10GB Corporate Gifting (30 Days)", plan_id: 39, price: 4390 },
  { network: "GLO", plan_name: "20.5GB Gifting (30 Days)", plan_id: 59, price: 5300 },
  { network: "GLO", plan_name: "107GB Gifting (30 Days)", plan_id: 58, price: 19300 },
  { network: "MTN", plan_name: "110MB Gifting (1 Day)", plan_id: 43, price: 99 },
  { network: "MTN", plan_name: "230MB Gifting (1 Day)", plan_id: 74, price: 200 },
  { network: "MTN", plan_name: "500MB SME (2 Days)", plan_id: 76, price: 250 },
  { network: "MTN", plan_name: "1GB SME (1 Day)", plan_id: 78, price: 280 },
  { network: "MTN", plan_name: "500MB SME (30 Days)", plan_id: 44, price: 350 },
  { network: "MTN", plan_name: "1GB SME (2 Days)", plan_id: 77, price: 399 },
  { network: "MTN", plan_name: "1GB SME (7 Days)", plan_id: 45, price: 450 },
  { network: "MTN", plan_name: "1GB SME (30 Days)", plan_id: 46, price: 570 },
  { network: "MTN", plan_name: "2.5GB SME (1 Day)", plan_id: 79, price: 600 },
  { network: "MTN", plan_name: "2.5GB Gifting (2 Days)", plan_id: 27, price: 900 },
  { network: "MTN", plan_name: "2GB Gifting (7 Days)", plan_id: 71, price: 900 },
  { network: "MTN", plan_name: "2GB SME (7 Days)", plan_id: 47, price: 930 },
  { network: "MTN", plan_name: "3.5GB Gifting (1 Day)", plan_id: 60, price: 980 },
  { network: "MTN", plan_name: "2GB SME (30 Days)", plan_id: 48, price: 1150 },
  { network: "MTN", plan_name: "4GB Gifting (2 Days)", plan_id: 61, price: 1175 },
  { network: "MTN", plan_name: "5GB Corporate Gifting (14 Days)", plan_id: 80, price: 1299 },
  { network: "MTN", plan_name: "3GB SME (30 Days)", plan_id: 49, price: 1370 },
  { network: "MTN", plan_name: "5GB SME (30 Days)", plan_id: 50, price: 2050 },
  { network: "MTN", plan_name: "6GB Gifting (7 Days)", plan_id: 53, price: 2495 },
  { network: "MTN", plan_name: "11GB Gifting (7 Days)", plan_id: 55, price: 3430 },
  { network: "MTN", plan_name: "7GB Gifting (30 Days)", plan_id: 33, price: 3499 },
  { network: "MTN", plan_name: "10GB Gifting (30 Days)", plan_id: 67, price: 4470 },
  { network: "MTN", plan_name: "36GB Gifting (30 Days)", plan_id: 57, price: 10800 },
  { network: "MTN", plan_name: "75GB SME (30 Days)", plan_id: 51, price: 17990 },
];

// Cable plans (grouped by provider name) — plan_id passes straight to /cable/purchase
type CdhCable = { provider: "DStv" | "GOtv" | "StarTimes"; plan_name: string; plan_id: number; price: number };
const CDH_CABLE_PLANS: CdhCable[] = [
  { provider: "DStv", plan_name: "DStv Padi", plan_id: 3, price: 4400 },
  { provider: "DStv", plan_name: "DStv Yanga", plan_id: 6, price: 6000 },
  { provider: "DStv", plan_name: "DStv Confam", plan_id: 7, price: 11000 },
  { provider: "DStv", plan_name: "DStv Compact", plan_id: 8, price: 19000 },
  { provider: "DStv", plan_name: "DStv Compact Plus", plan_id: 9, price: 30000 },
  { provider: "DStv", plan_name: "DStv Premium", plan_id: 10, price: 44500 },
  { provider: "GOtv", plan_name: "GOtv Smallie (Monthly)", plan_id: 4, price: 1900 },
  { provider: "GOtv", plan_name: "GOtv Jinja", plan_id: 11, price: 3900 },
  { provider: "GOtv", plan_name: "GOtv Jolli", plan_id: 12, price: 5800 },
  { provider: "GOtv", plan_name: "GOtv Max", plan_id: 13, price: 8500 },
  { provider: "GOtv", plan_name: "GOtv Supa", plan_id: 14, price: 11400 },
  { provider: "GOtv", plan_name: "GOtv Supa Plus", plan_id: 15, price: 16800 },
  { provider: "StarTimes", plan_name: "Nova (Antenna) - 1 Week", plan_id: 5, price: 700 },
  { provider: "StarTimes", plan_name: "Nova (Dish) - 1 Week", plan_id: 16, price: 700 },
  { provider: "StarTimes", plan_name: "Nova (Antenna) - 1 Month", plan_id: 17, price: 2100 },
  { provider: "StarTimes", plan_name: "Basic (Antenna) - 1 Week", plan_id: 18, price: 1400 },
  { provider: "StarTimes", plan_name: "Basic (Dish) - 1 Week", plan_id: 19, price: 1700 },
  { provider: "StarTimes", plan_name: "Basic (Antenna) - 1 Month", plan_id: 20, price: 4000 },
  { provider: "StarTimes", plan_name: "Basic (Dish) - 1 Month", plan_id: 21, price: 5100 },
  { provider: "StarTimes", plan_name: "Classic (Dish) - 1 Week", plan_id: 22, price: 2500 },
  { provider: "StarTimes", plan_name: "Classic (Dish) - 1 Month", plan_id: 23, price: 7400 },
  { provider: "StarTimes", plan_name: "Super (Dish) - 1 Week", plan_id: 24, price: 3300 },
  { provider: "StarTimes", plan_name: "Super (Antenna) - 1 Week", plan_id: 25, price: 3200 },
  { provider: "StarTimes", plan_name: "Super (Antenna) - 1 Month", plan_id: 26, price: 9500 },
];

// Normalize a Portal 1 service object. VTUGate returns one service per
// (network × data-type) combo. We surface a stable shape the client can
// group on: { service_id, network_name, plan_type }.
function normalizeVtuGateService(s: any) {
  const rawNetwork =
    s.network ?? s.network_name ?? s.tv_name ?? s.disco?.toUpperCase?.() ?? "";
  const inferredNetwork = !rawNetwork && typeof s.service_name === "string"
    ? s.service_name.split(/\s+/)[0]
    : rawNetwork;
  const inferredType = s.plan_type ?? s.type ?? s.provider ?? (
    typeof s.service_name === "string" && inferredNetwork
      ? s.service_name.replace(new RegExp(`^${inferredNetwork}\\s*`, "i"), "").trim()
      : ""
  );
  return {
    service_id: s.service_id ?? s.id,
    network_name: String(inferredNetwork || s.name || "").toUpperCase(),
    plan_type: inferredType || null,
    disco: s.disco,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, portal } = body as { action: string; portal: "1" | "2" };
    const p = String(portal);

    // ---------- Public read-only actions ----------
    if (action === "fetch_services") {
      const service_type = String(body.service_type || "");
      if (p === "1") {
        // Try declared type, then a couple of common aliases for cable TV.
        const tries: string[] = [service_type];
        if (service_type === "tv") tries.push("cabletv", "cable_tv", "cable");
        if (service_type === "cabletv") tries.push("tv");
        let list: any[] = [];
        for (const t of tries) {
          const r = await vtugate("/fetchservices", { service_type: t });
          if (r.ok && Array.isArray(r.data?.data) && r.data.data.length) {
            list = r.data.data;
            break;
          }
        }
        return json({ services: list.map(normalizeVtuGateService) });
      }
      // Portal 2 static catalogs
      if (service_type === "airtime" || service_type === "data") {
        return json({ services: CDH_NETWORKS.map((n) => ({ service_id: n.id, network_name: n.name })) });
      }
      if (service_type === "electricity") {
        return json({ services: CDH_DISCOS.map((d) => ({ service_id: d.id, network_name: d.name })) });
      }
      if (service_type === "tv" || service_type === "cabletv") {
        return json({ services: CDH_CABLE.map((c) => ({ service_id: c.id, network_name: c.name })) });
      }
      return json({ services: [] });
    }

    if (action === "fetch_data_plans") {
      if (p === "1") {
        const r = await vtugate("/fetchdataplans", { service_id: body.service_id });
        if (!r.ok) return err(r.data?.message || "Failed to load plans");
        const plans = (r.data?.data?.data_plans || r.data?.data || []).map((pl: any) => ({
          plan_code: String(pl.plan_code ?? pl.id ?? pl.plan_id ?? ""),
          plan_name: pl.plan_name ?? pl.name ?? "",
          amount: Number(pl.amount ?? pl.price ?? 0),
          validity: pl.validity ?? pl.duration ?? "",
        }));
        return json({ plans });
      }
      // Portal 2: static plans filtered by selected network id
      const svcId = Number(body.service_id);
      const net = CDH_NETWORKS.find((n) => n.id === svcId)?.name;
      const plans = CDH_DATA_PLANS
        .filter((pl) => !net || pl.network === net)
        .map((pl) => ({
          plan_code: String(pl.plan_id),
          plan_name: pl.plan_name,
          amount: pl.price,
          validity: "",
        }));
      return json({ plans });
    }

    if (action === "fetch_cable_plans") {
      // Used by Portal 2 UI to get plans for a chosen decoder (no verify needed)
      const svcId = Number(body.service_id);
      const providerName = CDH_CABLE.find((c) => c.id === svcId)?.name;
      const plans = CDH_CABLE_PLANS
        .filter((pl) => !providerName || pl.provider === providerName)
        .map((pl) => ({
          plan_code: String(pl.plan_id),
          plan_name: pl.plan_name,
          amount: pl.price,
        }));
      return json({ plans });
    }

    if (action === "verify_cabletv") {
      if (p === "1") {
        const r = await vtugate("/verifycabletv", {
          service_id: body.service_id,
          phone: body.phone,
          smartcard_number: body.smartcard_number,
        });
        if (!r.ok) return err(r.data?.message || "Verification failed");
        return json({
          smartcard_name: r.data?.data?.smartcard_name,
          cable_plans: r.data?.data?.cable_plans || [],
        });
      }
      return json({ smartcard_name: null, cable_plans: [] });
    }

    if (action === "verify_electricity") {
      if (p === "1") {
        const r = await vtugate("/verifyelectricity", {
          service_id: body.service_id,
          meter_no: body.meter_no,
          disco: body.disco,
        });
        if (!r.ok) return err(r.data?.message || "Verification failed");
        return json({ meter_name: r.data?.data?.meter_name });
      }
      return json({ meter_name: null });
    }

    // ---------- Authenticated actions ----------
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return err("Unauthorized");
    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supaUser.auth.getUser();
    const user = userData?.user;
    if (!user) return err("Unauthorized");

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    async function chargeAndRecord(opts: {
      baseAmount: number;
      orderType: string;
      network: string;
      networkId: number;
      planId?: number | null;
      planName?: string | null;
      mobile: string;
      call: () => Promise<{ ok: boolean; data: any }>;
    }) {
      const userCharge = Math.round(opts.baseAmount * MARKUP * 100) / 100;

      const { data: profile } = await supa
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .single();

      if (!profile || Number(profile.wallet_balance) < userCharge) {
        return err("Insufficient wallet balance");
      }

      await supa
        .from("profiles")
        .update({ wallet_balance: Number(profile.wallet_balance) - userCharge })
        .eq("user_id", user.id);

      const { data: order } = await supa
        .from("vtu_orders")
        .insert({
          user_id: user.id,
          order_type: opts.orderType,
          network: opts.network,
          network_id: opts.networkId,
          plan_id: opts.planId ?? null,
          plan_name: opts.planName ?? null,
          mobile_number: opts.mobile,
          amount: userCharge,
          status: "pending",
        })
        .select()
        .single();

      const result = await opts.call();

      if (!result.ok) {
        await supa
          .from("profiles")
          .update({ wallet_balance: Number(profile.wallet_balance) })
          .eq("user_id", user.id);
        if (order) {
          await supa
            .from("vtu_orders")
            .update({ status: "failed", api_response: result.data })
            .eq("id", order.id);
        }
        const msg = result.data?.message || result.data?.error || "Provider transaction failed";
        return err(msg, { details: result.data });
      }

      await supa.from("wallet_transactions").insert({
        user_id: user.id,
        amount: -userCharge,
        transaction_type: "purchase",
        description: `${opts.orderType} - ${opts.network} ${opts.mobile}`,
      });

      if (order) {
        await supa
          .from("vtu_orders")
          .update({ status: "completed", api_response: result.data })
          .eq("id", order.id);
      }

      return json({ success: true, charged: userCharge, order_id: order?.id, response: result.data });
    }

    if (action === "buy_airtime") {
      const amount = Number(body.amount);
      const network = String(body.network_name || "");
      const phone = String(body.phone_number || "");
      if (!amount || amount < 50) return err("Enter valid amount");
      if (!/^0\d{10}$/.test(phone)) return err("Invalid phone number");

      return await chargeAndRecord({
        baseAmount: amount,
        orderType: "airtime",
        network,
        networkId: Number(body.service_id),
        mobile: phone,
        call: async () => {
          if (p === "1") {
            const r = await vtugate("/buyairtime", {
              service_id: body.service_id,
              phone_number: phone,
              amount,
            });
            return { ok: r.ok, data: r.data };
          }
          const r = await cdh("/airtime/purchase/", {
            provider_id: Number(body.service_id),
            phone_number: phone,
            amount,
          });
          return { ok: r.ok, data: r.data };
        },
      });
    }

    if (action === "buy_data") {
      const phone = String(body.phone_number || "");
      if (!/^0\d{10}$/.test(phone)) return err("Invalid phone number");

      if (p === "1") {
        const amount = Number(body.amount);
        return await chargeAndRecord({
          baseAmount: amount,
          orderType: "data",
          network: String(body.network_name || ""),
          networkId: Number(body.service_id),
          planId: null,
          planName: String(body.plan_name || body.plan_code || ""),
          mobile: phone,
          call: async () => {
            const r = await vtugate("/buydata", {
              service_id: body.service_id,
              phone_number: phone,
              amount,
              plan_code: body.plan_code,
            });
            return { ok: r.ok, data: r.data };
          },
        });
      }
      // Portal 2 - user picks a plan_code (bundle_id) from the dropdown
      const planCode = Number(body.plan_code);
      const chosen = CDH_DATA_PLANS.find((pl) => pl.plan_id === planCode);
      if (!chosen) return err("Invalid data plan");
      return await chargeAndRecord({
        baseAmount: chosen.price,
        orderType: "data",
        network: chosen.network,
        networkId: Number(body.service_id || 0),
        planId: planCode,
        planName: chosen.plan_name,
        mobile: phone,
        call: async () => {
          const r = await cdh("/data/purchase/", {
            bundle_id: planCode,
            mobile_number: phone,
            phone_number: phone,
          });
          return { ok: r.ok, data: r.data };
        },
      });
    }

    if (action === "buy_cabletv") {
      if (p === "1") {
        const amount = Number(body.amount);
        return await chargeAndRecord({
          baseAmount: amount,
          orderType: "cable",
          network: String(body.provider_name || "Cable"),
          networkId: Number(body.service_id),
          planName: String(body.plan_name || ""),
          mobile: String(body.smartcard_number),
          call: async () => {
            const r = await vtugate("/buycabletv", {
              service_id: body.service_id,
              phone: body.phone,
              smartcard_number: body.smartcard_number,
              amount,
              plan_code: body.plan_code,
              plan_name: body.plan_name,
            });
            return { ok: r.ok, data: r.data };
          },
        });
      }
      // Portal 2 — plan_code is CDH plan_id; base amount comes from static catalog.
      const planCode = Number(body.plan_code);
      const plan = CDH_CABLE_PLANS.find((pl) => pl.plan_id === planCode);
      if (!plan) return err("Invalid cable plan");
      return await chargeAndRecord({
        baseAmount: plan.price,
        orderType: "cable",
        network: plan.provider,
        networkId: Number(body.service_id || 0),
        planId: planCode,
        planName: plan.plan_name,
        mobile: String(body.smartcard_number),
        call: async () => {
          const r = await cdh("/cable/purchase/", {
            plan_id: planCode,
            cardnumber: String(body.smartcard_number),
            phone: String(body.phone),
          });
          return { ok: r.ok, data: r.data };
        },
      });
    }

    if (action === "buy_electricity") {
      const amount = Number(body.amount);
      if (!amount || amount < 100) return err("Minimum amount is ₦100");
      return await chargeAndRecord({
        baseAmount: amount,
        orderType: "electricity",
        network: String(body.disco || body.network_name || ""),
        networkId: Number(body.service_id),
        mobile: String(body.meter_no),
        planName: String(body.meter_type || "prepaid"),
        call: async () => {
          if (p === "1") {
            const r = await vtugate("/buyelectricity", {
              service_id: body.service_id,
              meter_no: body.meter_no,
              disco: body.disco,
              amount,
              phone_number: body.phone_number,
            });
            return { ok: r.ok, data: r.data };
          }
          const r = await cdh("/electricity/purchase/", {
            disco_id: Number(body.service_id),
            meter_number: String(body.meter_no),
            amount,
            meter_type: String(body.meter_type || "prepaid"),
            phone: String(body.phone_number),
          });
          return { ok: r.ok, data: r.data };
        },
      });
    }

    return err("Unknown action");
  } catch (e) {
    console.error("vtu-gateway error", e);
    return err((e as Error).message || "Unexpected error");
  }
});
