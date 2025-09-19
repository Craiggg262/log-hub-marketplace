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
    
    console.log('Etegram webhook received:', body)

    // Verify the webhook is from Etegram (you should add proper verification)
    // For now, we'll process if it's a successful payment
    if (body.status === 'successful' || body.status === 'success') {
      const { email, amount, transaction_id, reference } = body
      
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        console.error('User not found:', email)
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile.user_id,
          amount: parseFloat(amount),
          transaction_type: 'deposit',
          description: `Etegram payment - Transaction ID: ${transaction_id || reference}`
        })

      if (transactionError) {
        console.error('Transaction creation failed:', transactionError)
        return new Response(
          JSON.stringify({ error: 'Transaction creation failed' }),
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
          JSON.stringify({ error: 'Balance update failed' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`Successfully processed payment for ${email}: ₦${amount}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment processed successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Webhook received but not processed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})