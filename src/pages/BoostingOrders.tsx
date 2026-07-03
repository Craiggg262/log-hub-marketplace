import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, RefreshCw, Rocket, Clock, ExternalLink } from 'lucide-react';

interface BoostOrder {
  id: string;
  provider_order: string;
  service_name: string;
  link: string;
  quantity: number;
  charge_amount: number;
  status: string;
  start_count: number | null;
  remains: number | null;
  refunded_amount: number;
  average_time: string | null;
  created_at: string;
}

const statusStyle = (s: string) => {
  const v = s.toLowerCase();
  if (v.includes('complet')) return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
  if (v.includes('cancel')) return 'bg-red-500/15 text-red-500 border-red-500/30';
  if (v.includes('partial')) return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
  if (v.includes('progress') || v.includes('processing')) return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
  return 'bg-muted text-muted-foreground border-border';
};

const naira = (n: number) => `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatAvgTime = (raw: string | null) => {
  if (!raw) return null;
  const mins = Number(raw);
  if (!Number.isFinite(mins) || mins <= 0) return raw;
  if (mins < 60) return `~${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m ? `~${h}h ${m}m` : `~${h}h`;
};

const BoostingOrders: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<BoostOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('boosting-proxy', {
        body: { action: 'list', userId: user.id },
      });
      if (error) throw error;
      if (data?.success) {
        setOrders(data.data || []);
        refreshProfile?.();
      }
    } catch (e) {
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="glass-card silk-shimmer rounded-2xl p-5 md:p-7 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Boosting</p>
          <p className="text-xl md:text-2xl font-bold mt-1 break-words">Order History</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">
            Live status from provider. Cancelled → full refund. Partial → refund for undelivered.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing || loading} className="gap-2 shrink-0">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="py-12 text-center space-y-2">
            <Rocket className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No boosting orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const delivered = o.start_count != null && o.remains != null
              ? Math.max(0, o.quantity - (o.remains ?? 0))
              : null;
            const pct = delivered != null ? Math.min(100, Math.round((delivered / o.quantity) * 100)) : null;
            const eta = formatAvgTime(o.average_time);
            return (
              <Card key={o.id} className="glass-card border-0 overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold break-words">{o.service_name}</p>
                      <p className="text-xs text-muted-foreground break-all">Order #{o.provider_order}</p>
                    </div>
                    <Badge variant="outline" className={`${statusStyle(o.status)} shrink-0`}>{o.status}</Badge>
                  </div>

                  <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-2 text-sm">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-muted-foreground shrink-0">Link:</span>
                      <a
                        href={o.link}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-primary hover:underline break-all inline-flex items-start gap-1 min-w-0"
                      >
                        <span className="break-all">{o.link}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 mt-1" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Quantity:</span> <span className="font-medium">{o.quantity.toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">Charged:</span> <span className="font-medium">{naira(o.charge_amount)}</span></div>
                      {delivered != null && (
                        <>
                          <div><span className="text-muted-foreground">Delivered:</span> <span className="font-medium">{delivered.toLocaleString()}</span></div>
                          <div><span className="text-muted-foreground">Remaining:</span> <span className="font-medium">{(o.remains ?? 0).toLocaleString()}</span></div>
                        </>
                      )}
                      {o.refunded_amount > 0 && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Refunded:</span>{' '}
                          <span className="font-medium text-emerald-500">{naira(o.refunded_amount)}</span>
                        </div>
                      )}
                    </div>

                    {pct != null && (
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{pct}% delivered</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span>{new Date(o.created_at).toLocaleString()}</span>
                      {eta && (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Avg time {eta}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BoostingOrders;
