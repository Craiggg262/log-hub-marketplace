import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { payWithEtegram } from 'etegram-pay';

interface EtegramPaymentProps {
  fundAmount: string;
  setFundAmount: (amount: string) => void;
}

const EtegramPayment: React.FC<EtegramPaymentProps> = ({ fundAmount, setFundAmount }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleEtegramPayment = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to fund.",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.email) {
      toast({
        title: "Profile required",
        description: "Please update your profile with email before making a payment.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(fundAmount);
    setLoading(true);

    try {
      // Better name parsing
      let firstname = 'User';
      let lastname = '';
      
      if (profile.full_name) {
        const nameParts = profile.full_name.trim().split(' ');
        firstname = nameParts[0] || 'User';
        lastname = nameParts.slice(1).join(' ') || '';
      } else {
        const emailName = profile.email.split('@')[0];
        firstname = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }

      const dataToSubmit = {
        projectID: '6905b904aa62e896cfdac643',
        publicKey: 'pk_live-c6cf1d388527492c9493fc25951286b7',
        amount: amount.toString(),
        email: profile.email,
        phone: profile.phone || '0000000000',
        firstname: firstname,
        lastname: lastname,
        reference: `loghub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };

      console.log('Initiating Etegram Pay with data:', dataToSubmit);
      
      // Call the payWithEtegram function
      const result = await payWithEtegram(dataToSubmit);
      console.log('Etegram Pay result:', result);
      
      toast({
        title: "Payment initiated",
        description: "Complete the payment to fund your wallet.",
      });

      // Reset form after successful initiation
      setFundAmount('');

    } catch (error) {
      console.error('Error initializing Etegram Pay:', error);
      toast({
        title: "Payment error",
        description: error instanceof Error ? error.message : "Unable to initialize payment. Please try again.",
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