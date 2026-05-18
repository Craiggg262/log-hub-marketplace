import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, Eye, EyeOff, Key, Plus, Power, Trash2 } from 'lucide-react';

const BASE_URL = 'https://loghubmarketplace.site/api/reseller-api';

const buildDocsMarkdown = (base: string) => `# Log Hub Marketplace — Resellers API

Base URL: ${base}

All requests require the \`x-api-key\` header with your personal API key.
Generate keys at https://loghubmarketplace.site (Resellers page).

## Wallet
GET /balance
  -> { success, data: { wallet_balance, currency: "NGN" } }

## SMS Verification
GET  /sms/services                       -> list services + prices (NGN)
POST /sms/buy      { service_id }        -> rents number, charges wallet
POST /sms/status   { order_id }          -> { phone_number, code, status }
POST /sms/cancel   { order_id }          -> cancels + auto-refunds

## Logs (King + Lite servers combined)
GET  /logs/products
  -> [{ product_id: "king_<id>" | "lite_<id>", server, name, category, stock, price, currency }]

POST /logs/buy     { product_id, qty }   -> auto-routes by prefix
  -> { order_id, server, product_name, quantity, unit_price, total_charged, credentials }

## Errors
401 Missing / invalid x-api-key
402 Insufficient balance
404 Product / service not found
502 Upstream provider failure

## Support
Telegram: https://t.me/bitinvest02
`;

const downloadDocs = (base: string) => {
  const blob = new Blob([buildDocsMarkdown(base)], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'loghub-reseller-api-docs.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

const Resellers: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('My Reseller Key');
  const [creating, setCreating] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const generateKey = () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    return `lh_live_${hex}`;
  };

  const handleCreate = async () => {
    if (!user) return;
    setCreating(true);
    const newKey = generateKey();
    const { error } = await supabase.from('api_keys').insert({
      user_id: user.id,
      name: name.trim() || 'My Reseller Key',
      api_key: newKey,
    });
    setCreating(false);
    if (error) {
      toast({ title: 'Failed to create key', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'API Key created', description: 'Copy and store it securely.' });
    setReveal((r) => ({ ...r, [newKey]: true }));
    load();
  };

  const toggleActive = async (k: ApiKey) => {
    await supabase.from('api_keys').update({ is_active: !k.is_active }).eq('id', k.id);
    load();
  };

  const removeKey = async (k: ApiKey) => {
    if (!confirm('Delete this API key? Sites using it will lose access.')) return;
    await supabase.from('api_keys').delete().eq('id', k.id);
    load();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard.' });
  };

  const mask = (key: string) => key.slice(0, 12) + '••••••••••••••••' + key.slice(-4);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Resellers API</h1>
        <p className="text-muted-foreground mt-1">
          Integrate Log Hub Marketplace into your own site. Generate an API key and use the endpoints below.
        </p>
      </div>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Generate API Key</CardTitle>
          <CardDescription>Each key is tied to your wallet — purchases made via the API deduct your Log Hub balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Key name</Label>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Site Production" />
            <Button onClick={handleCreate} disabled={creating}>
              <Plus className="h-4 w-4 mr-1" /> Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keys list */}
      <Card>
        <CardHeader><CardTitle>Your API Keys</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : keys.length === 0 ? (
            <p className="text-muted-foreground text-sm">No keys yet. Generate your first one above.</p>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div key={k.id} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-medium">{k.name}</div>
                    <Badge variant={k.is_active ? 'default' : 'secondary'}>
                      {k.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded p-2 font-mono text-xs break-all">
                    <span className="flex-1">{reveal[k.api_key] ? k.api_key : mask(k.api_key)}</span>
                    <Button size="icon" variant="ghost" onClick={() => setReveal(r => ({ ...r, [k.api_key]: !r[k.api_key] }))}>
                      {reveal[k.api_key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => copy(k.api_key)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created {new Date(k.created_at).toLocaleDateString()}</span>
                    <span>Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(k)}>
                      <Power className="h-3 w-3 mr-1" /> {k.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeKey(k)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Docs */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>All requests require the <code>x-api-key</code> header. Base URL:</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => downloadDocs(BASE_URL)}>
              <Download className="h-4 w-4 mr-1" /> Download Docs
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div className="bg-muted/50 rounded p-3 font-mono text-xs break-all flex items-center gap-2">
            <span className="flex-1">{BASE_URL}</span>
            <Button size="icon" variant="ghost" onClick={() => copy(BASE_URL)}><Copy className="h-4 w-4" /></Button>
          </div>


          <Section title="Check Wallet Balance" method="GET" path="/balance" base={BASE_URL} copy={copy}
            example={`curl -X GET "${BASE_URL}/balance" \\
  -H "x-api-key: YOUR_API_KEY"`}
            response={`{ "success": true, "data": { "wallet_balance": 5000, "currency": "NGN" } }`} />

          <Section title="List SMS Verification Services" method="GET" path="/sms/services" base={BASE_URL} copy={copy}
            example={`curl -X GET "${BASE_URL}/sms/services" \\
  -H "x-api-key: YOUR_API_KEY"`}
            response={`{ "success": true, "data": [
  { "service_id": "wa", "name": "WhatsApp", "price": 320, "currency": "NGN", "stock": 120 }
]}`} />

          <Section title="Buy SMS Number" method="POST" path="/sms/buy" base={BASE_URL} copy={copy}
            example={`curl -X POST "${BASE_URL}/sms/buy" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"service_id":"wa"}'`}
            response={`{ "success": true, "data": {
  "order_id": "12345", "phone_number": "+1...", "charged_price": 320,
  "time_remaining": 1200, "expires_at": "..." } }`} />

          <Section title="Check SMS Status / Get Code" method="POST" path="/sms/status" base={BASE_URL} copy={copy}
            example={`curl -X POST "${BASE_URL}/sms/status" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"order_id":"12345"}'`}
            response={`{ "success": true, "data": {
  "order_id": "12345", "phone_number": "+1...", "code": "123456", "status": "completed" } }`} />

          <Section title="Cancel SMS Order (auto-refund)" method="POST" path="/sms/cancel" base={BASE_URL} copy={copy}
            example={`curl -X POST "${BASE_URL}/sms/cancel" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"order_id":"12345"}'`}
            response={`{ "success": true, "data": { "order_id": "12345", "status": "cancelled" } }`} />

          <Section title="List Logs Products (King + Lite combined)" method="GET" path="/logs/products" base={BASE_URL} copy={copy}
            example={`curl -X GET "${BASE_URL}/logs/products" \\
  -H "x-api-key: YOUR_API_KEY"`}
            response={`{ "success": true, "data": [
  { "product_id": "king_12", "server": "king", "name": "Facebook USA", "category": "Facebook", "stock": 50, "price": 1500, "currency": "NGN" },
  { "product_id": "lite_45", "server": "lite", "name": "Instagram USA", "category": "Instagram", "stock": 12, "price": 1200, "currency": "NGN" }
]}`} />

          <Section title="Buy Logs (auto-routes to King or Lite by product_id prefix)" method="POST" path="/logs/buy" base={BASE_URL} copy={copy}
            example={`curl -X POST "${BASE_URL}/logs/buy" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"product_id":"king_12", "qty":1}'`}
            response={`{ "success": true, "data": {
  "order_id": "...", "server": "king", "product_name": "Facebook USA", "quantity": 1,
  "unit_price": 1500, "total_charged": 1500, "credentials": { ... } } }`} />

          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="font-semibold">Error Responses</h3>
            <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto">{`401  { "error": "Missing x-api-key header" }
401  { "error": "Invalid or inactive API key" }
402  { "error": "Insufficient balance", "required": 320, "available": 100 }
404  { "error": "Service not found" }
502  { "error": "Failed to fetch services" }`}</pre>
          </div>

          <div className="border-t border-border pt-4 text-xs text-muted-foreground">
            For support contact us on{' '}
            <a className="text-primary underline" href="https://t.me/bitinvest02" target="_blank" rel="noreferrer">Telegram</a>.
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

const Section: React.FC<{
  title: string; method: string; path: string; base: string;
  example: string; response: string; copy: (s: string) => void;
}> = ({ title, method, path, example, response, copy }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline">{method}</Badge>
      <code className="text-xs">{path}</code>
      <span className="font-medium">— {title}</span>
    </div>
    <div className="relative">
      <pre className="bg-muted/50 rounded p-3 text-xs overflow-x-auto">{example}</pre>
      <Button size="icon" variant="ghost" className="absolute top-1 right-1" onClick={() => copy(example)}>
        <Copy className="h-3 w-3" />
      </Button>
    </div>
    <details>
      <summary className="text-xs text-muted-foreground cursor-pointer">Sample response</summary>
      <pre className="bg-muted/30 rounded p-3 text-xs overflow-x-auto mt-1">{response}</pre>
    </details>
  </div>
);

export default Resellers;
