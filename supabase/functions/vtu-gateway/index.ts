// VTU Gateway - proxies to Portal 1 (vtugate.com) and Portal 2 (cheapdatahub.ng)
// Applies a 20% markup to all user-facing prices.
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
  const ok = res.ok && (data?.status === "true" || data?.status === true || data?.status === 1);
  return { ok, status: res.status, data };
}

// CheapDataHub fallback network IDs (standard convention)
const CDH_NETWORKS = [
  { id: 1, name: "MTN" },
  { id: 2, name: "Airtel" },
  { id: 3, name: "Glo" },
  { id: 4, name: "9mobile" },
];
const CDH_DISCOS = [
  { id: 1, name: "Ikeja Electric (IKEDC)" },
  { id: 2, name: "Eko Electric (EKEDC)" },
  { id: 3, name: "Ibadan Electric (IBEDC)" },
  { id: 4, name: "Abuja Electric (AEDC)" },
  { id: 5, name: "Kano Electric (KEDCO)" },
  { id: 6, name: "Port Harcourt Electric (PHED)" },
  { id: 7, name: "Enugu Electric (EEDC)" },
  { id: 8, name: "Kaduna Electric (KAEDC)" },
  { id: 9, name: "Jos Electric (JED)" },
  { id: 10, name: "Benin Electric (BEDC)" },
  { id: 11, name: "Yola Electric (YEDC)" },
];
const CDH_CABLE = [
  { id: 1, name: "DStv" },
  { id: 2, name: "GOtv" },
  { id: 3, name: "StarTimes" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, portal } = body as { action: string; portal: "1" | "2" };
    const p = String(portal);

    // Public read-only actions (no auth required)
    if (action === "fetch_services") {
      const service_type = body.service_type as string;
      if (p === "1") {
        const r = await vtugate("/fetchservices", { service_type });
        if (!r.ok) return json({ error: r.data?.message || "Failed" }, 400);
        return json({ services: r.data.data });
      } else {
        if (service_type === "airtime" || service_type === "data") {
          return json({ services: CDH_NETWORKS.map((n) => ({ service_id: n.id, network_name: n.name })) });
        }
        if (service_type === "electricity") {
          return json({ services: CDH_DISCOS.map((d) => ({ service_id: d.id, network_name: d.name })) });
        }
        if (service_type === "tv") {
          return json({ services: CDH_CABLE.map((c) => ({ service_id: c.id, network_name: c.name })) });
        }
        return json({ services: [] });
      }
    }

    if (action === "fetch_data_plans") {
      if (p === "1") {
        const r = await vtugate("/fetchdataplans", { service_id: body.service_id });
        if (!r.ok) return json({ error: r.data?.message || "Failed" }, 400);
        const plans = (r.data?.data?.data_plans || []).map((pl: any) => ({
          plan_code: String(pl.plan_code ?? pl.id ?? pl.plan_id ?? ""),
          plan_name: pl.plan_name ?? pl.name ?? "",
          amount: Number(pl.amount ?? pl.price ?? 0),
          validity: pl.validity ?? pl.duration ?? "",
        }));
        return json({ plans });
      }
      // Portal 2 has no live list; return empty and UI shows manual bundle_id input
      return json({ plans: [] });
    }

    if (action === "verify_cabletv") {
      if (p === "1") {
        const r = await vtugate("/verifycabletv", {
          service_id: body.service_id,
          phone: body.phone,
          smartcard_number: body.smartcard_number,
        });
        if (!r.ok) return json({ error: r.data?.message || "Verification failed" }, 400);
        return json({
          smartcard_name: r.data?.data?.smartcard_name,
          cable_plans: r.data?.data?.cable_plans || [],
        });
      }
      // Portal 2: no verify endpoint documented; skip
      return json({ smartcard_name: null, cable_plans: [] });
    }

    if (action === "verify_electricity") {
      if (p === "1") {
        const r = await vtugate("/verifyelectricity", {
          service_id: body.service_id,
          meter_no: body.meter_no,
          disco: body.disco,
        });
        if (!r.ok) return json({ error: r.data?.message || "Verification failed" }, 400);
        return json({ meter_name: r.data?.data?.meter_name });
      }
      return json({ meter_name: null });
    }

    // Authenticated actions
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supaUser.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Common: validate balance, deduct, insert order, call provider
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
        return json({ error: "Insufficient wallet balance" }, 400);
      }

      // Deduct
      await supa
        .from("profiles")
        .update({ wallet_balance: Number(profile.wallet_balance) - userCharge })
        .eq("user_id", user.id);

      // Insert order pending
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
        // Refund
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
        return json({ error: result.data?.message || "Provider transaction failed", details: result.data }, 400);
      }

      // Log wallet transaction
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
      if (!amount || amount < 50) return json({ error: "Enter valid amount" }, 400);
      if (!/^0\d{10}$/.test(phone)) return json({ error: "Invalid phone number" }, 400);

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
          } else {
            const r = await cdh("/airtime/purchase/", {
              provider_id: Number(body.service_id),
              phone_number: phone,
              amount,
            });
            return { ok: r.ok, data: r.data };
          }
        },
      });
    }

    if (action === "buy_data") {
      const phone = String(body.phone_number || "");
      if (!/^0\d{10}$/.test(phone)) return json({ error: "Invalid phone number" }, 400);

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
      } else {
        // Portal 2 - we need bundle_id and price. The user provides both (price = provider cost).
        const amount = Number(body.amount);
        return await chargeAndRecord({
          baseAmount: amount,
          orderType: "data",
          network: String(body.network_name || ""),
          networkId: Number(body.service_id || 0),
          planId: Number(body.bundle_id),
          planName: `Bundle #${body.bundle_id}`,
          mobile: phone,
          call: async () => {
            const r = await cdh("/data/purchase/", {
              bundle_id: Number(body.bundle_id),
              phone_number: phone,
            });
            return { ok: r.ok, data: r.data };
          },
        });
      }
    }

    if (action === "buy_cabletv") {
      const amount = Number(body.amount);
      return await chargeAndRecord({
        baseAmount: amount,
        orderType: "cable",
        network: String(body.provider_name || "Cable"),
        networkId: Number(body.service_id),
        planName: String(body.plan_name || ""),
        mobile: String(body.smartcard_number),
        call: async () => {
          if (p === "1") {
            const r = await vtugate("/buycabletv", {
              service_id: body.service_id,
              phone: body.phone,
              smartcard_number: body.smartcard_number,
              amount,
              plan_code: body.plan_code,
              plan_name: body.plan_name,
            });
            return { ok: r.ok, data: r.data };
          } else {
            const r = await cdh("/cable/purchase/", {
              plan_id: Number(body.plan_code),
              cardnumber: String(body.smartcard_number),
              phone: String(body.phone),
            });
            return { ok: r.ok, data: r.data };
          }
        },
      });
    }

    if (action === "buy_electricity") {
      const amount = Number(body.amount);
      return await chargeAndRecord({
        baseAmount: amount,
        orderType: "electricity",
        network: String(body.disco || ""),
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
          } else {
            const r = await cdh("/electricity/purchase/", {
              disco_id: Number(body.service_id),
              meter_number: String(body.meter_no),
              amount,
              meter_type: String(body.meter_type || "prepaid"),
              phone: String(body.phone_number),
            });
            return { ok: r.ok, data: r.data };
          }
        },
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("vtu-gateway error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
