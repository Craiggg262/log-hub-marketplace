import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Rocket, Search } from 'lucide-react';

interface Service {
  service: string;
  name: string;
  category: string;
  type: string;
  min: number;
  max: number;
  rate_naira_per_1000: number;
  rate_display: string;
}

const Boosting: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Service | null>(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('boosting-proxy', { body: { action: 'services' } });
        if (error) throw error;
        if (data?.success) setServices(data.data || []);
      } catch (e) {
        console.error(e);
        toast({ title: 'Failed to load services', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    services.forEach((x) => x.category && s.add(x.category));
    return ['all', ...Array.from(s).sort()];
  }, [services]);

  const filtered = useMemo(() => {
    return services
      .filter((s) => category === 'all' || s.category === category)
      .filter((s) => !query || s.name.toLowerCase().includes(query.toLowerCase()));
  }, [services, category, query]);

  const chargeDisplay = useMemo(() => {
    if (!selected || !quantity) return '₦0.00';
    const n = Number(quantity);
    if (!n) return '₦0.00';
    const total = (selected.rate_naira_per_1000 * n) / 1000;
    return `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [selected, quantity]);

  const place = async () => {
    if (!user || !selected || !link || !quantity) return;
    const n = Number(quantity);
    if (n < selected.min || n > selected.max) {
      toast({ title: 'Invalid quantity', description: `Enter between ${selected.min} and ${selected.max}.`, variant: 'destructive' });
      return;
    }
    setPlacing(true);
    try {
      const { data, error } = await supabase.functions.invoke('boosting-proxy', {
        body: { action: 'add', userId: user.id, service: selected.service, link, quantity: n },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Provider error');
      toast({ title: 'Order placed', description: `Order #${data.order} created. Processing…` });
      setLink('');
      setQuantity('');
      refreshProfile?.();
    } catch (e) {
      toast({ title: "Couldn't place order", description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card silk-shimmer rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Social Boosting</p>
            <p className="text-2xl md:text-3xl font-bold mt-2">Grow every platform in a tap</p>
            <p className="text-sm text-muted-foreground mt-1">Followers, likes, views, subscribers &amp; more.</p>
          </div>
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center">
            <Rocket className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
      </div>

      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Place a Boost</CardTitle>
          <CardDescription>Choose a service, paste your link, and set a quantity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {categories.map((c) => <SelectItem key={c} value={c}>{c === 'all' ? 'All categories' : c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Search service</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="e.g. Instagram followers" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-3"><Loader2 className="h-4 w-4 animate-spin" /> Loading services…</div>
            ) : (
              <Select value={selected?.service || ''} onValueChange={(v) => setSelected(services.find((x) => x.service === v) || null)}>
                <SelectTrigger><SelectValue placeholder={`${filtered.length} services available`} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {filtered.map((s) => (
                    <SelectItem key={s.service} value={s.service}>
                      {s.name} — {s.rate_display}/1000
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selected && (
              <p className="text-xs text-muted-foreground">
                Min {selected.min.toLocaleString()} • Max {selected.max.toLocaleString()} • Rate {selected.rate_display} per 1,000
              </p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Link</Label>
              <Input placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" placeholder="e.g. 1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-4 py-3">
            <span className="text-sm text-muted-foreground">You'll be charged</span>
            <span className="text-lg font-bold">{chargeDisplay}</span>
          </div>

          <Button className="w-full gap-2" size="lg" disabled={placing || !selected || !link || !quantity} onClick={place}>
            {placing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Place Boost Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Boosting;
