import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MTELSMS_API_KEY = Deno.env.get('MTELSMS_API_KEY');
const MTELSMS_BASE_URL = 'https://mtelsms.com/stubs/handler_api.php';

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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = claimsData.claims.sub;
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

    // For getNumber action, deduct from wallet if successful
    if (action === 'getNumber' && data.status === 'success' && data.data?.service_price) {
      const price = parseFloat(data.data.service_price);
      
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

      if (profile.wallet_balance < price) {
        // Cancel the number since user can't afford it
        await fetch(`${MTELSMS_BASE_URL}?api_key=${MTELSMS_API_KEY}&action=cancelNumber&id=${data.data.id}`);
        return new Response(JSON.stringify({ error: 'Insufficient wallet balance' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Deduct from wallet using service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ wallet_balance: profile.wallet_balance - price })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating wallet:', updateError);
      }

      // Record transaction
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: userId,
        amount: -price,
        transaction_type: 'sms_verification',
        description: `SMS Verification - ${data.data.service_name}`
      });

      console.log(`Deducted $${price} from user ${userId} wallet for SMS verification`);
    }

    // For cancelNumber with refund, credit wallet back
    if (action === 'cancelNumber' && data.status === 'success' && data.message?.includes('refunded')) {
      console.log('Rental was refunded - wallet will be credited on next balance check');
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
