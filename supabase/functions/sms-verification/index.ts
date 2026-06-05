import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GETATEXT_API_KEY = Deno.env.get('GETATEXT_API_KEY');
const GETATEXT_BASE_URL = 'https://getatext.com/api/v1';
const MTELSMS_API_KEY = Deno.env.get('MTELSMS_API_KEY');
const MTELSMS_BASE_URL = 'https://mtelsms.com/stubs/handler_api.php';
const FIVESIM_API_KEY = Deno.env.get('FIVESIM_API_KEY');
const FIVESIM_BASE_URL = 'https://5sim.net/v1';

// Pricing: 1 USD = 1400 NGN, x2 markup (per admin request)
const USD_TO_NAIRA = 1400;
const PRICE_MARKUP = 2.0;
const DEFAULT_RENTAL_SECONDS = 20 * 60;

const nairaPrice = (usd: number) =>
  parseFloat((usd * USD_TO_NAIRA * PRICE_MARKUP).toFixed(2));
const nairaDisplay = (amt: number) =>
  `₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatUsNumber(raw: any): string {
  if (!raw) return 'waiting';
  const s = String(raw).trim();
  if (!s || s === 'waiting') return 'waiting';
  if (s.startsWith('+')) return s;
  const d = s.replace(/\D/g, '');
  if (!d) return 'waiting';
  return d.startsWith('1') ? `+${d}` : `+1${d}`;
}
function formatIntlNumber(raw: any): string {
  if (!raw) return 'waiting';
  const s = String(raw).trim();
  if (!s) return 'waiting';
  if (s.startsWith('+')) return s;
  const d = s.replace(/\D/g, '');
  return d ? `+${d}` : 'waiting';
}

async function getatext(path: string, init?: RequestInit) {
  const res = await fetch(`${GETATEXT_BASE_URL}${path}`, {
    ...init,
    headers: { 'Auth': GETATEXT_API_KEY ?? '', 'Content-Type': 'application/json', ...(init?.headers as any) },
  });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function mtel(action: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams({ api_key: MTELSMS_API_KEY ?? '', action, ...params });
  const res = await fetch(`${MTELSMS_BASE_URL}?${qs.toString()}`);
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function fivesim(path: string, init?: RequestInit) {
  const res = await fetch(`${FIVESIM_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${FIVESIM_API_KEY ?? ''}`,
      'Accept': 'application/json',
      ...(init?.headers as any),
    },
  });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;
    const payload = await req.json();
    const { action, service_id, max_price, id } = payload;
    const server = String(payload.server ?? '1'); // "1"=getatext, "2"=mtelsms, "5sim"=5sim
    const country = String(payload.country ?? 'usa');
    const operator = String(payload.operator ?? 'any');

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const respond = (b: any, status = 200) => new Response(JSON.stringify(b), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

    // ====================== LIST SERVICES ======================
    if (action === 'allService') {
      if (server === '1') {
        const { ok, json } = await getatext('/prices-info', { method: 'GET' });
        if (!ok) return respond({ status: 'error', message: 'Failed to fetch services' });
        const items = Array.isArray(json?.prices) ? json.prices : Array.isArray(json) ? json : [json];
        const data = items.filter((s: any) => s && s.api_name).map((s: any) => {
          const usd = parseFloat(s.price);
          const naira = nairaPrice(usd);
          return {
            service_id: s.api_name,
            name: s.service_name || s.api_name,
            price: naira.toFixed(2),
            price_display: nairaDisplay(naira),
            original_usd_price: String(usd),
            validity_time: String(s.ttl ?? ''),
            stock: s.stock ?? 0,
          };
        });
        return respond({ status: 'success', data });
      }
      if (server === '2') {
        const { ok, json } = await mtel('allService');
        if (!ok || json?.status !== 'success') return respond({ status: 'error', message: 'Failed to fetch services' });
        const data = (json.data || []).map((s: any) => {
          const usd = parseFloat(s.price);
          const naira = nairaPrice(usd);
          return {
            service_id: String(s.service_id),
            name: s.name,
            price: naira.toFixed(2),
            price_display: nairaDisplay(naira),
            original_usd_price: String(usd),
            validity_time: String(s.validity_time ?? ''),
          };
        });
        return respond({ status: 'success', data });
      }
      if (server === '5sim') {
        // Use /guest/prices to surface the cheapest real operator price, so the
        // listed price matches what the user will pay if they pick the cheapest
        // operator in the buy modal.
        const { ok, json } = await fivesim(`/guest/prices?country=${country}`);
        if (!ok) return respond({ status: 'error', message: 'Failed to fetch services' });
        const countryBlock = (json && json[country]) || {};
        const data = Object.entries(countryBlock)
          .map(([svc, ops]: any) => {
            if (!ops || typeof ops !== 'object') return null;
            const operatorEntries = Object.entries(ops).filter(([_, info]: any) => info && typeof info === 'object' && 'cost' in info);
            if (operatorEntries.length === 0) return null;
            let cheapestUsd = Infinity;
            let totalStock = 0;
            for (const [_, info] of operatorEntries as any) {
              const usd = Number(info.cost ?? 0);
              if (usd > 0 && usd < cheapestUsd) cheapestUsd = usd;
              totalStock += Number(info.count ?? 0);
            }
            if (!isFinite(cheapestUsd)) return null;
            const naira = nairaPrice(cheapestUsd);
            return {
              service_id: svc,
              name: svc,
              price: naira.toFixed(2),
              price_display: `From ${nairaDisplay(naira)}`,
              original_usd_price: String(cheapestUsd),
              validity_time: '',
              stock: totalStock,
            };
          })
          .filter(Boolean);
        return respond({ status: 'success', data });
      }
      return respond({ status: 'error', message: 'Invalid server' }, 400);
    }

    // ====================== 5sim: list countries ======================
    if (action === '5sim_countries') {
      const { ok, json } = await fivesim(`/guest/countries`);
      if (!ok) return respond({ status: 'error', message: 'Failed' });
      const countries = Object.entries(json || {}).map(([code, info]: any) => ({
        code,
        name: info?.text_en || code,
      })).sort((a, b) => a.name.localeCompare(b.name));
      return respond({ status: 'success', data: countries });
    }

    // ====================== 5sim: list operators for service+country (with prices) ======================
    if (action === '5sim_operators' && service_id) {
      const { ok, json } = await fivesim(`/guest/prices?country=${country}&product=${service_id}`);
      if (!ok) return respond({ status: 'error', message: 'Failed' });
      const countryBlock = (json && json[country]) || {};
      const serviceBlock = countryBlock[service_id] || {};
      const operators = Object.entries(serviceBlock).map(([op, info]: any) => {
        const usd = Number(info?.cost ?? 0);
        const naira = nairaPrice(usd);
        return {
          operator: op,
          price: naira.toFixed(2),
          price_display: nairaDisplay(naira),
          original_usd_price: String(usd),
          stock: info?.count ?? 0,
        };
      }).sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      return respond({ status: 'success', data: operators });
    }

    // ====================== BUY NUMBER ======================
    if (action === 'getNumber' && service_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('wallet_balance').eq('user_id', userId).single();
      if (profileError || !profile) return respond({ error: 'Failed to fetch wallet balance' }, 500);

      let charged = 0;
      let rentalId = '';
      let phoneNumber = 'waiting';
      let serviceName = String(service_id);
      let timeRemaining = DEFAULT_RENTAL_SECONDS;
      let provider = 'getatext';
      let countryStored = 'usa';
      let operatorStored: string | null = null;

      if (server === '1') {
        const apiUsd = parseFloat(String(max_price ?? 0)) || 0.5;
        charged = nairaPrice(apiUsd);
        if (profile.wallet_balance < charged) {
          return respond({ error: 'Insufficient wallet balance', required: charged, available: profile.wallet_balance }, 400);
        }
        const rent = await getatext('/rent-a-number', {
          method: 'POST',
          body: JSON.stringify({ service: service_id, max_price: apiUsd * 2 }),
        });
        if (!rent.ok || rent.json?.status !== 'success') {
          return respond({ status: 'error', error: rent.json?.errors || rent.json?.message || 'Failed to rent number' }, 400);
        }
        const r = rent.json;
        rentalId = String(r.id);
        phoneNumber = formatUsNumber(r.number);
        serviceName = r.service_name || String(service_id);
        if (r.end_time) {
          const end = new Date(String(r.end_time).replace(' ', 'T') + 'Z').getTime();
          const diff = Math.floor((end - Date.now()) / 1000);
          if (diff > 0 && diff < 86400) timeRemaining = diff;
        }
      } else if (server === '2') {
        provider = 'mtelsms';
        const apiUsd = parseFloat(String(max_price ?? '3.5')) || 3.5;
        const rent = await mtel('getNumber', {
          service_id: String(service_id),
          max_price: apiUsd.toString(),
          wholesale_status: 'false',
        });
        if (!rent.ok || rent.json?.status !== 'success') {
          return respond({ status: 'error', error: rent.json?.message || 'Failed to rent number' }, 400);
        }
        const r = rent.json?.data || {};
        const usd = parseFloat(String(r.service_price ?? apiUsd));
        charged = nairaPrice(usd);
        if (profile.wallet_balance < charged) {
          await mtel('cancelNumber', { id: String(r.id) });
          return respond({ error: 'Insufficient wallet balance', required: charged, available: profile.wallet_balance }, 400);
        }
        rentalId = String(r.id);
        phoneNumber = formatUsNumber(r.number);
        serviceName = r.service_name || String(service_id);
        if (r.time_remaining) timeRemaining = Number(r.time_remaining);
      } else if (server === '5sim') {
        provider = '5sim';
        countryStored = country;
        operatorStored = operator;
        const buy = await fivesim(`/user/buy/activation/${country}/${operator}/${service_id}`);
        if (!buy.ok) {
          return respond({ status: 'error', error: buy.json?.error || buy.json?.raw || 'Failed to rent number' }, 400);
        }
        const r = buy.json || {};
        const usd = Number(r.price ?? 0);
        charged = nairaPrice(usd);
        if (profile.wallet_balance < charged) {
          await fivesim(`/user/cancel/${r.id}`);
          return respond({ error: 'Insufficient wallet balance', required: charged, available: profile.wallet_balance }, 400);
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
        return respond({ status: 'error', error: 'Invalid server' }, 400);
      }

      const newBalance = profile.wallet_balance - charged;
      const { error: updateError } = await admin.from('profiles').update({ wallet_balance: newBalance }).eq('user_id', userId);
      if (updateError) {
        // best-effort cancel
        if (provider === 'getatext') await getatext('/cancel-rental', { method: 'POST', body: JSON.stringify({ id: rentalId }) });
        if (provider === 'mtelsms') await mtel('cancelNumber', { id: rentalId });
        if (provider === '5sim') await fivesim(`/user/cancel/${rentalId}`);
        return respond({ error: 'Failed to deduct from wallet' }, 500);
      }

      await admin.from('wallet_transactions').insert({
        user_id: userId, amount: -charged,
        transaction_type: 'sms_verification',
        description: `SMS Verification (${provider}) - ${serviceName}`,
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
        provider,
        country: countryStored,
        operator: operatorStored,
      });

      return respond({
        status: 'success',
        data: {
          id: rentalId,
          number: phoneNumber,
          service_name: serviceName,
          time_remaining: timeRemaining,
          charged_price: charged,
          charged_price_display: nairaDisplay(charged),
          new_balance: newBalance,
          provider,
          country: countryStored,
          operator: operatorStored,
        },
      });
    }

    // ====================== STATUS / CODE ======================
    if ((action === 'getStatus' || action === 'getCode') && id) {
      const { data: order } = await admin.from('sms_verification_orders')
        .select('provider').eq('rental_id', String(id)).eq('user_id', userId).maybeSingle();
      const provider = order?.provider || 'getatext';

      let number: string | null = null;
      let code: string | null = null;

      if (provider === 'getatext') {
        const { ok, json } = await getatext('/rental-status', {
          method: 'POST', body: JSON.stringify({ id: Number(id) || id }),
        });
        if (!ok) return respond({ status: 'error', message: 'Failed' });
        number = json.number ? formatUsNumber(json.number) : null;
        if (json.code) code = String(json.code);
        else if (json.sms) code = String(json.sms);
        else if (Array.isArray(json.messages) && json.messages.length > 0) {
          const last = json.messages[json.messages.length - 1];
          code = last?.code ? String(last.code) : (last?.text ? String(last.text) : null);
        } else if (Array.isArray(json.sms_messages) && json.sms_messages.length > 0) {
          const last = json.sms_messages[json.sms_messages.length - 1];
          code = last?.code ? String(last.code) : (last?.text ? String(last.text) : null);
        }
      } else if (provider === 'mtelsms') {
        const { ok, json } = await mtel('getCode', { id: String(id) });
        if (!ok) return respond({ status: 'error', message: 'Failed' });
        const r = json?.data || {};
        number = r.number && r.number !== 'waiting' ? formatUsNumber(r.number) : null;
        code = r.code && r.code !== 'waiting' ? String(r.code) : null;
      } else if (provider === '5sim') {
        const { ok, json } = await fivesim(`/user/check/${id}`);
        if (!ok) return respond({ status: 'error', message: 'Failed' });
        number = json?.phone ? formatIntlNumber(json.phone) : null;
        const sms = Array.isArray(json?.sms) ? json.sms : [];
        if (sms.length > 0) {
          const last = sms[sms.length - 1];
          code = last?.code || last?.text || null;
        }
      }

      // Cached code from DB
      if (!code) {
        const { data: existing } = await admin.from('sms_verification_orders')
          .select('verification_code').eq('rental_id', String(id)).eq('user_id', userId).maybeSingle();
        if (existing?.verification_code) code = existing.verification_code;
      }

      if (number || code) {
        await admin.from('sms_verification_orders').update({
          ...(number ? { phone_number: number } : {}),
          ...(code ? { verification_code: code, status: 'completed' } : (number ? { status: 'waiting_code' } : {})),
        }).eq('rental_id', String(id)).eq('user_id', userId);
      }

      return respond({
        status: 'success',
        data: { id: String(id), number: number ?? 'waiting', code: code ?? 'waiting' },
      });
    }

    // ====================== CANCEL ======================
    if (action === 'cancelNumber' && id) {
      const { data: order } = await admin.from('sms_verification_orders')
        .select('charged_price, refunded, status, provider')
        .eq('rental_id', String(id)).eq('user_id', userId).single();
      const provider = order?.provider || 'getatext';

      let ok = false;
      if (provider === 'getatext') {
        const r = await getatext('/cancel-rental', { method: 'POST', body: JSON.stringify({ id: Number(id) || id }) });
        ok = r.ok && (r.json?.status === 'cancelled' || r.json?.status === 'success');
      } else if (provider === 'mtelsms') {
        const r = await mtel('cancelNumber', { id: String(id) });
        ok = r.ok && r.json?.status === 'success';
      } else if (provider === '5sim') {
        const r = await fivesim(`/user/cancel/${id}`);
        ok = r.ok;
      }
      if (!ok) return respond({ status: 'error', message: 'Cancel failed' });

      if (order && !order.refunded && order.status !== 'completed') {
        const { data: profile } = await admin.from('profiles').select('wallet_balance').eq('user_id', userId).single();
        if (profile) {
          await admin.from('profiles').update({
            wallet_balance: profile.wallet_balance + order.charged_price,
          }).eq('user_id', userId);
          await admin.from('wallet_transactions').insert({
            user_id: userId, amount: order.charged_price,
            transaction_type: 'refund', description: 'SMS Verification Refund - Cancelled',
          });
          await admin.from('sms_verification_orders').update({
            status: 'cancelled', refunded: true,
          }).eq('rental_id', String(id)).eq('user_id', userId);

          return respond({
            status: 'success',
            refunded_amount: order.charged_price,
            refunded_amount_display: nairaDisplay(order.charged_price),
          });
        }
      }
      return respond({ status: 'success' });
    }

    // ====================== REFUND EXPIRED ======================
    if (action === 'refundExpired' && id) {
      const { data: order } = await admin.from('sms_verification_orders')
        .select('*').eq('rental_id', String(id)).eq('user_id', userId).single();
      if (order && !order.refunded && order.status !== 'completed') {
        const provider = order.provider || 'getatext';
        if (provider === 'getatext') {
          await getatext('/cancel-rental', { method: 'POST', body: JSON.stringify({ id: Number(id) || id }) }).catch(() => null);
        } else if (provider === 'mtelsms') {
          await mtel('cancelNumber', { id: String(id) }).catch(() => null);
        } else if (provider === '5sim') {
          await fivesim(`/user/cancel/${id}`).catch(() => null);
        }
        const { data: profile } = await admin.from('profiles').select('wallet_balance').eq('user_id', userId).single();
        if (profile) {
          await admin.from('profiles').update({
            wallet_balance: profile.wallet_balance + order.charged_price,
          }).eq('user_id', userId);
          await admin.from('wallet_transactions').insert({
            user_id: userId, amount: order.charged_price,
            transaction_type: 'refund', description: 'SMS Verification Refund - Expired',
          });
          await admin.from('sms_verification_orders').update({
            status: 'expired', refunded: true,
          }).eq('rental_id', String(id)).eq('user_id', userId);
          return respond({
            status: 'success',
            refunded_amount: order.charged_price,
            refunded_amount_display: nairaDisplay(order.charged_price),
          });
        }
      }
      return respond({ status: 'error', message: 'Order not eligible for refund' });
    }

    // ====================== EXPIRE STALE (auto-refund all expired/unrefunded for user) ======================
    if (action === 'expireStale') {
      const { data: stale } = await admin.from('sms_verification_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('refunded', false)
        .not('status', 'in', '("completed","code_received","cancelled","expired","refunded")')
        .lt('expires_at', new Date().toISOString());

      const refunded: any[] = [];
      if (stale && stale.length) {
        const { data: profile } = await admin.from('profiles').select('wallet_balance').eq('user_id', userId).single();
        let balance = Number(profile?.wallet_balance ?? 0);
        for (const order of stale) {
          const provider = order.provider || 'getatext';
          try {
            if (provider === 'getatext') {
              await getatext('/cancel-rental', { method: 'POST', body: JSON.stringify({ id: Number(order.rental_id) || order.rental_id }) });
            } else if (provider === 'mtelsms') {
              await mtel('cancelNumber', { id: String(order.rental_id) });
            } else if (provider === '5sim') {
              await fivesim(`/user/cancel/${order.rental_id}`);
            }
          } catch (_) {}
          balance += Number(order.charged_price);
          await admin.from('wallet_transactions').insert({
            user_id: userId, amount: order.charged_price,
            transaction_type: 'refund', description: 'SMS Verification Refund - Expired',
          });
          await admin.from('sms_verification_orders').update({
            status: 'expired', refunded: true,
          }).eq('id', order.id);
          refunded.push({ id: order.rental_id, amount: order.charged_price });
        }
        await admin.from('profiles').update({ wallet_balance: balance }).eq('user_id', userId);
      }
      return respond({ status: 'success', refunded_count: refunded.length, refunded });
    }

    return respond({ status: 'error', message: 'Unknown action' }, 400);
  } catch (error: any) {
    console.error('SMS Verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
