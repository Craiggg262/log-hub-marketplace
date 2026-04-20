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

    const { userId, email, name, phoneNumber } = await req.json()
    
    console.log('Creating PaymentPoint virtual account for:', { userId, email, name, phoneNumber })

    if (!userId || !email || !name || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, email, name, phoneNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate phone number format (Nigerian format)
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10 || cleanPhone.length > 14) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already has a virtual account
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('virtual_account_number, virtual_account_bank, virtual_account_name')
      .eq('user_id', userId)
      .single()

    if (profileFetchError) {
      console.error('Error fetching profile:', profileFetchError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If user already has a virtual account, return it
    if (existingProfile?.virtual_account_number) {
      console.log('User already has virtual account:', existingProfile.virtual_account_number)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Virtual account already exists',
          data: {
            accountNumber: existingProfile.virtual_account_number,
            bankName: existingProfile.virtual_account_bank,
            accountName: existingProfile.virtual_account_name
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call PaymentPoint API to create virtual account
    const apiKey = Deno.env.get('PAYMENTPOINT_API_KEY')
    const secretKey = Deno.env.get('PAYMENTPOINT_SECRET_KEY')
    const businessId = Deno.env.get('PAYMENTPOINT_BUSINESS_ID')

    if (!apiKey || !secretKey || !businessId) {
      console.error('Missing PaymentPoint credentials')
      return new Response(
        JSON.stringify({ error: 'Payment service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try multiple bank codes in order. PaymentPoint occasionally has issues
    // provisioning accounts with a specific partner bank, so we fall back.
    const bankCodesToTry = ['20946', '000018', '000017', '100033']

    let bankAccount: any = null
    let lastResponseData: any = null
    let lastStatus = 200

    for (const bankCode of bankCodesToTry) {
      const paymentPointData = {
        email: email,
        name: name,
        phoneNumber: cleanPhone,
        bankCode: [bankCode],
        businessId: businessId
      }

      console.log(`Calling PaymentPoint API with bankCode ${bankCode}`)

      const response = await fetch('https://api.paymentpoint.co/api/v1/createVirtualAccount', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(paymentPointData)
      })

      const responseData = await response.json()
      lastResponseData = responseData
      lastStatus = response.status
      console.log(`PaymentPoint API response (bankCode ${bankCode}):`, JSON.stringify(responseData))

      if (response.ok && responseData.bankAccounts?.length > 0 && responseData.bankAccounts[0]?.accountNumber) {
        bankAccount = responseData.bankAccounts[0]
        break
      }

      // If the bank code itself is invalid, skip retrying with the same one
      const errMsg = (responseData?.message || '').toLowerCase()
      if (errMsg.includes('invalid bank code')) {
        continue
      }
    }

    if (!bankAccount) {
      console.error('PaymentPoint failed to provision an account on every bank code:', lastResponseData)
      const upstreamError = lastResponseData?.errors?.[0] || lastResponseData?.message || 'Bank account provisioning failed'
      return new Response(
        JSON.stringify({
          error: 'Our payment provider (PaymentPoint) is temporarily unable to create new bank accounts. Please try again in a few minutes, or use Manual Payment via WhatsApp to fund your wallet now.',
          providerError: upstreamError,
          details: lastResponseData
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accountNumber = bankAccount.accountNumber
    const bankName = bankAccount.bankName || 'PaymentPoint'
    const accountName = bankAccount.accountName || name

    // Update user profile with virtual account details and phone
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: cleanPhone,
        virtual_account_number: accountNumber,
        virtual_account_bank: bankName,
        virtual_account_name: accountName
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to save account details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Virtual account created for ${email}: ${accountNumber}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Virtual account created successfully',
        data: {
          accountNumber,
          bankName,
          accountName
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating virtual account:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})