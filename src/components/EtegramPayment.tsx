import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
interface EtegramPaymentProps {
  fundAmount: string;
  setFundAmount: (amount: string) => void;
}

declare global {
  interface Window {
    EtegramPay: {
      setup: (config: any) => void;
    };
  }
}

const EtegramPayment: React.FC<EtegramPaymentProps> = ({ fundAmount, setFundAmount }) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { createTransaction } = useTransactions();

  // Load Etegram script
  React.useEffect(() => {
    if (!document.querySelector('script[src*="etegram"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.etegram.com/etegram-inline.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        console.log('Etegram script loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Etegram script');
        toast({
          title: "Payment system error",
          description: "Unable to load payment system. Please check your internet connection.",
          variant: "destructive",
        });
      };
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, [toast]);

  const handleEtegramPayment = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to fund.",
        variant: "destructive",
      });
      return;
    }

    if (!scriptLoaded || !window.EtegramPay) {
      toast({
        title: "Payment system not ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(fundAmount);
    setLoading(true);

    try {
      const paymentConfig = {
        key: 'pk_live-fc160084a6f541fb96ed52d02d45d883',
        email: profile?.email || 'guest@example.com',
        amount: amount * 100, // Convert to kobo
        firstname: profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Guest',
        lastname: profile?.full_name?.split(' ')[1] || 'User',
        phone: profile?.phone || '',
        ref: `etegram_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        callback: function(response: any) {
          console.log('Payment callback:', response);
          if (response.status === 'success' || response.resp?.status === 'success') {
            toast({
              title: "Payment successful!",
              description: `Your wallet has been funded with ₦${amount.toLocaleString()}.`,
            });
            
            // Create transaction record
            if (profile?.id) {
              createTransaction(
                amount,
                'deposit',
                `Wallet funding via Etegram - Ref: ${response.reference || response.resp?.reference}`
              ).catch(console.error);
            }
            
            // Reset form
            setFundAmount('');
          } else {
            toast({
              title: "Payment failed",
              description: "Your payment could not be processed. Please try again.",
              variant: "destructive",
            });
          }
        },
        onClose: function() {
          console.log('Payment modal closed');
          setLoading(false);
        }
      };

      // Initialize Etegram payment
      window.EtegramPay.setup(paymentConfig);

    } catch (error) {
      console.error('Error initializing Etegram:', error);
      toast({
        title: "Payment system error",
        description: "Unable to initialize payment system. Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Automatic Payment
        </CardTitle>
        <CardDescription>
          Fast and automated payment processing with Etegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="etegramAmount">Amount (₦)</Label>
          <Input
            id="etegramAmount"
            type="number"
            placeholder="Enter amount"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
            min="1"
            step="0.01"
          />
        </div>

        {fundAmount && parseFloat(fundAmount) > 0 && (
          <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Amount to pay:</span>
              <span className="text-lg font-bold text-primary">
                {formatPrice(parseFloat(fundAmount))}
              </span>
            </div>
          </div>
        )}

        <Button 
          onClick={handleEtegramPayment}
          className="w-full gap-2"
          size="lg"
          disabled={loading || !fundAmount || parseFloat(fundAmount) <= 0}
        >
          <Clock className="h-4 w-4" />
          {loading ? 'Processing...' : 'Pay with Etegram'}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Secure payment powered by Etegram. Your funds will be added instantly after successful payment.
        </div>
      </CardContent>
    </Card>
  );
};

export default EtegramPayment;