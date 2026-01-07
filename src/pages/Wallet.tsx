import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, MessageCircle, CreditCard, TrendingUp, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import PaymentPointAccount from '@/components/PaymentPointAccount';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Wallet = () => {
  const [fundAmount, setFundAmount] = useState('');
  const { toast } = useToast();
  const { profile } = useAuth();
  const { transactions, loading } = useTransactions();

  const handleManualPayment = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to fund.",
        variant: "destructive",
      });
      return;
    }

    // Store the pending transaction for reference
    const pendingTransaction = {
      amount: parseFloat(fundAmount),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    localStorage.setItem('pendingTransaction', JSON.stringify(pendingTransaction));
    
    toast({
      title: "Redirecting to payment",
      description: `You will be redirected to WhatsApp to complete payment of ₦${parseFloat(fundAmount).toLocaleString('en-NG')}`,
    });

    // Redirect to WhatsApp
    setTimeout(() => {
      window.open('https://wa.link/8rqbox', '_blank');
    }, 1000);
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const totalDeposits = transactions
    .filter(t => t.transaction_type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = transactions
    .filter(t => t.transaction_type === 'purchase')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <WalletIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and transactions</p>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(profile?.wallet_balance || 0)}</p>
              </div>
              <WalletIcon className="h-12 w-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
              </div>
              <History className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold">{formatPrice(totalDeposits)}</p>
              </div>
              <Plus className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Wallet with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Funds
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="automatic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="automatic">Automatic Payment</TabsTrigger>
              <TabsTrigger value="manual">Manual Payment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="automatic" className="mt-6">
              <PaymentPointAccount />
            </TabsContent>
            
            <TabsContent value="manual" className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manualAmount">Amount (₦)</Label>
                <Input
                  id="manualAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="1"
                  step="0.01"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="font-medium">Manual Payment Instructions</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <span>Enter the amount you want to add</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <span>Click "Pay via WhatsApp" below</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <span>Send payment proof to our support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-medium">4.</span>
                    <span>Wallet credited within 5-10 minutes</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Support: info.loghubmarketplace@gmail.com
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleManualPayment}
                className="w-full gap-2"
                size="lg"
              >
                <MessageCircle className="h-4 w-4" />
                Pay via WhatsApp
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'deposit' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {transaction.transaction_type === 'deposit' ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <WalletIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.amount > 0 ? 'text-success' : 'text-foreground'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatPrice(Math.abs(transaction.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;