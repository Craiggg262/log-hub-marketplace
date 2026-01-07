import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Copy, Check, Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface VirtualAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
}

const PaymentPointAccount: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { profile, user } = useAuth();

  useEffect(() => {
    checkExistingAccount();
  }, [profile]);

  const checkExistingAccount = async () => {
    if (!profile) {
      setChecking(false);
      return;
    }
    
    if (profile.virtual_account_number) {
      setVirtualAccount({
        accountNumber: profile.virtual_account_number,
        bankName: profile.virtual_account_bank || 'PaymentPoint',
        accountName: profile.virtual_account_name || profile.full_name || ''
      });
      setPhoneNumber(profile.phone || '');
    }
    setChecking(false);
  };

  const handleGenerateAccount = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid Nigerian phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!user || !profile) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate your account.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('paymentpoint-create-account', {
        body: {
          userId: user.id,
          email: profile.email,
          name: profile.full_name || profile.email.split('@')[0],
          phoneNumber: phoneNumber
        }
      });

      if (error) throw error;

      if (data.success && data.data) {
        setVirtualAccount(data.data);
        toast({
          title: "Account Generated!",
          description: "Your personal account number has been created successfully.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate account');
      }

    } catch (error) {
      console.error('Error generating virtual account:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to generate account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Account number copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Automatic Payment
        </CardTitle>
        <CardDescription>
          {virtualAccount 
            ? "Transfer money to your personal account below to fund your wallet instantly"
            : "Generate your personal account number for instant wallet funding"
          }
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopy(virtualAccount.accountNumber)}
                    className="h-8 w-8 p-0"
                  >
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
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number (e.g., 08012345678)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                Enter a valid Nigerian phone number to generate your account
              </p>
            </div>

            <Button 
              onClick={handleGenerateAccount}
              className="w-full gap-2"
              size="lg"
              disabled={loading || !phoneNumber || phoneNumber.length < 10}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Account...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Generate My Account Number
                </>
              )}
            </Button>
          </>
        )}

        <div className="text-xs text-muted-foreground text-center">
          Secure payment powered by PaymentPoint. Your personal account number is permanent.
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentPointAccount;