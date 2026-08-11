import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bitcoin, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { USD_RATE, formatPrice } from '@/lib/currency';

const QUICK = [5000, 10000, 25000, 50000];

export function CryptoFunding() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const naira = parseFloat(amount) || 0;
  const usd = naira / USD_RATE;

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
      const { data, error } = await supabase.functions.invoke('nowpayments-create-invoice', {
        body: { action: 'createInvoice', amount_naira: naira },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.invoice_url) {
        window.open(data.invoice_url, '_blank');
        toast({
          title: 'Crypto invoice created',
          description: 'Complete the payment in the new tab. Your wallet is credited automatically once confirmed.',
        });
        setAmount('');
      }
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
          Fund your wallet with BTC, USDT, ETH, TRX and 200+ coins via NOWPayments. Credited automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          {loading ? 'Creating invoice…' : 'Pay with Crypto'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default CryptoFunding;
