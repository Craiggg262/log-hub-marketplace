import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, Search, Signal, Copy, Globe, MapPin, Infinity as InfinityIcon,
  PhoneCall, MessageSquare, Wifi, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, useCurrency } from '@/lib/currency';

export interface PikaPackage {
  package_code: string;
  name: string;
  category: 'country' | 'regional' | 'global' | 'unlimited' | 'phone';
  plan_type: string;
  location: string | null;
  location_code: string | null;
  region: string | null;
  volume_gb: number | null;
  is_unlimited: boolean;
  daily_data_gb: number | null;
  validity_days: number | null;
  duration: number | null;
  duration_unit: string;
  price_naira: number;
  price_usd: number;
  has_voice: boolean;
  has_sms: boolean;
  voice_minutes: number;
  sms_count: number;
  phone_number_included: boolean;
  supports_topup: boolean;
  requires_activation_date: boolean;
  description: string | null;
}

interface PikaOrder {
  id: string; package_name: string; location: string | null; data_gb: number | null;
  is_unlimited: boolean; validity_days: number | null; has_voice: boolean; has_sms: boolean;
  voice_minutes: number; sms_count: number; charged_naira: number; status: string;
  iccid: string | null; qr_code_url: string | null; activation_code: string | null;
  lpa_url: string | null; short_url: string | null; created_at: string;
}

const CATEGORIES: { value: PikaPackage['category']; label: string; icon: React.ElementType }[] = [
  { value: 'country', label: 'Countries', icon: MapPin },
  { value: 'regional', label: 'Regions', icon: Globe },
  { value: 'global', label: 'Global', icon: Globe },
  { value: 'unlimited', label: 'Unlimited', icon: InfinityIcon },
  { value: 'phone', label: 'Calls & SMS', icon: PhoneCall },
];

function flagOf(code: string | null) {
  if (!code || code.length !== 2) return '🌍';
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));
}

const AllInclusiveEsim: React.FC = () => {
  useCurrency();
  const { toast } = useToast();
  const { refreshProfile } = useAuth() as any;
  const [packages, setPackages] = useState<PikaPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState<PikaPackage['category']>('country');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PikaPackage | null>(null);
  const [activationDate, setActivationDate] = useState('');
  const [buying, setBuying] = useState(false);
  const [orders, setOrders] = useState<PikaOrder[]>([]);
  const [viewOrder, setViewOrder] = useState<PikaOrder | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('pikasim-esim', { body });
    if (error) {
      // Surface the real message from the function instead of "non-2xx"
      const ctx: any = (error as any).context;
      let msg = error.message;
      try { const j = await ctx?.json?.(); if (j?.error) msg = j.error; } catch { /* ignore */ }
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const loadCatalog = async (refresh = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await call({ action: 'catalog', refresh });
      setPackages(data.packages || []);
    } catch (e: any) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await call({ action: 'myEsims' });
      setOrders(data.orders || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadCatalog(); loadOrders(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    packages.forEach((p) => { c[p.category] = (c[p.category] ?? 0) + 1; });
    return c;
  }, [packages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages
      .filter((p) => p.category === category)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.location ?? '').toLowerCase().includes(q) || (p.region ?? '').toLowerCase().includes(q))
      .sort((a, b) => a.price_naira - b.price_naira);
  }, [packages, category, search]);

  const handleBuy = async () => {
    if (!selected) return;
    if (selected.requires_activation_date && !activationDate) {
      toast({ title: 'Pick an activation date', variant: 'destructive' });
      return;
    }
    setBuying(true);
    try {
      const data = await call({
        action: 'purchase',
        package_code: selected.package_code,
        activation_date: activationDate || undefined,
      });
      toast({
        title: 'eSIM purchased',
        description: data.pending
          ? 'Your eSIM is being provisioned. It will appear under "My eSIMs" shortly.'
          : 'Scan the QR code to install your eSIM.',
      });
      setSelected(null);
      setActivationDate('');
      await loadOrders();
      refreshProfile?.();
      if (data.order?.iccid) setViewOrder(data.order);
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

  const dataLabel = (p: PikaPackage) =>
    p.is_unlimited
      ? `Unlimited${p.daily_data_gb ? ` (${p.daily_data_gb}GB/day full speed)` : ''}`
      : p.volume_gb ? `${p.volume_gb}GB` : 'Data';

  return (
    <div className="space-y-4">
      <Tabs defaultValue="buy">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy eSIM</TabsTrigger>
          <TabsTrigger value="mine">My eSIMs</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="mt-4 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border transition-all ${
                    active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border/50 hover:bg-muted/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                  {counts[c.value] ? <span className="opacity-70">({counts[c.value]})</span> : null}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search country, region or plan…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => loadCatalog(true)} aria-label="Refresh plans">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : loadError ? (
            <Card className="glass-card border-0">
              <CardContent className="py-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">{loadError}</p>
                <Button variant="outline" size="sm" onClick={() => loadCatalog(true)}>Try again</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((p) => (
                <button
                  key={p.package_code}
                  onClick={() => { setSelected(p); setActivationDate(''); }}
                  className="glass-card rounded-2xl p-4 text-left hover:border-primary border-2 border-transparent transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{p.category === 'country' ? flagOf(p.location_code) : '🌍'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-tight">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.location || p.region || 'Multi-country'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Wifi className="h-3 w-3" />{dataLabel(p)}
                    </Badge>
                    {p.validity_days ? (
                      <Badge variant="secondary" className="text-[10px]">{p.validity_days} days</Badge>
                    ) : null}
                    {p.has_voice ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <PhoneCall className="h-3 w-3" />{p.voice_minutes || ''} min
                      </Badge>
                    ) : null}
                    {p.has_sms ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <MessageSquare className="h-3 w-3" />{p.sms_count || ''} SMS
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 font-bold text-primary">{formatPrice(p.price_naira)}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No plans found</p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <Card className="glass-card border-0">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Signal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                You have not purchased an all-inclusive eSIM yet.
              </CardContent>
            </Card>
          ) : orders.map((o) => (
            <Card key={o.id} className="glass-card border-0 cursor-pointer" onClick={() => setViewOrder(o)}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{o.package_name}</p>
                  <p className="text-xs text-muted-foreground break-all">
                    {o.iccid ? `ICCID: ${o.iccid}` : 'Provisioning…'}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatPrice(o.charged_naira)}</p>
                  <Badge variant="secondary">{o.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Purchase dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selected?.category === 'country' ? flagOf(selected?.location_code ?? null) : '🌍'}</span>
              <span className="text-base">{selected?.name}</span>
            </DialogTitle>
            <DialogDescription>{selected?.location || selected?.region || 'Multi-country plan'}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Data</span><span>{dataLabel(selected)}</span></div>
                {selected.validity_days ? (
                  <div className="flex justify-between"><span className="text-muted-foreground">Validity</span><span>{selected.validity_days} days</span></div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calls</span>
                  <span>{selected.has_voice ? `${selected.voice_minutes || 'Included'} min` : 'Not included'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMS</span>
                  <span>{selected.has_sms ? `${selected.sms_count || 'Included'} SMS` : 'Not included'}</span>
                </div>
                {selected.phone_number_included && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone number</span><span>Included</span></div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t border-border/50">
                  <span>Total</span><span className="text-primary">{formatPrice(selected.price_naira)}</span>
                </div>
              </div>

              {selected.requires_activation_date && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Activation date</Label>
                  <Input type="date" value={activationDate} onChange={(e) => setActivationDate(e.target.value)} />
                </div>
              )}

              {selected.description && (
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              )}

              <Button onClick={handleBuy} disabled={buying} className="w-full" size="lg">
                {buying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {buying ? 'Provisioning…' : `Buy for ${formatPrice(selected.price_naira)}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* eSIM details dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(v) => !v && setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Install your eSIM</DialogTitle>
            <DialogDescription>{viewOrder?.package_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewOrder?.qr_code_url && (
              <img src={viewOrder.qr_code_url} alt="eSIM installation QR code" className="w-56 h-56 mx-auto rounded-xl bg-white p-2" />
            )}
            {viewOrder?.activation_code && (
              <div className="space-y-1">
                <Label className="text-xs">Manual activation code</Label>
                <div className="flex items-center gap-2">
                  <code className="text-xs break-all bg-muted p-2 rounded-lg flex-1">{viewOrder.activation_code}</code>
                  <Button size="sm" variant="ghost" onClick={() => copy(viewOrder.activation_code!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            {viewOrder?.lpa_url && (
              <Button asChild className="w-full">
                <a href={viewOrder.lpa_url} target="_blank" rel="noreferrer">Install on iPhone</a>
              </Button>
            )}
            {!viewOrder?.qr_code_url && (
              <p className="text-sm text-muted-foreground text-center">
                Still provisioning — pull to refresh in a moment.
              </p>
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

export default AllInclusiveEsim;
