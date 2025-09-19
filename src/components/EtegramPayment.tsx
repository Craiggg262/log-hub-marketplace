import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';

// Import the Etegram payment library
declare global {
  interface Window {
    Etegram: any;
  }
}

interface EtegramPaymentProps {
  fundAmount: string;
  setFundAmount: (amount: string) => void;
}

const EtegramPayment: React.FC<EtegramPaymentProps> = ({ fundAmount, setFundAmount }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { createTransaction } = useTransactions();

  const handleEtegramPayment = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to fund.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Authentication required",
        description: "Please log in to fund your wallet.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(fundAmount);
    setLoading(true);

    try {
      // Load Etegram script if not already loaded
      if (!window.Etegram) {
        const script = document.createElement('script');
        script.src = 'https://js.etegram.com/inline.js';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Initialize Etegram payment
      const etegram = new window.Etegram({
        public_key: 'pk_live-fc160084a6f541fb96ed52d02d45d883',
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        customer_email: profile.email,
        customer_name: profile.full_name || profile.email,
        callback_url: 'https://0b928970e697.pagentry.africa/',
        onSuccess: async (response: any) => {
          try {
            // Create transaction record for successful payment
            await createTransaction(
              amount,
              'deposit',
              `Etegram payment - Transaction ID: ${response.transaction_id}`
            );

            toast({
              title: "Payment successful!",
              description: `₦${amount.toLocaleString('en-NG')} has been added to your wallet.`,
            });

            setFundAmount('');
            
            // Refresh the page to update wallet balance
            window.location.reload();
          } catch (error) {
            console.error('Error processing successful payment:', error);
            toast({
              title: "Payment completed but error occurred",
              description: "Your payment was successful but there was an error updating your wallet. Please contact support.",
              variant: "destructive",
            });
          }
        },
        onError: (error: any) => {
          console.error('Etegram payment error:', error);
          toast({
            title: "Payment failed",
            description: "There was an error processing your payment. Please try again.",
            variant: "destructive",
          });
        },
        onClose: () => {
          console.log('Payment dialog closed');
        }
      });

      etegram.setup();
      etegram.open();

    } catch (error) {
      console.error('Error initializing Etegram:', error);
      toast({
        title: "Payment system error",
        description: "Unable to initialize payment system. Please try again later.",
        variant: "destructive",
      });
    } finally {
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