import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bitcoin, ExternalLink, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { USD_RATE, formatPrice } from '@/lib/currency';

const QUICK = [5000, 10000, 25000, 50000];

type Provider = 'nowpayments' | 'fpayment';

const PROVIDERS: { value: Provider; label: string; description: string; fn: string }[] = [
  {
    value: 'nowpayments',
    label: 'NOWPayments',
    description: 'BTC, USDT, ETH, TRX and 200+ coins',
    fn: 'nowpayments-create-invoice',
  },
  {
    value: 'fpayment',
    label: 'FPayment',
    description: 'Fast USDT deposits',
    fn: 'fpayment-create-invoice',
  },
];

export function CryptoFunding() {
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<Provider>('nowpayments');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const naira = parseFloat(amount) || 0;
  const usd = naira / USD_RATE;
  const active = PROVIDERS.find((p) => p.value === provider)!;

  const handleFund = async () => {
    if (!naira || naira < USD_RATE) {
      toast({
        title: 'Invalid amount',
        description: `Minimum crypto funding is ${formatPrice(USD_RATE)} (about $1).`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Please sign in again to continue.');
      }

      const { data, error } = await supabase.functions.invoke(active.fn, {
        body: { action: 'createInvoice', amount_naira: naira },
      });

      if (error) {
        // Surface the real message returned by the function instead of the generic edge error
        let message = error.message;
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) message = body.error;
          }
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);

      const url = data?.invoice_url;
      if (!url) throw new Error('The payment provider did not return a checkout link. Please try again.');

      const win = window.open(url, '_blank');
      if (!win) window.location.href = url;

      toast({
        title: 'Crypto invoice created',
        description: 'Complete the payment on the checkout page. Your wallet is credited automatically once confirmed.',
      });
      setAmount('');
    } catch (e: any) {
      toast({ title: 'Could not start crypto payment', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
            <Bitcoin className="h-5 w-5 text-primary-foreground" />
          </div>
          Crypto Funding
          <Badge className="ml-1">NEW</Badge>
        </CardTitle>
        <CardDescription>
          Fund your wallet with crypto. Choose a payment provider, pay, and your balance is credited automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Payment provider</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as Provider)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{active.description}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cryptoAmount">Amount to fund (₦)</Label>
          <Input
            id="cryptoAmount"
            type="number"
            placeholder="Enter amount in Naira"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={USD_RATE}
          />
          {naira > 0 && (
            <p className="text-xs text-muted-foreground">
              ≈ ${usd.toFixed(2)} · rate $1 = ₦{USD_RATE.toLocaleString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {QUICK.map((q) => (
            <Button key={q} type="button" variant="outline" size="sm" onClick={() => setAmount(String(q))}>
              ₦{(q / 1000).toFixed(0)}k
            </Button>
          ))}
        </div>

        <Button onClick={handleFund} disabled={loading} className="w-full gap-2" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {loading ? 'Creating invoice…' : `Pay with ${active.label}`}
        </Button>
      </CardContent>
    </Card>
  );
}

export default CryptoFunding;
