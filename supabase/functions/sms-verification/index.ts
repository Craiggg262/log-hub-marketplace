import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GETATEXT_API_KEY = Deno.env.get('GETATEXT_API_KEY');
const GETATEXT_BASE_URL = 'https://getatext.com/api/v1';

// Pricing constants
const MARKUP_MULTIPLIER = 2; // 2x the API price
const USD_TO_NAIRA_RATE = 1600;

// Default rental window in seconds for active rental tracking on the client.
// Getatext returns end_time but no explicit "time_remaining"; default to 20 min.
const DEFAULT_RENTAL_SECONDS = 20 * 60;

function nairaPrice(usd: number) {
  return parseFloat((usd * MARKUP_MULTIPLIER * USD_TO_NAIRA_RATE).toFixed(2));
}

function nairaDisplay(amount: number) {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function getatext(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    'Auth': GETATEXT_API_KEY ?? '',
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${GETATEXT_BASE_URL}${path}`, { ...init, headers });
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;
    const { action, service_id, max_price, id } = await req.json();

    console.log(`SMS Verification (Getatext): action=${action}, userId=${userId}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ====== List all services with prices ======
    if (action === 'allService') {
      const { ok, json } = await getatext('/prices-info', { method: 'GET' });
      if (!ok) {
        return new Response(JSON.stringify({ status: 'error', message: json?.errors || 'Failed to fetch services' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // API returns { status, prices: [...] } or array or single object
      const items = Array.isArray(json?.prices)
        ? json.prices
        : Array.isArray(json)
          ? json
          : [json];
      const data = items
        .filter((s: any) => s && s.api_name)
        .map((s: any) => {
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
      return new Response(JSON.stringify({ status: 'success', data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ====== Get price for one service ======
    if (action === 'getPrice' && service_id) {
      const { ok, json } = await getatext('/prices-info', { method: 'GET' });
      if (!ok) {
        return new Response(JSON.stringify({ status: 'error', message: 'Failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const items = Array.isArray(json) ? json : [json];
      const match = items.find((s: any) => s.api_name === service_id);
      if (!match) {
        return new Response(JSON.stringify({ status: 'error', message: 'Service not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const usd = parseFloat(match.price);
      const naira = nairaPrice(usd);
      return new Response(JSON.stringify({
        status: 'success',
        data: {
          service_id: match.api_name,
          name: match.service_name,
          original_usd_price: String(usd),
          price: naira.toFixed(2),
          price_display: nairaDisplay(naira),
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ====== Rent a number ======
    if (action === 'getNumber' && service_id) {
      // Check user balance using API price
      const priceRes = await getatext('/prices-info', { method: 'GET' });
      const items = Array.isArray(priceRes.json) ? priceRes.json : [priceRes.json];
      const match = items.find((s: any) => s.api_name === service_id);
      if (!match) {
        return new Response(JSON.stringify({ status: 'error', error: 'Service not found' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const apiUsd = parseFloat(match.price);
      const charged = nairaPrice(apiUsd);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', userId)
        .single();
      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: 'Failed to fetch wallet balance' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (profile.wallet_balance < charged) {
        return new Response(JSON.stringify({
          error: 'Insufficient wallet balance',
          required: charged,
          available: profile.wallet_balance
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rent
      const rentBody: Record<string, unknown> = { service: service_id };
      if (max_price) rentBody.max_price = parseFloat(String(max_price)) * 2; // give headroom
      const rent = await getatext('/rent-a-number', {
        method: 'POST',
        body: JSON.stringify(rentBody),
      });

      if (!rent.ok || rent.json?.status !== 'success') {
        const errMsg = rent.json?.errors || rent.json?.message || 'Failed to rent number';
        return new Response(JSON.stringify({ status: 'error', error: errMsg }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const rental = rent.json;
      const rentalId = String(rental.id);
      const number = String(rental.number || 'waiting');
      const serviceName = rental.service_name || match.service_name || service_id;

      // Deduct wallet
      const newBalance = profile.wallet_balance - charged;
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', userId);
      if (updateError) {
        // Try to cancel the rental at provider since we can't deduct
        await getatext('/cancel-rental', { method: 'POST', body: JSON.stringify({ id: rental.id }) });
        return new Response(JSON.stringify({ error: 'Failed to deduct from wallet' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId,
        amount: -charged,
        transaction_type: 'sms_verification',
        description: `SMS Verification - ${serviceName}`,
      });

      // Compute time remaining from end_time if present
      let timeRemaining = DEFAULT_RENTAL_SECONDS;
      if (rental.end_time) {
        const end = new Date(rental.end_time.replace(' ', 'T') + 'Z').getTime();
        const diff = Math.floor((end - Date.now()) / 1000);
        if (diff > 0 && diff < 60 * 60 * 24) timeRemaining = diff;
      }
      const expiresAt = new Date(Date.now() + timeRemaining * 1000);

      await supabaseAdmin.from('sms_verification_orders').insert({
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

      const responseData = {
        id: rentalId,
        number,
        service_name: serviceName,
        time_remaining: timeRemaining,
        charged_price: charged,
        charged_price_display: nairaDisplay(charged),
        new_balance: newBalance,
      };

      return new Response(JSON.stringify({ status: 'success', data: responseData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ====== Poll status (number assignment / code) ======
    if ((action === 'getStatus' || action === 'getCode') && id) {
      const { ok, json } = await getatext('/rental-status', {
        method: 'POST',
        body: JSON.stringify({ id: Number(id) || id }),
      });
      if (!ok) {
        return new Response(JSON.stringify({ status: 'error', message: json?.errors || 'Failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const number = json.number ? String(json.number) : 'waiting';
      const code = json.code ? String(json.code) : null;

      // Persist updates
      if (number && number !== 'waiting') {
        await supabaseAdmin
          .from('sms_verification_orders')
          .update({
            phone_number: number,
            status: code ? 'completed' : 'waiting_code',
            ...(code ? { verification_code: code } : {}),
          })
          .eq('rental_id', String(id))
          .eq('user_id', userId);
      } else if (code) {
        await supabaseAdmin
          .from('sms_verification_orders')
          .update({ verification_code: code, status: 'completed' })
          .eq('rental_id', String(id))
          .eq('user_id', userId);
      }

      return new Response(JSON.stringify({
        status: 'success',
        data: {
          id: String(id),
          number,
          code: code ?? 'waiting',
          service_name: json.service_name,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ====== Cancel rental + refund ======
    if (action === 'cancelNumber' && id) {
      const { ok, json } = await getatext('/cancel-rental', {
        method: 'POST',
        body: JSON.stringify({ id: Number(id) || id }),
      });

      const cancelled = ok && (json?.status === 'cancelled' || json?.status === 'success');

      if (cancelled) {
        const { data: order } = await supabaseAdmin
          .from('sms_verification_orders')
          .select('charged_price, refunded, status')
          .eq('rental_id', String(id))
          .eq('user_id', userId)
          .single();

        if (order && !order.refunded && order.status !== 'completed') {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('wallet_balance')
            .eq('user_id', userId)
            .single();
          if (profile) {
            await supabaseAdmin
              .from('profiles')
              .update({ wallet_balance: profile.wallet_balance + order.charged_price })
              .eq('user_id', userId);
            await supabaseAdmin.from('wallet_transactions').insert({
              user_id: userId,
              amount: order.charged_price,
              transaction_type: 'refund',
              description: 'SMS Verification Refund - Cancelled',
            });
            await supabaseAdmin
              .from('sms_verification_orders')
              .update({ status: 'cancelled', refunded: true })
              .eq('rental_id', String(id))
              .eq('user_id', userId);

            return new Response(JSON.stringify({
              status: 'success',
              refunded_amount: order.charged_price,
              refunded_amount_display: nairaDisplay(order.charged_price),
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
        }

        return new Response(JSON.stringify({ status: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ status: 'error', message: json?.errors || 'Cancel failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ====== Refund expired ======
    if (action === 'refundExpired' && id) {
      const { data: order } = await supabaseAdmin
        .from('sms_verification_orders')
        .select('*')
        .eq('rental_id', String(id))
        .eq('user_id', userId)
        .single();

      if (order && !order.refunded && order.status !== 'completed') {
        // Try to cancel upstream too (best-effort)
        await getatext('/cancel-rental', {
          method: 'POST',
          body: JSON.stringify({ id: Number(id) || id }),
        }).catch(() => null);

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('wallet_balance')
          .eq('user_id', userId)
          .single();
        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({ wallet_balance: profile.wallet_balance + order.charged_price })
            .eq('user_id', userId);
          await supabaseAdmin.from('wallet_transactions').insert({
            user_id: userId,
            amount: order.charged_price,
            transaction_type: 'refund',
            description: 'SMS Verification Refund - Expired without code',
          });
          await supabaseAdmin
            .from('sms_verification_orders')
            .update({ status: 'expired', refunded: true })
            .eq('rental_id', String(id))
            .eq('user_id', userId);

          return new Response(JSON.stringify({
            status: 'success',
            refunded_amount: order.charged_price,
            refunded_amount_display: nairaDisplay(order.charged_price),
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      return new Response(JSON.stringify({ status: 'error', message: 'Order not eligible for refund' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ status: 'error', message: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('SMS Verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
