import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const LogPayFund: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const start = async () => {
    const n = Number(amount);
    if (!n || n < 100) {
      toast({ title: 'Enter a valid amount', description: 'Minimum is ₦100', variant: 'destructive' });
      return;
    }
    if (!user || !profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('logpay-create-checkout', {
        body: {
          userId: user.id,
          amount: n,
          email: profile.email,
          name: profile.full_name || profile.email.split('@')[0],
          callbackUrl: `${window.location.origin}/wallet`,
        },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Failed');
      const url = data.data?.checkout_url;
      if (!url) throw new Error('No checkout link returned');
      window.open(url, '_blank', 'noopener,noreferrer');
      toast({ title: 'Checkout opened', description: 'Complete payment in the new tab. Your wallet is credited automatically.' });
    } catch (e) {
      toast({ title: "Couldn't start LogPay checkout", description: e instanceof Error ? e.message : 'Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />LogPay Instant Checkout</CardTitle>
        <CardDescription>Pay with card, bank transfer, USSD or bank — wallet credited automatically after payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lp-amount">Amount (₦)</Label>
          <Input
            id="lp-amount"
            type="number"
            min={100}
            step={100}
            placeholder="e.g. 2000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Button onClick={start} disabled={loading || !amount} className="w-full gap-2" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          Pay ₦{Number(amount || 0).toLocaleString('en-NG')} with LogPay
        </Button>
        <p className="text-xs text-muted-foreground text-center">Powered by LogPay. Redirects to a secure Squad checkout page.</p>
      </CardContent>
    </Card>
  );
};

export default LogPayFund;
