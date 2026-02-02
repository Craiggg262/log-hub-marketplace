import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// NOTE: Use the non-www base URL to match BetaSub's documented endpoint.
const BETASUB_API_URL = "https://betasub.com.ng/api";
// Can be saved as either "Token <value>" or just "<value>".
const BETASUB_API_KEY_RAW = Deno.env.get("BETASUB_API_KEY")?.trim();

const getBetaSubAuthHeader = () => {
  if (!BETASUB_API_KEY_RAW) return null;
  const lower = BETASUB_API_KEY_RAW.toLowerCase();
  return lower.startsWith("token ") ? BETASUB_API_KEY_RAW : `Token ${BETASUB_API_KEY_RAW}`;
};

// Network mapping
const NETWORKS: Record<string, { id: number; name: string; color: string }> = {
  mtn: { id: 1, name: "MTN", color: "bg-yellow-500" },
  glo: { id: 2, name: "GLO", color: "bg-green-500" },
  "9mobile": { id: 3, name: "9Mobile", color: "bg-green-700" },
  airtel: { id: 4, name: "Airtel", color: "bg-red-500" },
};

// Data plans from API documentation - hardcoded for reliability
const DATA_PLANS = [
  // MTN SME
  { id: 124, network: "mtn", name: "MTN SME 500MB", validity: "7 Days", price: 350, type: "sme" },
  { id: 11, network: "mtn", name: "MTN SME 1.0GB", validity: "7 Days", price: 399, type: "sme" },
  { id: 12, network: "mtn", name: "MTN SME 2.0GB", validity: "30 Days", price: 1000, type: "sme" },
  { id: 41, network: "mtn", name: "MTN SME 3.0GB", validity: "30 Days", price: 1500, type: "sme" },
  { id: 161, network: "mtn", name: "MTN SME 5.0GB", validity: "30 Days", price: 1750, type: "sme" },
  { id: 170, network: "mtn", name: "MTN SME 5.0GB", validity: "14 Days", price: 1600, type: "sme" },
  
  // Airtel
  { id: 18, network: "airtel", name: "Airtel 500MB", validity: "7 Days", price: 500, type: "gifting" },
  { id: 19, network: "airtel", name: "Airtel 1.0GB", validity: "7 Days", price: 800, type: "gifting" },
  { id: 20, network: "airtel", name: "Airtel 2.0GB", validity: "30 Days", price: 1500, type: "gifting" },
  { id: 137, network: "airtel", name: "Airtel 3.0GB", validity: "30 Days", price: 2050, type: "gifting" },
  { id: 52, network: "airtel", name: "Airtel 4.0GB", validity: "30 Days", price: 2500, type: "gifting" },
  { id: 138, network: "airtel", name: "Airtel 8.0GB", validity: "30 Days", price: 3200, type: "gifting" },
  { id: 68, network: "airtel", name: "Airtel 10.0GB", validity: "30 Days", price: 4100, type: "gifting" },
  { id: 139, network: "airtel", name: "Airtel 13.0GB", validity: "30 Days", price: 5200, type: "gifting" },
  
  // Airtel SME
  { id: 172, network: "airtel", name: "Airtel SME 150MB", validity: "1 Day", price: 70, type: "sme" },
  { id: 173, network: "airtel", name: "Airtel SME 300MB", validity: "2 Days", price: 150, type: "sme" },
  { id: 140, network: "airtel", name: "Airtel SME 600MB", validity: "2 Days", price: 250, type: "sme" },
  { id: 103, network: "airtel", name: "Airtel SME 2.0GB", validity: "2 Days", price: 750, type: "sme" },
  { id: 175, network: "airtel", name: "Airtel SME 3.0GB", validity: "2 Days", price: 900, type: "sme" },
  { id: 106, network: "airtel", name: "Airtel SME 7.0GB", validity: "7 Days", price: 2700, type: "sme" },
  { id: 107, network: "airtel", name: "Airtel SME 10.0GB", validity: "30 Days", price: 3500, type: "sme" },
  
  // GLO
  { id: 60, network: "glo", name: "GLO 500MB", validity: "30 Days", price: 225, type: "gifting" },
  { id: 15, network: "glo", name: "GLO 1.0GB", validity: "30 Days", price: 450, type: "gifting" },
  { id: 16, network: "glo", name: "GLO 2.0GB", validity: "30 Days", price: 900, type: "gifting" },
  { id: 44, network: "glo", name: "GLO 3.0GB", validity: "30 Days", price: 1350, type: "gifting" },
  { id: 58, network: "glo", name: "GLO 5.0GB", validity: "30 Days", price: 2250, type: "gifting" },
  { id: 59, network: "glo", name: "GLO 10.0GB", validity: "30 Days", price: 4500, type: "gifting" },
  
  // GLO SME
  { id: 155, network: "glo", name: "GLO SME 1.0GB", validity: "3 Days", price: 330, type: "sme" },
  { id: 152, network: "glo", name: "GLO SME 1.0GB", validity: "7 Days", price: 370, type: "sme" },
  { id: 156, network: "glo", name: "GLO SME 3.0GB", validity: "3 Days", price: 990, type: "sme" },
  { id: 153, network: "glo", name: "GLO SME 3.0GB", validity: "7 Days", price: 1110, type: "sme" },
  { id: 157, network: "glo", name: "GLO SME 5.0GB", validity: "3 Days", price: 1650, type: "sme" },
  { id: 154, network: "glo", name: "GLO SME 5.0GB", validity: "7 Days", price: 1850, type: "sme" },
  
  // 9Mobile Corporate
  { id: 30, network: "9mobile", name: "9Mobile 500MB", validity: "30 Days", price: 160, type: "corporate" },
  { id: 32, network: "9mobile", name: "9Mobile 1.0GB", validity: "30 Days", price: 320, type: "corporate" },
  { id: 31, network: "9mobile", name: "9Mobile 2.0GB", validity: "30 Days", price: 640, type: "corporate" },
  { id: 33, network: "9mobile", name: "9Mobile 3.0GB", validity: "30 Days", price: 960, type: "corporate" },
  { id: 81, network: "9mobile", name: "9Mobile 5.0GB", validity: "30 Days", price: 1600, type: "corporate" },
  { id: 82, network: "9mobile", name: "9Mobile 10.0GB", validity: "30 Days", price: 3200, type: "corporate" },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, network, planId, mobileNumber } = await req.json();
    console.log(`Action: ${action}, Network: ${network}, PlanId: ${planId}, Mobile: ${mobileNumber}`);

    // Get networks list
    if (action === "getNetworks") {
      return new Response(
        JSON.stringify({ status: "success", data: NETWORKS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get data plans for a network
    if (action === "getPlans") {
      const networkPlans = DATA_PLANS.filter(p => p.network === network);
      return new Response(
        JSON.stringify({ status: "success", data: networkPlans }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all plans
    if (action === "getAllPlans") {
      return new Response(
        JSON.stringify({ status: "success", data: DATA_PLANS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buy data
    if (action === "buyData") {
      const betasubAuth = getBetaSubAuthHeader();
      if (!betasubAuth) {
        console.error("BETASUB_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "VTU service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find the plan
      const plan = DATA_PLANS.find(p => p.id === planId);
      if (!plan) {
        return new Response(
          JSON.stringify({ status: "error", error: "Invalid plan selected" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const networkInfo = NETWORKS[plan.network];
      if (!networkInfo) {
        return new Response(
          JSON.stringify({ status: "error", error: "Invalid network" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user's wallet balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_balance")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        console.error("Profile error:", profileError);
        return new Response(
          JSON.stringify({ error: "Could not fetch wallet balance" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user has enough balance
      if (profile.wallet_balance < plan.price) {
        return new Response(
          JSON.stringify({ status: "error", error: "Insufficient wallet balance", requiredAmount: plan.price }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create pending order
      const { data: order, error: orderError } = await supabase
        .from("vtu_orders")
        .insert({
          user_id: user.id,
          order_type: "data",
          network: networkInfo.name,
          network_id: networkInfo.id,
          plan_id: plan.id,
          plan_name: `${plan.name} - ${plan.validity}`,
          mobile_number: mobileNumber,
          amount: plan.price,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", orderError);
        return new Response(
          JSON.stringify({ error: "Failed to create order" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Call BetaSub API
      console.log("Calling BetaSub API...");
      const apiResponse = await fetch(`${BETASUB_API_URL}/data/`, {
        method: "POST",
        headers: {
          "Authorization": betasubAuth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          network: networkInfo.id,
          mobile_number: mobileNumber,
          plan: plan.id,
          Ported_number: 0,
        }),
      });

      const apiResult = await apiResponse.json();
      console.log("BetaSub API response:", JSON.stringify(apiResult));

      // Update order with API response
      const isSuccess = apiResult.status === "success" || apiResult.Status === "successful";
      
      await supabase
        .from("vtu_orders")
        .update({
          api_response: apiResult,
          status: isSuccess ? "successful" : "failed",
        })
        .eq("id", order.id);

      if (isSuccess) {
        // Deduct from wallet
        const newBalance = profile.wallet_balance - plan.price;
        await supabase
          .from("profiles")
          .update({ wallet_balance: newBalance })
          .eq("user_id", user.id);

        // Record transaction
        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          amount: -plan.price,
          transaction_type: "debit",
          description: `Data purchase: ${plan.name} - ${plan.validity} to ${mobileNumber}`,
        });

        return new Response(
          JSON.stringify({
            status: "success",
            message: apiResult.msg || "Data purchase successful",
            data: {
              orderId: order.id,
              planName: plan.name,
              validity: plan.validity,
              mobileNumber: mobileNumber,
              amount: plan.price,
              newBalance: newBalance,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({
            status: "error",
            error: apiResult.error || apiResult.msg || "Data purchase failed",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get order history
    if (action === "getOrderHistory") {
      const { data: orders, error: ordersError } = await supabase
        .from("vtu_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (ordersError) {
        console.error("Orders fetch error:", ordersError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch orders" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ status: "success", data: orders }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
