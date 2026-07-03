// One-shot admin utility: re-generate long-lived signed URLs for all existing
// logo_url (logs) and image_url (categories) entries pointing at log-logos.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPIRY = 60 * 60 * 24 * 365 * 100; // 100 years

function extractPath(url: string): string | null {
  const m = url.match(/\/log-logos\/(.+?)(\?|$)/);
  return m ? m[1] : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const results: any = { logs: 0, categories: 0, errors: [] as string[] };

  const { data: logs } = await supabase.from("logs").select("id, logo_url").not("logo_url", "is", null);
  for (const l of logs ?? []) {
    const path = extractPath(l.logo_url as string);
    if (!path) continue;
    const { data, error } = await supabase.storage.from("log-logos").createSignedUrl(path, EXPIRY);
    if (error) { results.errors.push(`log ${l.id}: ${error.message}`); continue; }
    await supabase.from("logs").update({ logo_url: data.signedUrl, image: data.signedUrl }).eq("id", l.id);
    results.logs++;
  }

  const { data: cats } = await supabase.from("categories").select("id, image_url").not("image_url", "is", null);
  for (const c of cats ?? []) {
    const path = extractPath(c.image_url as string);
    if (!path) continue;
    const { data, error } = await supabase.storage.from("log-logos").createSignedUrl(path, EXPIRY);
    if (error) { results.errors.push(`cat ${c.id}: ${error.message}`); continue; }
    await supabase.from("categories").update({ image_url: data.signedUrl }).eq("id", c.id);
    results.categories++;
  }

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
