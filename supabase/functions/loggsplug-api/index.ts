import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://loggsplug.online/api/reseller';
const PRICE_MULTIPLIER = 1.5; // 50% markup on reseller prices

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOGGSPLUG_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'LOGGSPLUG_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, productId, qty } = body;

    console.log(`loggsplug-api: action=${action}, productId=${productId}, qty=${qty}`);

    let endpoint = '';
    let method: 'GET' | 'POST' = 'GET';
    let fetchBody: string | null = null;

    switch (action) {
      case 'get_products':
        endpoint = '/products';
        break;

      case 'place_order':
        if (!productId || !qty) {
          return new Response(
            JSON.stringify({ error: 'product_id and qty are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = '/order';
        method = 'POST';
        fetchBody = JSON.stringify({ product_id: productId, qty });
        break;

      case 'get_profile':
        endpoint = '/me';
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching: ${url} [${method}]`);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    };

    const fetchOptions: RequestInit = { method, headers };
    if (fetchBody) fetchOptions.body = fetchBody;

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();

    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${responseText.slice(0, 1000)}`);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: responseText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON from API', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply price multiplier for product listings
    if (action === 'get_products' && data?.success && Array.isArray(data.data)) {
      data.data = data.data.map((product: any) => ({
        ...product,
        display_price: ((product.reseller_price || product.base_price || 0) * PRICE_MULTIPLIER).toFixed(2),
        original_reseller_price: product.reseller_price,
      }));
    }

    // For orders, multiply the charged amount for display
    if (action === 'place_order' && data?.success) {
      data.display_charged = ((data.charged || 0) * PRICE_MULTIPLIER).toFixed(2);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in loggsplug-api:', error);
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
