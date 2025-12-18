import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://www.no1logs.com/api/v1';
const PRICE_MULTIPLIER = 4;

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

    const { action, productId, categoryId, search } = await req.json();
    console.log(`Processing request: action=${action}, productId=${productId}, categoryId=${categoryId}, search=${search}`);

    let endpoint = '';
    let method = 'GET';

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
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Fetching: ${API_BASE_URL}${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error body: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Response received successfully`);

    // Apply 4x price multiplier to all products
    const transformedData = transformPrices(data, PRICE_MULTIPLIER);

    return new Response(
      JSON.stringify(transformedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in no1logs-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to multiply prices by the configured multiplier
function transformPrices(data: any, multiplier: number): any {
  if (Array.isArray(data)) {
    return data.map(item => transformPrices(item, multiplier));
  }
  
  if (data && typeof data === 'object') {
    const transformed = { ...data };
    
    // Transform price if it exists
    if (transformed.price) {
      const originalPrice = parseFloat(transformed.price);
      transformed.price = (originalPrice * multiplier).toFixed(2);
    }
    
    // Recursively transform nested products
    if (transformed.products) {
      transformed.products = transformPrices(transformed.products, multiplier);
    }
    
    return transformed;
  }
  
  return data;
}
