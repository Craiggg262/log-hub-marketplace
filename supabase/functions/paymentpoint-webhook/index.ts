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
    
    console.log('PaymentPoint webhook received:', JSON.stringify(body, null, 2))

    // PaymentPoint webhook format - adjust based on actual webhook payload
    // PaymentPoint uses different field names
    const notificationStatus = body.notification_status
    const transactionStatus = body.transaction_status
    const transactionId = body.transaction_id
    const amountPaid = body.amount_paid
    const receiverAccountNumber = body.receiver?.account_number

    // Check if this is a successful transaction
    if (notificationStatus === 'payment_successful' || transactionStatus === 'success') {
      console.log(`Processing payment for account: ${receiverAccountNumber}, amount: ${amountPaid}`)
      
      // Find user by virtual account number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('virtual_account_number', receiverAccountNumber)
        .single()

      if (profileError || !profile) {
        console.error('User not found for account:', receiverAccountNumber, profileError)
        return new Response(
          JSON.stringify({ error: 'User not found', accountNumber: receiverAccountNumber }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const transactionRef = transactionId || `PP_${Date.now()}`

      // Check for duplicate transaction
      const { data: existingTx } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('description', `PaymentPoint deposit - Ref: ${transactionRef}`)
        .single()

      if (existingTx) {
        console.log('Duplicate transaction detected:', transactionRef)
        return new Response(
          JSON.stringify({ message: 'Transaction already processed', reference: transactionRef }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: profile.user_id,
          amount: parseFloat(amountPaid),
          transaction_type: 'deposit',
          description: `PaymentPoint deposit - Ref: ${transactionRef}`
        })

      if (transactionError) {
        console.error('Transaction creation failed:', transactionError)
        return new Response(
          JSON.stringify({ error: 'Transaction creation failed', details: transactionError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update user wallet balance
      const newBalance = (profile.wallet_balance || 0) + parseFloat(amountPaid)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('user_id', profile.user_id)

      if (updateError) {
        console.error('Balance update failed:', updateError)
        return new Response(
          JSON.stringify({ error: 'Balance update failed', details: updateError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`✅ Successfully processed PaymentPoint payment for ${profile.email}: ₦${amountPaid}. New balance: ₦${newBalance}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment processed successfully',
          newBalance 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Webhook received but status not successful:', notificationStatus, transactionStatus)
    return new Response(
      JSON.stringify({ message: 'Webhook received', status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})