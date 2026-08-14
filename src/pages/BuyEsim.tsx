import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, Smartphone, Signal, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, useCurrency } from '@/lib/currency';
import AllInclusiveEsim from '@/components/esim/AllInclusiveEsim';

interface Network { operator: string; per_gb_usd: number; per_gb_naira: number }
interface Country {
  name: string; iso2: string; flag: string; continent: string;
  operator: string; per_gb_usd: number; per_gb_naira: number; networks: Network[];
}
interface EsimOrder {
  id: string; iccid: string | null; country_name: string; data_gb: number;
  operator: string | null; charged_naira: number; status: string;
  lpa_string: string | null; qr_code: string | null; direct_install_url: string | null;
  created_at: string;
}

const DATA_TIERS = [1, 2, 3, 5, 10, 20];

const BuyEsim = () => {
  useCurrency();
  const { toast } = useToast();
  const { refreshProfile } = useAuth() as any;
  const [countries, setCountries] = useState<Country[]>([]);
  const [fee, setFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Country | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [gb, setGb] = useState<number>(1);
  const [buying, setBuying] = useState(false);
  const [orders, setOrders] = useState<EsimOrder[]>([]);
  const [viewOrder, setViewOrder] = useState<EsimOrder | null>(null);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('citrussim-esim', { body: { action: 'countries' } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCountries(data.countries || []);
      setFee(data.provision_fee_naira || 0);
    } catch (e: any) {
      toast({ title: 'Could not load eSIM countries', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const { data } = await supabase.functions.invoke('citrussim-esim', { body: { action: 'myEsims' } });
      setOrders(data?.orders || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadCountries();
    loadOrders();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase() === q);
  }, [countries, search]);

  const activeNetwork = network ?? (selected
    ? { operator: selected.operator, per_gb_usd: selected.per_gb_usd, per_gb_naira: selected.per_gb_naira }
    : null);

  const total = activeNetwork ? Math.ceil(activeNetwork.per_gb_naira * gb) + fee : 0;

  const handleBuy = async () => {
    if (!selected || !activeNetwork) return;
    setBuying(true);
    try {
      const { data, error } = await supabase.functions.invoke('citrussim-esim', {
        body: {
          action: 'purchase',
          country_name: selected.name,
          country_iso2: selected.iso2,
          operator: activeNetwork.operator,
          per_gb_usd: activeNetwork.per_gb_usd,
          data_gb: gb,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'eSIM purchased', description: `Your ${selected.name} eSIM is ready. Scan the QR code to install.` });
      setSelected(null);
      setNetwork(null);
      await loadOrders();
      refreshProfile?.();
      if (data?.order) setViewOrder(data.order);
    } catch (e: any) {
      toast({ title: 'Purchase failed', description: e.message, variant: 'destructive' });
    } finally {
      setBuying(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center">
          <Smartphone className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            eSIM <Badge>NEW</Badge>
          </h1>
          <p className="text-muted-foreground text-sm">Instant travel data, calls &amp; SMS in 200+ countries</p>
        </div>
      </div>

      <Tabs defaultValue="portal-data">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="portal-data" className="flex-col py-2">
            <span className="font-semibold">Portal 1</span>
            <span className="text-[10px] opacity-70">Data Only</span>
          </TabsTrigger>
          <TabsTrigger value="portal-all" className="flex-col py-2">
            <span className="font-semibold">Portal 2</span>
            <span className="text-[10px] opacity-70">All Inclusive · Data, Calls &amp; SMS</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portal-all" className="mt-6">
          <AllInclusiveEsim />
        </TabsContent>

        <TabsContent value="portal-data" className="mt-6">
      <Tabs defaultValue="buy">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy eSIM (Data Only)</TabsTrigger>
          <TabsTrigger value="mine">My eSIMs</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-6 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((c) => (
                <button
                  key={c.iso2}
                  onClick={() => { setSelected(c); setNetwork(null); setGb(1); }}
                  className="glass-card rounded-2xl p-4 text-left hover:border-primary border-2 border-transparent transition-all"
                >
                  <div className="text-3xl mb-2">{c.flag}</div>
                  <div className="font-semibold text-sm leading-tight">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    from {formatPrice(c.per_gb_naira)}/GB
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No countries found</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-6 space-y-3">
          {orders.length === 0 ? (
            <Card className="glass-card border-0">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Signal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                You have not purchased any eSIM yet.
              </CardContent>
            </Card>
          ) : orders.map((o) => (
            <Card key={o.id} className="glass-card border-0 cursor-pointer" onClick={() => setViewOrder(o)}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{o.country_name} · {o.data_gb}GB</p>
                  <p className="text-xs text-muted-foreground break-all">ICCID: {o.iccid}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(o.charged_naira)}</p>
                  <Badge variant="secondary">{o.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
        </TabsContent>
      </Tabs>

      {/* Buy dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selected?.flag}</span> {selected?.name} eSIM
            </DialogTitle>
            <DialogDescription>Choose a network and how much data you need.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Network</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {(selected?.networks ?? []).map((n) => {
                  const active = activeNetwork?.operator === n.operator;
                  return (
                    <button
                      key={n.operator}
                      onClick={() => setNetwork(n)}
                      className={`flex items-center justify-between rounded-xl p-3 border-2 text-sm transition-all ${active ? 'border-primary bg-primary/5' : 'border-border/50'}`}
                    >
                      <span>{n.operator}</span>
                      <span className="font-semibold">{formatPrice(n.per_gb_naira)}/GB</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <div className="grid grid-cols-3 gap-2">
                {DATA_TIERS.map((t) => (
                  <Button key={t} variant={gb === t ? 'default' : 'outline'} size="sm" onClick={() => setGb(t)}>
                    {t}GB
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data ({gb}GB)</span>
                <span>{formatPrice((activeNetwork?.per_gb_naira ?? 0) * gb)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">eSIM issuing fee</span>
                <span>{formatPrice(fee)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <Button onClick={handleBuy} disabled={buying} className="w-full" size="lg">
              {buying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {buying ? 'Provisioning…' : `Buy for ${formatPrice(total)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* eSIM details dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(v) => !v && setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install your eSIM</DialogTitle>
            <DialogDescription>
              {viewOrder?.country_name} · {viewOrder?.data_gb}GB
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewOrder?.qr_code && (
              <img src={viewOrder.qr_code} alt="eSIM installation QR code" className="w-56 h-56 mx-auto rounded-xl bg-white p-2" />
            )}
            {viewOrder?.lpa_string && (
              <div className="space-y-1">
                <Label className="text-xs">Manual activation code</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs break-all bg-muted p-2 rounded-lg flex-1">{viewOrder.lpa_string}</code>
                  <Button size="sm" variant="ghost" onClick={() => copy(viewOrder.lpa_string!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {viewOrder?.direct_install_url && (
              <Button asChild className="w-full">
                <a href={viewOrder.direct_install_url} target="_blank" rel="noreferrer">Install on iPhone</a>
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              On Android: Settings → Network → SIMs → Add eSIM → Scan QR code.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyEsim;
