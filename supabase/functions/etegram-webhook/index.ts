import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    
    console.log('Etegram Pay webhook received:', JSON.stringify(body, null, 2))

    // Handle Etegram Pay webhook format
    // The webhook sends: status, email, amount, fullname, reference, accessCode, etc.
    if (body.status === 'successful' || body.status === 'success') {
      const { email, amount, reference, accessCode, fullname, phone } = body
      
      console.log(`Processing payment for ${email}, amount: ${amount}`)
      
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        console.error('User not found:', email, profileError)
        return new Response(
          JSON.stringify({ error: 'User not found', email }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create transaction record in wallet_transactions
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: profile.user_id,
          amount: parseFloat(amount),
          transaction_type: 'deposit',
          description: `Etegram Pay deposit - Ref: ${reference || accessCode}`
        })

      if (transactionError) {
        console.error('Transaction creation failed:', transactionError)
        return new Response(
          JSON.stringify({ error: 'Transaction creation failed', details: transactionError }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Update user wallet balance
      const newBalance = (profile.wallet_balance || 0) + parseFloat(amount)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', profile.user_id)

      if (updateError) {
        console.error('Balance update failed:', updateError)
        return new Response(
          JSON.stringify({ error: 'Balance update failed', details: updateError }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`✅ Successfully processed payment for ${email}: ₦${amount}. New balance: ₦${newBalance}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment processed successfully',
          newBalance 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Webhook received but status not successful:', body.status)
    return new Response(
      JSON.stringify({ message: 'Webhook received but not processed', status: body.status }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})