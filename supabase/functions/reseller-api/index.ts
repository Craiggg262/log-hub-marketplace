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

const GETATEXT_API_KEY = Deno.env.get('GETATEXT_API_KEY');
const GETATEXT_BASE_URL = 'https://getatext.com/api/v1';
const LOGGSPLUG_API_KEY = Deno.env.get('LOGGSPLUG_API_KEY');
const LOGGSPLUG_BASE_URL = 'https://loggsplug.online/api/reseller';
const NO1LOGS_API_KEY = Deno.env.get('NO1LOGS_API_KEY');
const NO1LOGS_BASE_URL = 'https://www.no1logs.com/api/v1';

const SMS_MARKUP = 2;
const USD_TO_NAIRA = 1600;
const LOGS_MARKUP = 1.5;
const LITE_PRICE_MULTIPLIER = 5010; // matches no1logs-api markup

const nairaPrice = (usd: number) =>
  parseFloat((usd * SMS_MARKUP * USD_TO_NAIRA).toFixed(2));

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

async function loggsplug(path: string, init?: RequestInit) {
  const res = await fetch(`${LOGGSPLUG_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': LOGGSPLUG_API_KEY ?? '',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth via x-api-key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('X-Api-Key');
    if (!apiKey) {
      return json({ error: 'Missing x-api-key header' }, 401);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: keyRow, error: keyErr } = await admin
      .from('api_keys')
      .select('id, user_id, is_active')
      .eq('api_key', apiKey)
      .maybeSingle();

    if (keyErr || !keyRow || !keyRow.is_active) {
      return json({ error: 'Invalid or inactive API key' }, 401);
    }
    const userId: string = keyRow.user_id;

    // Touch last_used_at (fire & forget)
    admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRow.id).then(() => {});

    const url = new URL(req.url);
    // Path can be /reseller-api/balance etc. Normalize to last segment(s)
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

    // ============ SMS: list services ============
    if (route === 'sms/services') {
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
            price: nairaPrice(usd),
            currency: 'NGN',
            stock: s.stock ?? 0,
            ttl: s.ttl ?? null,
          };
        });
      return json({ success: true, data: services });
    }

    // ============ SMS: buy number ============
    if (route === 'sms/buy') {
      const service_id = body.service_id;
      if (!service_id) return json({ error: 'service_id required' }, 400);

      const { data: priceData } = await getatext('/prices-info', { method: 'GET' });
      const items = Array.isArray(priceData?.prices) ? priceData.prices : Array.isArray(priceData) ? priceData : [priceData];
      const match = items.find((s: any) => s.api_name === service_id);
      if (!match) return json({ error: 'Service not found' }, 404);

      const apiUsd = parseFloat(match.price);
      const charged = nairaPrice(apiUsd);

      const { data: profile } = await admin
        .from('profiles').select('wallet_balance').eq('user_id', userId).maybeSingle();
      if (!profile) return json({ error: 'Profile not found' }, 404);
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

      const rental = rent.data;
      const rentalId = String(rental.id);
      const number = String(rental.number || 'waiting');
      const serviceName = rental.service_name || match.service_name || service_id;

      await admin.from('profiles').update({
        wallet_balance: Number(profile.wallet_balance) - charged,
      }).eq('user_id', userId);

      await admin.from('wallet_transactions').insert({
        user_id: userId,
        amount: -charged,
        transaction_type: 'sms_verification',
        description: `[API] SMS Verification - ${serviceName}`,
      });

      let timeRemaining = 20 * 60;
      if (rental.end_time) {
        const end = new Date(String(rental.end_time).replace(' ', 'T') + 'Z').getTime();
        const diff = Math.floor((end - Date.now()) / 1000);
        if (diff > 0 && diff < 86400) timeRemaining = diff;
      }
      const expiresAt = new Date(Date.now() + timeRemaining * 1000);

      await admin.from('sms_verification_orders').insert({
        user_id: userId,
        rental_id: rentalId,
        service_id,
        service_name: serviceName,
        phone_number: number !== 'waiting' ? number : null,
        api_price: apiUsd,
        charged_price: charged,
        status: number === 'waiting' ? 'waiting_number' : 'waiting_code',
        expires_at: expiresAt.toISOString(),
      });

      return json({
        success: true,
        data: {
          order_id: rentalId,
          phone_number: number,
          service_name: serviceName,
          charged_price: charged,
          time_remaining: timeRemaining,
          expires_at: expiresAt.toISOString(),
        },
      });
    }

    // ============ SMS: status / get code ============
    if (route === 'sms/status') {
      const id = body.order_id || body.id;
      if (!id) return json({ error: 'order_id required' }, 400);
      const { ok, data } = await getatext('/rental-status', {
        method: 'POST',
        body: JSON.stringify({ id: Number(id) || id }),
      });
      if (!ok) return json({ error: 'Failed' }, 502);
      const r = data || {};
      return json({
        success: true,
        data: {
          order_id: String(id),
          phone_number: r.number || null,
          code: r.code || r.sms_code || null,
          full_sms: r.full_sms || null,
          status: r.status || (r.code ? 'completed' : 'waiting'),
        },
      });
    }

    // ============ SMS: cancel ============
    if (route === 'sms/cancel') {
      const id = body.order_id || body.id;
      if (!id) return json({ error: 'order_id required' }, 400);
      const { ok, data } = await getatext('/cancel-rental', {
        method: 'POST',
        body: JSON.stringify({ id: Number(id) || id }),
      });
      if (!ok) return json({ error: data?.errors || 'Cancel failed' }, 502);

      // Refund if order found and not already refunded
      const { data: order } = await admin.from('sms_verification_orders')
        .select('id, charged_price, refunded, user_id')
        .eq('rental_id', String(id)).eq('user_id', userId).maybeSingle();
      if (order && !order.refunded) {
        const { data: p } = await admin.from('profiles').select('wallet_balance').eq('user_id', userId).maybeSingle();
        if (p) {
          await admin.from('profiles').update({
            wallet_balance: Number(p.wallet_balance) + Number(order.charged_price),
          }).eq('user_id', userId);
          await admin.from('wallet_transactions').insert({
            user_id: userId,
            amount: Number(order.charged_price),
            transaction_type: 'refund',
            description: `[API] SMS cancel refund - ${id}`,
          });
          await admin.from('sms_verification_orders').update({
            status: 'cancelled', refunded: true,
          }).eq('id', order.id);
        }
      }
      return json({ success: true, data: { order_id: String(id), status: 'cancelled' } });
    }

    // ============ LOGS: list products ============
    if (route === 'logs/products') {
      const { ok, data } = await loggsplug('/products', { method: 'GET' });
      if (!ok) return json({ error: 'Failed to fetch products' }, 502);
      const products = Array.isArray(data?.data) ? data.data : [];
      const HIDDEN_KEYWORDS = ['a to z amira', 'amira update', 'amira'];
      const HIDDEN_CATEGORIES = ['x/twitter', 'x / twitter', 'twitter', 'x'];
      const filtered = products
        .filter((p: any) => {
          const hay = `${p?.name ?? ''} ${p?.category ?? ''}`.toLowerCase();
          if (HIDDEN_KEYWORDS.some((k) => hay.includes(k))) return false;
          const cat = String(p?.category ?? '').toLowerCase().trim();
          if (HIDDEN_CATEGORIES.includes(cat)) return false;
          return true;
        })
        .map((p: any) => ({
          product_id: p.id,
          name: p.name,
          category: p.category,
          stock: p.stock,
          price: parseFloat(((p.reseller_price || p.base_price || 0) * LOGS_MARKUP).toFixed(2)),
          currency: 'NGN',
        }));
      return json({ success: true, data: filtered });
    }

    // ============ LOGS: buy ============
    if (route === 'logs/buy') {
      const productId = body.product_id;
      const qty = parseInt(String(body.qty ?? body.quantity ?? 1), 10);
      if (!productId || !qty || qty < 1) return json({ error: 'product_id and qty required' }, 400);

      // Check price first
      const prodRes = await loggsplug('/products', { method: 'GET' });
      const product = (prodRes.data?.data || []).find((p: any) => String(p.id) === String(productId));
      if (!product) return json({ error: 'Product not found' }, 404);
      const unitPrice = parseFloat(((product.reseller_price || product.base_price || 0) * LOGS_MARKUP).toFixed(2));
      const total = parseFloat((unitPrice * qty).toFixed(2));

      const { data: profile } = await admin.from('profiles').select('wallet_balance').eq('user_id', userId).maybeSingle();
      if (!profile) return json({ error: 'Profile not found' }, 404);
      if (Number(profile.wallet_balance) < total) {
        return json({ error: 'Insufficient balance', required: total, available: profile.wallet_balance }, 402);
      }

      const order = await loggsplug('/order', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, qty }),
      });
      if (!order.ok || !order.data?.success) {
        return json({ error: order.data?.message || 'Order failed', details: order.data }, 502);
      }

      await admin.from('profiles').update({
        wallet_balance: Number(profile.wallet_balance) - total,
      }).eq('user_id', userId);

      await admin.from('wallet_transactions').insert({
        user_id: userId,
        amount: -total,
        transaction_type: 'logs_purchase',
        description: `[API] Logs - ${product.name} x${qty}`,
      });

      const { data: orderRow } = await admin.from('universal_logs_orders').insert({
        user_id: userId,
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        price_per_unit: unitPrice,
        total_amount: total,
        status: 'completed',
        api_order_id: String(order.data?.order_id ?? ''),
        order_response: order.data,
      }).select('id').maybeSingle();

      return json({
        success: true,
        data: {
          order_id: orderRow?.id ?? null,
          api_order_id: order.data?.order_id ?? null,
          product_name: product.name,
          quantity: qty,
          unit_price: unitPrice,
          total_charged: total,
          credentials: order.data?.credentials ?? order.data?.data ?? null,
          raw: order.data,
        },
      });
    }

    return json({ error: 'Unknown endpoint', route }, 404);
  } catch (e: any) {
    console.error('reseller-api error:', e);
    return json({ error: e?.message ?? 'Internal error' }, 500);
  }
});
