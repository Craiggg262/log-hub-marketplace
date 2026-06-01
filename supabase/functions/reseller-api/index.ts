import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// === Providers ===
const GETATEXT_API_KEY = Deno.env.get('GETATEXT_API_KEY');
const GETATEXT_BASE_URL = 'https://getatext.com/api/v1';

const MTELSMS_API_KEY = Deno.env.get('MTELSMS_API_KEY');
const MTELSMS_BASE_URL = 'https://mtelsms.com/stubs/handler_api.php';

const FIVESIM_API_KEY = Deno.env.get('FIVESIM_API_KEY');
const FIVESIM_BASE_URL = 'https://5sim.net/v1';

// === Pricing: 1 USD = 1400 NGN + 50% markup => multiplier 2100 ===
const USD_TO_NAIRA = 1400;
const PRICE_MARKUP = 1.5;
const usdToNaira = (usd: number) =>
  parseFloat((usd * USD_TO_NAIRA * PRICE_MARKUP).toFixed(2));

// All US numbers must start with +1
function formatUsNumber(raw: unknown): string {
  if (raw === null || raw === undefined) return 'waiting';
  const s = String(raw).trim();
  if (!s || s === 'waiting') return 'waiting';
  if (s.startsWith('+')) return s;
  const digits = s.replace(/\D/g, '');
  if (!digits) return 'waiting';
  if (digits.startsWith('1')) return `+${digits}`;
  return `+1${digits}`;
}

// Format any international number — ensure leading +
function formatIntlNumber(raw: unknown): string {
  if (raw === null || raw === undefined) return 'waiting';
  const s = String(raw).trim();
  if (!s) return 'waiting';
  if (s.startsWith('+')) return s;
  const digits = s.replace(/\D/g, '');
  return digits ? `+${digits}` : 'waiting';
}

async function getatext(path: string, init?: RequestInit) {
  const res = await fetch(`${GETATEXT_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Auth': GETATEXT_API_KEY ?? '',
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function mtel(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ api_key: MTELSMS_API_KEY ?? '', action, ...params });
  const res = await fetch(`${MTELSMS_BASE_URL}?${qs.toString()}`, { method: 'GET' });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function fivesim(path: string, init?: RequestInit) {
  const res = await fetch(`${FIVESIM_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${FIVESIM_API_KEY ?? ''}`,
      'Accept': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('X-Api-Key');
    if (!apiKey) return json({ error: 'Missing x-api-key header' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: keyRow } = await admin
      .from('api_keys')
      .select('id, user_id, is_active')
      .eq('api_key', apiKey)
      .maybeSingle();

    if (!keyRow || !keyRow.is_active) return json({ error: 'Invalid or inactive API key' }, 401);
    const userId: string = keyRow.user_id;

    admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id).then(() => {});

    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p === 'reseller-api');
    const route = parts.slice(idx + 1).join('/') || (url.searchParams.get('action') ?? '');

    const body = req.method === 'POST'
      ? await req.json().catch(() => ({}))
      : Object.fromEntries(url.searchParams);

    // ============ BALANCE ============
    if (route === 'balance' || route === '') {
      const { data: profile } = await admin
        .from('profiles').select('wallet_balance, email, full_name').eq('user_id', userId).maybeSingle();
      return json({
        success: true,
        data: {
          wallet_balance: Number(profile?.wallet_balance ?? 0),
          currency: 'NGN',
          email: profile?.email,
          name: profile?.full_name,
        },
      });
    }

    // ============ LOGS: list products (HAND-UPLOADED ONLY) ============
    if (route === 'logs/products') {
      const { data: rows } = await admin
        .from('logs')
        .select('id, title, price, stock, in_stock, categories(name)')
        .eq('in_stock', true)
        .gt('stock', 0)
        .order('sort_order', { ascending: true });

      const items = (rows ?? []).map((r: any) => ({
        product_id: r.id,
        name: r.title,
        category: r.categories?.name ?? null,
        stock: r.stock,
        price: Number(r.price),
        currency: 'NGN',
      }));
      return json({ success: true, data: items });
    }

    // ============ LOGS: buy ============
    if (route === 'logs/buy') {
      const productId = String(body.product_id ?? '');
      const qty = parseInt(String(body.qty ?? body.quantity ?? 1), 10);
      if (!productId || !qty || qty < 1) return json({ error: 'product_id and qty required' }, 400);

      // Fetch product
      const { data: log } = await admin
        .from('logs').select('id, title, price, stock').eq('id', productId).maybeSingle();
      if (!log) return json({ error: 'Product not found' }, 404);
      if (Number(log.stock) < qty) return json({ error: 'Insufficient stock', available: log.stock }, 400);

      const unitPrice = Number(log.price);
      const total = parseFloat((unitPrice * qty).toFixed(2));

      // Live balance check
      const { data: profile } = await admin
        .from('profiles').select('wallet_balance').eq('user_id', userId).maybeSingle();
      if (!profile) return json({ error: 'Profile not found' }, 404);
      if (Number(profile.wallet_balance) < total) {
        return json({ error: 'Insufficient balance', required: total, available: profile.wallet_balance }, 402);
      }

      // Atomic order creation via service-role RPC
      const { data: rpcRes, error: rpcErr } = await admin.rpc('api_create_log_order', {
        p_user_id: userId,
        p_log_id: productId,
        p_quantity: qty,
        p_unit_price: unitPrice,
      });
      if (rpcErr) return json({ error: rpcErr.message || 'Order failed' }, 500);
      const rpc = (rpcRes as any) || {};
      if (!rpc.success) return json({ error: rpc.error || 'Order failed' }, 500);

      // Deduct wallet + transaction
      await admin.from('profiles').update({
        wallet_balance: Number(profile.wallet_balance) - total,
      }).eq('user_id', userId);

      await admin.from('wallet_transactions').insert({
        user_id: userId, amount: -total, transaction_type: 'logs_purchase',
        description: `[API] ${log.title} x${qty}`,
      });

      return json({
        success: true,
        data: {
          order_id: rpc.order_id,
          product_name: log.title,
          quantity: qty,
          unit_price: unitPrice,
          total_charged: total,
          credentials: rpc.credentials ?? [],
        },
      });
    }

    // ============ SMS: list services ============
    // server: "1" = getatext (USA), "2" = mtelsms (USA), "5sim" = 5sim (all countries)
    if (route === 'sms/services') {
      const server = String(body.server ?? '1');

      if (server === '1') {
        const { ok, data } = await getatext('/prices-info', { method: 'GET' });
        if (!ok) return json({ success: false, error: 'Failed to fetch services' }, 502);
        const items = Array.isArray(data?.prices) ? data.prices : Array.isArray(data) ? data : [data];
        const services = items
          .filter((s: any) => s && s.api_name)
          .map((s: any) => {
            const usd = parseFloat(s.price);
            return {
              service_id: s.api_name,
              name: s.service_name || s.api_name,
              price: usdToNaira(usd),
              currency: 'NGN',
              stock: s.stock ?? 0,
              server: '1',
              country: 'usa',
            };
          });
        return json({ success: true, data: services });
      }

      if (server === '2') {
        const { ok, data } = await mtel('allService');
        if (!ok || data?.status !== 'success') return json({ error: 'Failed to fetch services' }, 502);
        const services = (data.data || []).map((s: any) => ({
          service_id: String(s.service_id),
          name: s.name,
          price: usdToNaira(parseFloat(s.price)),
          currency: 'NGN',
          server: '2',
          country: 'usa',
          validity_time: s.validity_time,
        }));
        return json({ success: true, data: services });
      }

      if (server === '5sim') {
        // For 5sim, list services per country. Allow passing country & operator.
        const country = String(body.country ?? 'any');
        const operator = String(body.operator ?? 'any');
        const { ok, data } = await fivesim(`/guest/products/${country}/${operator}`);
        if (!ok) return json({ error: 'Failed to fetch services' }, 502);
        const services = Object.entries(data || {}).map(([name, info]: any) => ({
          service_id: name,
          name,
          price: usdToNaira(Number(info?.Price ?? 0)),
          currency: 'NGN',
          stock: info?.Qty ?? 0,
          server: '5sim',
          country,
          operator,
        }));
        return json({ success: true, data: services });
      }

      return json({ error: 'Invalid server. Use "1", "2", or "5sim".' }, 400);
    }

    // ============ SMS: buy number ============
    if (route === 'sms/buy') {
      const server = String(body.server ?? '1');
      const service_id = body.service_id;
      if (!service_id) return json({ error: 'service_id required' }, 400);

      const { data: profile } = await admin
        .from('profiles').select('wallet_balance').eq('user_id', userId).maybeSingle();
      if (!profile) return json({ error: 'Profile not found' }, 404);

      let charged = 0;
      let rentalId = '';
      let phoneNumber = 'waiting';
      let serviceName = String(service_id);
      let timeRemaining = 20 * 60;
      let country = 'usa';
      let operator: string | null = null;

      if (server === '1') {
        const { data: prices } = await getatext('/prices-info', { method: 'GET' });
        const items = Array.isArray(prices?.prices) ? prices.prices : Array.isArray(prices) ? prices : [prices];
        const match = items.find((s: any) => s.api_name === service_id);
        if (!match) return json({ error: 'Service not found' }, 404);
        const apiUsd = parseFloat(match.price);
        charged = usdToNaira(apiUsd);
        if (Number(profile.wallet_balance) < charged) {
          return json({ error: 'Insufficient balance', required: charged, available: profile.wallet_balance }, 402);
        }
        const rent = await getatext('/rent-a-number', {
          method: 'POST',
          body: JSON.stringify({ service: service_id, max_price: apiUsd * 2 }),
        });
        if (!rent.ok || rent.data?.status !== 'success') {
          return json({ error: rent.data?.errors || rent.data?.message || 'Failed to rent number' }, 502);
        }
        const r = rent.data;
        rentalId = String(r.id);
        phoneNumber = formatUsNumber(r.number);
        serviceName = r.service_name || match.service_name || String(service_id);
        if (r.end_time) {
          const end = new Date(String(r.end_time).replace(' ', 'T') + 'Z').getTime();
          const diff = Math.floor((end - Date.now()) / 1000);
          if (diff > 0 && diff < 86400) timeRemaining = diff;
        }
      } else if (server === '2') {
        const apiUsd = parseFloat(String(body.max_price ?? '3.5'));
        const wholesale = String(body.wholesale_status ?? 'false');
        const rent = await mtel('getNumber', {
          service_id: String(service_id),
          max_price: apiUsd.toString(),
          wholesale_status: wholesale,
        });
        if (!rent.ok || rent.data?.status !== 'success') {
          return json({ error: rent.data?.message || 'Failed to rent number' }, 502);
        }
        const r = rent.data?.data || {};
        const usd = parseFloat(String(r.service_price ?? apiUsd));
        charged = usdToNaira(usd);
        if (Number(profile.wallet_balance) < charged) {
          // attempt cancel upstream
          await mtel('cancelNumber', { id: String(r.id) });
          return json({ error: 'Insufficient balance', required: charged, available: profile.wallet_balance }, 402);
        }
        rentalId = String(r.id);
        phoneNumber = formatUsNumber(r.number);
        serviceName = r.service_name || String(service_id);
        if (r.time_remaining) timeRemaining = Number(r.time_remaining);
      } else if (server === '5sim') {
        country = String(body.country ?? 'any');
        operator = String(body.operator ?? 'any');
        const buy = await fivesim(`/user/buy/activation/${country}/${operator}/${service_id}`);
        if (!buy.ok) return json({ error: buy.data?.error || buy.data?.raw || 'Failed to buy number' }, 502);
        const r = buy.data || {};
        const usd = Number(r.price ?? 0);
        charged = usdToNaira(usd);
        if (Number(profile.wallet_balance) < charged) {
          await fivesim(`/user/cancel/${r.id}`);
          return json({ error: 'Insufficient balance', required: charged, available: profile.wallet_balance }, 402);
        }
        rentalId = String(r.id);
        phoneNumber = formatIntlNumber(r.phone);
        serviceName = String(service_id);
        if (r.expires) {
          const end = new Date(r.expires).getTime();
          const diff = Math.floor((end - Date.now()) / 1000);
          if (diff > 0 && diff < 86400) timeRemaining = diff;
        }
      } else {
        return json({ error: 'Invalid server' }, 400);
      }

      await admin.from('profiles').update({
        wallet_balance: Number(profile.wallet_balance) - charged,
      }).eq('user_id', userId);

      await admin.from('wallet_transactions').insert({
        user_id: userId,
        amount: -charged,
        transaction_type: 'sms_verification',
        description: `[API/${server}] ${serviceName}`,
      });

      const expiresAt = new Date(Date.now() + timeRemaining * 1000);
      await admin.from('sms_verification_orders').insert({
        user_id: userId,
        rental_id: rentalId,
        service_id: String(service_id),
        service_name: serviceName,
        phone_number: phoneNumber !== 'waiting' ? phoneNumber : null,
        api_price: 0,
        charged_price: charged,
        status: phoneNumber === 'waiting' ? 'waiting_number' : 'waiting_code',
        expires_at: expiresAt.toISOString(),
        provider: server === '1' ? 'getatext' : server === '2' ? 'mtelsms' : '5sim',
        country,
        operator,
      });

      return json({
        success: true,
        data: {
          order_id: rentalId,
          phone_number: phoneNumber,
          service_name: serviceName,
          server,
          country,
          operator,
          charged_price: charged,
          time_remaining: timeRemaining,
          expires_at: expiresAt.toISOString(),
        },
      });
    }

    // ============ SMS: status / code ============
    if (route === 'sms/status') {
      const id = body.order_id || body.id;
      if (!id) return json({ error: 'order_id required' }, 400);

      const { data: order } = await admin.from('sms_verification_orders')
        .select('provider, rental_id').eq('rental_id', String(id)).eq('user_id', userId).maybeSingle();
      const provider = order?.provider || body.server || 'getatext';

      let number: string | null = null;
      let code: string | null = null;
      let raw: any = null;

      if (provider === 'getatext') {
        const { data } = await getatext('/rental-status', {
          method: 'POST',
          body: JSON.stringify({ id: Number(id) || id }),
        });
        raw = data;
        number = data?.number ? formatUsNumber(data.number) : null;
        code = data?.code || data?.sms_code || null;
      } else if (provider === 'mtelsms') {
        const { data } = await mtel('getCode', { id: String(id) });
        raw = data;
        const r = data?.data || {};
        number = r.number && r.number !== 'waiting' ? formatUsNumber(r.number) : null;
        code = r.code && r.code !== 'waiting' ? String(r.code) : null;
      } else if (provider === '5sim') {
        const { data } = await fivesim(`/user/check/${id}`);
        raw = data;
        number = data?.phone ? formatIntlNumber(data.phone) : null;
        const sms = Array.isArray(data?.sms) ? data.sms : [];
        if (sms.length > 0) {
          const last = sms[sms.length - 1];
          code = last?.code || last?.text || null;
        }
      }

      if (number || code) {
        await admin.from('sms_verification_orders').update({
          ...(number ? { phone_number: number } : {}),
          ...(code ? { verification_code: code, status: 'completed' } : {}),
        }).eq('rental_id', String(id)).eq('user_id', userId);
      }

      return json({
        success: true,
        data: { order_id: String(id), phone_number: number, code, status: code ? 'completed' : 'waiting' },
      });
    }

    // ============ SMS: cancel + refund ============
    if (route === 'sms/cancel') {
      const id = body.order_id || body.id;
      if (!id) return json({ error: 'order_id required' }, 400);

      const { data: order } = await admin.from('sms_verification_orders')
        .select('id, charged_price, refunded, user_id, provider')
        .eq('rental_id', String(id)).eq('user_id', userId).maybeSingle();

      const provider = order?.provider || body.server || 'getatext';

      let ok = true;
      if (provider === 'getatext') {
        const r = await getatext('/cancel-rental', { method: 'POST', body: JSON.stringify({ id: Number(id) || id }) });
        ok = r.ok;
      } else if (provider === 'mtelsms') {
        const r = await mtel('cancelNumber', { id: String(id) });
        ok = r.ok && r.data?.status === 'success';
      } else if (provider === '5sim') {
        const r = await fivesim(`/user/cancel/${id}`);
        ok = r.ok;
      }

      if (!ok) return json({ error: 'Cancel failed' }, 502);

      if (order && !order.refunded) {
        const { data: p } = await admin.from('profiles').select('wallet_balance').eq('user_id', userId).maybeSingle();
        if (p) {
          await admin.from('profiles').update({
            wallet_balance: Number(p.wallet_balance) + Number(order.charged_price),
          }).eq('user_id', userId);
          await admin.from('wallet_transactions').insert({
            user_id: userId, amount: Number(order.charged_price),
            transaction_type: 'refund', description: `[API] SMS cancel refund - ${id}`,
          });
          await admin.from('sms_verification_orders').update({
            status: 'cancelled', refunded: true,
          }).eq('id', order.id);
        }
      }
      return json({ success: true, data: { order_id: String(id), status: 'cancelled' } });
    }

    return json({ error: 'Unknown endpoint', route }, 404);
  } catch (e: any) {
    console.error('reseller-api error:', e);
    return json({ error: e?.message ?? 'Internal error' }, 500);
  }
});
