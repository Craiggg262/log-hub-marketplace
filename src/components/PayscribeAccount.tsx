import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Copy, Check, Phone, Loader2, IdCard, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

const PayscribeAccount: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { profile, user, refreshProfile } = useAuth();

  useEffect(() => {
    if (!profile) { setChecking(false); return; }
    if ((profile as any).payscribe_account_number) {
      setVirtualAccount({
        accountNumber: (profile as any).payscribe_account_number,
        bankName: (profile as any).payscribe_account_bank || 'Payscribe',
        accountName: (profile as any).payscribe_account_name || profile.full_name || '',
      });
    }
    setPhoneNumber(profile.phone || '');
    setChecking(false);
  }, [profile]);

  const handleGenerate = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: 'Invalid phone number', description: 'Enter a valid Nigerian phone number.', variant: 'destructive' });
      return;
    }
    if (!user || !profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('payscribe-create-account', {
        body: {
          userId: user.id,
          email: profile.email,
          name: profile.full_name || profile.email.split('@')[0],
          phoneNumber,
          bank: '9psb',
        },
      });

      if (error) {
        let msg = error.message || 'Unable to generate account.';
        try {
          const ctx = (error as any).context;
          if (ctx?.json) {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          }
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      if (data?.success && data.data) {
        setVirtualAccount(data.data);
        await refreshProfile?.();
        toast({ title: 'Account Generated!', description: 'Your Payscribe account is ready.' });
      } else {
        throw new Error(data?.error || 'Failed to generate account');
      }
    } catch (e) {
      toast({
        title: "Couldn't generate Payscribe account",
        description: e instanceof Error ? e.message : 'Try again or use Manual Payment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Account number copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (checking) {
    return (
      <Card><CardContent className="p-6 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Payscribe Virtual Account</CardTitle>
        <CardDescription>
          {virtualAccount
            ? 'Transfer to your Payscribe account below to fund your wallet instantly'
            : 'Generate a Payscribe virtual account for instant wallet funding'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {virtualAccount ? (
          <>
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Bank Name:</span>
                <span className="font-medium">{virtualAccount.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Account Name:</span>
                <span className="font-medium text-right">{virtualAccount.accountName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-primary">{virtualAccount.accountNumber}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(virtualAccount.accountNumber)} className="h-8 w-8 p-0">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>How it works:</strong> Transfer any amount to the account above and your wallet will be credited instantly!
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="ps-phone" className="flex items-center gap-2"><Phone className="h-4 w-4" />Phone Number</Label>
              <Input id="ps-phone" type="tel" placeholder="e.g., 08012345678" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={11} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Bank</Label>
              <Select value={bank} onValueChange={(v) => setBank(v as 'palmpay' | '9psb')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="palmpay">PalmPay (requires BVN/NIN)</SelectItem>
                  <SelectItem value="9psb">9PSB Microfinance Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-dashed p-3 space-y-3">
              <div className="flex items-start gap-2">
                <IdCard className="h-4 w-4 mt-0.5 text-primary" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">KYC (required for PalmPay).</strong> Provide your BVN or NIN below.
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">ID Type</Label>
                  <Select value={idType} onValueChange={(v) => setIdType(v as 'bvn' | 'nin')}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bvn">BVN</SelectItem>
                      <SelectItem value="nin">NIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ID Number (11 digits)</Label>
                  <Input type="text" inputMode="numeric" placeholder="11-digit ID" value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 11))} maxLength={11} disabled={!idType} />
                </div>
              </div>
            </div>

            <Button onClick={handleGenerate} className="w-full gap-2" size="lg"
              disabled={loading || !phoneNumber || phoneNumber.length < 10}>
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" />Generating Account...</>)
                : (<><CreditCard className="h-4 w-4" />Generate Payscribe Account</>)}
            </Button>
          </>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Secure payment powered by Payscribe. Your account number is permanent.
        </div>
      </CardContent>
    </Card>
  );
};

export default PayscribeAccount;
