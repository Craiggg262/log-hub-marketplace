import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Getatext webhook received:', JSON.stringify(payload));

    const rentalId = payload?.id ? String(payload.id) : null;
    const code = payload?.code ? String(payload.code) : null;
    const number = payload?.number ? String(payload.number) : null;

    if (!rentalId || !code) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing id or code' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const update: Record<string, unknown> = {
      verification_code: code,
      status: 'completed',
    };
    if (number) update.phone_number = number;

    const { error } = await supabaseAdmin
      .from('sms_verification_orders')
      .update(update)
      .eq('rental_id', rentalId);

    if (error) {
      console.error('Webhook DB update error:', error);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    console.error('Webhook error:', e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
