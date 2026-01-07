import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, MessageCircle, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PaymentPointAccount from '@/components/PaymentPointAccount';

const FundWallet = () => {
  const [fundAmount, setFundAmount] = useState('');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Account details copied to clipboard",
    });
  };

  const handleManualPayment = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to fund.",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentDetails(true);
  };

  const handleWhatsAppRedirect = () => {
    const amount = parseFloat(fundAmount);
    const message = `Hello! I want to fund my wallet with ${formatPrice(amount)}. I have made the payment and will send proof shortly.`;
    const whatsappUrl = `https://wa.link/8rqbox?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Redirecting to WhatsApp",
      description: "Please send your payment proof to complete the funding.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <WalletIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Fund Wallet</h1>
          <p className="text-muted-foreground">Add funds to your account</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="space-y-4">
          <PaymentPointAccount />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Manual Payment
              </CardTitle>
              <CardDescription>
                Pay via bank transfer and get manual verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="1"
                  step="0.01"
                />
              </div>

              <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={handleManualPayment}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Proceed to Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Payment Details</DialogTitle>
                    <DialogDescription>
                      Transfer {fundAmount ? formatPrice(parseFloat(fundAmount)) : '₦0.00'} to the account below
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Account Number:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">5567602066</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopyAccount('5567602066')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Account Name:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">EJEMEGWA CHUKWUJEKWU PETER</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopyAccount('EJEMEGWA CHUKWUJEKWU PETER')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Bank:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">MONIEPOINT MFB</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopyAccount('MONIEPOINT MFB')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Amount:</span>
                          <span className="text-lg font-bold text-primary">
                            {fundAmount ? formatPrice(parseFloat(fundAmount)) : '₦0.00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800 mb-2">
                        <strong>Important:</strong> Once you have completed your payment, send a screenshot of the payment and your email for funding to the WhatsApp below.
                      </p>
                    </div>

                    <Button 
                      onClick={handleWhatsAppRedirect}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send Payment Proof via WhatsApp
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
            <CardDescription>Follow these steps to fund your wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <p className="text-sm">Generate your personal account number (one-time setup)</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <p className="text-sm">Transfer any amount to your personal account</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <p className="text-sm">Your wallet will be credited instantly!</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Need Help?</h4>
              <p className="text-xs text-blue-700">
                If you encounter any issues during the payment process, please contact our support team via WhatsApp for immediate assistance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FundWallet;