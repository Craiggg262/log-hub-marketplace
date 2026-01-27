import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MTELSMS_API_KEY = Deno.env.get('MTELSMS_API_KEY');
const MTELSMS_BASE_URL = 'https://mtelsms.com/stubs/handler_api.php';

// Pricing constants
const MARKUP_MULTIPLIER = 2.8; // 180% markup = 2.8x original price
const USD_TO_NAIRA_RATE = 1600;

serve(async (req) => {
  // Handle CORS preflight
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

    console.log(`SMS Verification request: action=${action}, userId=${userId}`);

    let apiUrl = `${MTELSMS_BASE_URL}?api_key=${MTELSMS_API_KEY}&action=${action}`;

    // Add action-specific parameters
    if (action === 'getNumber' && service_id) {
      apiUrl += `&service_id=${service_id}&max_price=${max_price || 5.00}&wholesale_status=false`;
    } else if (['getStatus', 'getCode', 'cancelNumber'].includes(action) && id) {
      apiUrl += `&id=${id}`;
    } else if (action === 'getPrice' && service_id) {
      apiUrl += `&service_id=${service_id}`;
    }

    console.log(`Calling MTELSMS API: ${action}`);

    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log(`MTELSMS response:`, JSON.stringify(data));

    // For allService action, apply markup and convert to Naira
    if (action === 'allService' && data.status === 'success' && data.data) {
      data.data = data.data.map((service: any) => {
        const originalPrice = parseFloat(service.price);
        const markedUpPrice = originalPrice * MARKUP_MULTIPLIER;
        const nairaPrice = markedUpPrice * USD_TO_NAIRA_RATE;
        
        return {
          ...service,
          original_usd_price: service.price,
          price: nairaPrice.toFixed(2), // Price in Naira
          price_display: `₦${nairaPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        };
      });
    }

    // For getPrice action, apply markup and convert to Naira
    if (action === 'getPrice' && data.status === 'success' && data.data) {
      const originalPrice = parseFloat(data.data.price);
      const markedUpPrice = originalPrice * MARKUP_MULTIPLIER;
      const nairaPrice = markedUpPrice * USD_TO_NAIRA_RATE;
      
      data.data = {
        ...data.data,
        original_usd_price: data.data.price,
        price: nairaPrice.toFixed(2),
        price_display: `₦${nairaPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };
    }

    // For getNumber action, deduct from wallet and create order record
    if (action === 'getNumber' && data.status === 'success' && data.data?.service_price) {
      const apiPrice = parseFloat(data.data.service_price);
      const markedUpPrice = apiPrice * MARKUP_MULTIPLIER;
      const nairaPrice = markedUpPrice * USD_TO_NAIRA_RATE;
      
      // Get current wallet balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return new Response(JSON.stringify({ error: 'Failed to fetch wallet balance' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      if (profile.wallet_balance < nairaPrice) {
        // Cancel the number since user can't afford it
        await fetch(`${MTELSMS_BASE_URL}?api_key=${MTELSMS_API_KEY}&action=cancelNumber&id=${data.data.id}`);
        return new Response(JSON.stringify({ 
          error: 'Insufficient wallet balance',
          required: nairaPrice,
          available: profile.wallet_balance
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Deduct from wallet using service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const newBalance = profile.wallet_balance - nairaPrice;
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating wallet:', updateError);
        // Cancel the number if we couldn't deduct
        await fetch(`${MTELSMS_BASE_URL}?api_key=${MTELSMS_API_KEY}&action=cancelNumber&id=${data.data.id}`);
        return new Response(JSON.stringify({ error: 'Failed to deduct from wallet' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Record transaction
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId,
        amount: -nairaPrice,
        transaction_type: 'sms_verification',
        description: `SMS Verification - ${data.data.service_name}`
      });

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + (data.data.time_remaining * 1000));

      // Create order record
      await supabaseAdmin.from('sms_verification_orders').insert({
        user_id: userId,
        rental_id: data.data.id,
        service_id: service_id,
        service_name: data.data.service_name,
        phone_number: data.data.number !== 'waiting' ? data.data.number : null,
        api_price: apiPrice,
        charged_price: nairaPrice,
        status: data.data.number === 'waiting' ? 'waiting_number' : 'waiting_code',
        expires_at: expiresAt.toISOString()
      });

      console.log(`Deducted ₦${nairaPrice.toFixed(2)} from user ${userId} wallet for SMS verification`);

      // Add display price to response
      data.data.charged_price = nairaPrice;
      data.data.charged_price_display = `₦${nairaPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      data.data.new_balance = newBalance;
    }

    // For getStatus action, update order with number if received
    if (action === 'getStatus' && data.status === 'success' && data.data && id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      if (data.data.number !== 'waiting') {
        await supabaseAdmin
          .from('sms_verification_orders')
          .update({ 
            phone_number: data.data.number,
            status: 'waiting_code'
          })
          .eq('rental_id', id)
          .eq('user_id', userId);
      }
    }

    // For getCode action, update order with code if received
    if (action === 'getCode' && data.status === 'success' && data.data && id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      if (data.data.code && data.data.code !== 'waiting') {
        await supabaseAdmin
          .from('sms_verification_orders')
          .update({ 
            verification_code: data.data.code,
            status: 'completed'
          })
          .eq('rental_id', id)
          .eq('user_id', userId);
      }
    }

    // For cancelNumber with refund, credit wallet back
    if (action === 'cancelNumber' && data.status === 'success' && id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Get the order to know how much to refund
      const { data: order } = await supabaseAdmin
        .from('sms_verification_orders')
        .select('charged_price, refunded, status')
        .eq('rental_id', id)
        .eq('user_id', userId)
        .single();

      if (order && !order.refunded && order.status !== 'completed') {
        // Refund the amount
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

          // Record refund transaction
          await supabaseAdmin.from('wallet_transactions').insert({
            user_id: userId,
            amount: order.charged_price,
            transaction_type: 'refund',
            description: `SMS Verification Refund - Cancelled`
          });

          // Update order as refunded
          await supabaseAdmin
            .from('sms_verification_orders')
            .update({ 
              status: 'cancelled',
              refunded: true 
            })
            .eq('rental_id', id)
            .eq('user_id', userId);

          data.refunded_amount = order.charged_price;
          data.refunded_amount_display = `₦${order.charged_price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
    }

    // Handle expired rentals - refund action
    if (action === 'refundExpired' && id) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Get the order to know how much to refund
      const { data: order } = await supabaseAdmin
        .from('sms_verification_orders')
        .select('*')
        .eq('rental_id', id)
        .eq('user_id', userId)
        .single();

      if (order && !order.refunded && order.status !== 'completed') {
        // Refund the amount
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

          // Record refund transaction
          await supabaseAdmin.from('wallet_transactions').insert({
            user_id: userId,
            amount: order.charged_price,
            transaction_type: 'refund',
            description: `SMS Verification Refund - Expired without code`
          });

          // Update order as refunded
          await supabaseAdmin
            .from('sms_verification_orders')
            .update({ 
              status: 'expired',
              refunded: true 
            })
            .eq('rental_id', id)
            .eq('user_id', userId);

          return new Response(JSON.stringify({ 
            status: 'success',
            message: 'Refund processed successfully',
            refunded_amount: order.charged_price,
            refunded_amount_display: `₦${order.charged_price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({ 
        status: 'error',
        message: 'Order not eligible for refund'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('SMS Verification error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
