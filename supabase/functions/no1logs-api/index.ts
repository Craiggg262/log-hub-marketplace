import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://www.no1logs.com/api/v1';
const PRICE_MULTIPLIER = 5010; // USD to Naira (1670) × 3 markup

type ActionBody = {
  action: string;
  productId?: number | string;
  categoryId?: number | string;
  search?: string;
  productDetailsIds?: string;
  quantity?: number;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('NO1LOGS_API_KEY');

    if (!apiKey) {
      console.error('NO1LOGS_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let payload: ActionBody;
    try {
      payload = (await req.json()) as ActionBody;
    } catch {
      payload = { action: '' };
    }

    const { action, productId, categoryId, search, productDetailsIds, quantity } = payload;
    console.log(
      `Processing request: action=${action}, productId=${productId}, categoryId=${categoryId}, search=${search}, quantity=${quantity}`
    );

    let endpoint = '';
    let method: 'GET' | 'POST' = 'GET';
    let body: string | null = null;
    let contentType: string | null = 'application/json';

    switch (action) {
      case 'get_products':
        endpoint = `/products?api_token=${apiKey}`;
        if (search) {
          endpoint += `&search=${encodeURIComponent(search)}`;
        }
        break;

      case 'get_category_products':
        if (!categoryId) {
          return new Response(
            JSON.stringify({ error: 'Category ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/category-products/${categoryId}?api_token=${apiKey}`;
        break;

      case 'get_product_details':
        if (!productId) {
          return new Response(
            JSON.stringify({ error: 'Product ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/product/details/${productId}?api_token=${apiKey}`;
        break;

      case 'check_balance':
        endpoint = `/check-balance?api_token=${apiKey}`;
        break;

      case 'place_order': {
        if (!productDetailsIds) {
          return new Response(
            JSON.stringify({ error: 'Product details IDs are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // POST to https://www.no1logs.com/api/v1/order/new?api_token={apiKey}
        // Some NO1LOGS deployments expect `id` (single), others accept `product_details_ids` (comma-separated).
        endpoint = `/order/new?api_token=${apiKey}`;
        method = 'POST';
        contentType = 'application/x-www-form-urlencoded';

        const idsRaw = String(productDetailsIds);
        const firstId = idsRaw.split(',')[0]?.trim();
        const params = new URLSearchParams();

        params.set('product_details_ids', idsRaw);
        if (firstId) {
          params.set('id', firstId);
          params.set('product_details_id', firstId);
        }

        body = params.toString();

        console.log(`Placing order with product_details_ids: ${idsRaw}`);
        console.log(`POST body: ${body}`);
        break;
      }

      case 'get_order': {
        if (!productId) {
          return new Response(
            JSON.stringify({ error: 'Order ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // GET https://www.no1logs.com/api/v1/order/new?api_token={apiKey}&id={orderId}
        endpoint = `/order/new?api_token=${apiKey}&id=${encodeURIComponent(String(productId))}`;
        method = 'GET';
        console.log(`Fetching order details for order ID: ${productId}`);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching: ${fullUrl}`);
    console.log(`Method: ${method}`);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (contentType) headers['Content-Type'] = contentType;

    const fetchOptions: RequestInit = { method, headers };
    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(fullUrl, fetchOptions);
    const responseText = await response.text();
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${responseText.slice(0, 1000)}`);

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: responseText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON response from API', details: responseText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsed response:`, JSON.stringify(data).slice(0, 800));

    // Apply price multiplier to any 'price' fields
    const transformedData = transformPrices(data, PRICE_MULTIPLIER);

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in no1logs-api function:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to multiply prices by the configured multiplier
function transformPrices(data: any, multiplier: number): any {
  if (Array.isArray(data)) {
    return data.map((item) => transformPrices(item, multiplier));
  }

  if (data && typeof data === 'object') {
    const transformed: Record<string, any> = { ...data };

    for (const [key, value] of Object.entries(transformed)) {
      if (key === 'price' && (typeof value === 'string' || typeof value === 'number')) {
        const originalPrice = parseFloat(String(value));
        transformed[key] = Number.isFinite(originalPrice) ? (originalPrice * multiplier).toFixed(2) : value;
        continue;
      }

      if (Array.isArray(value) || (value && typeof value === 'object')) {
        transformed[key] = transformPrices(value, multiplier);
      }
    }

    return transformed;
  }

  return data;
}
