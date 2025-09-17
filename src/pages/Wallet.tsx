import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, MessageCircle, CreditCard, DollarSign, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Wallet = () => {
  const [fundAmount, setFundAmount] = useState('');
  const { toast } = useToast();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const walletBalance = user.walletBalance || 0;

  const handleManualPayment = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to fund.",
        variant: "destructive",
      });
      return;
    }

    // Store the pending transaction
    const pendingTransaction = {
      amount: parseFloat(fundAmount),
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    localStorage.setItem('pendingTransaction', JSON.stringify(pendingTransaction));
    
    toast({
      title: "Redirecting to payment",
      description: `You will be redirecting to WhatsApp to complete payment of $${fundAmount}`,
    });

    // Redirect to WhatsApp
    setTimeout(() => {
      window.open('https://wa.link/8rqbox', '_blank');
    }, 1000);
  };

  const recentTransactions = [
    { id: '1', type: 'deposit', amount: 50.00, date: '2024-01-15', status: 'completed' },
    { id: '2', type: 'purchase', amount: -15.99, date: '2024-01-14', status: 'completed', description: 'Netflix Logs' },
    { id: '3', type: 'deposit', amount: 25.00, date: '2024-01-12', status: 'completed' },
    { id: '4', type: 'purchase', amount: -8.99, date: '2024-01-10', status: 'completed', description: 'Spotify Logs' },
  ];

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
                <p className="text-3xl font-bold text-primary">${walletBalance.toFixed(2)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">$24.98</p>
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
                <p className="text-2xl font-bold">$75.00</p>
              </div>
              <Plus className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Wallet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Funds
            </CardTitle>
            <CardDescription>
              Fund your wallet using manual payment method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
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

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="font-medium">Manual Payment</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Click below to contact our support team via WhatsApp for manual payment processing.
              </p>
            </div>

            <Button 
              onClick={handleManualPayment}
              className="w-full gap-2"
              size="lg"
            >
              <MessageCircle className="h-4 w-4" />
              Pay via WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <p className="text-sm">Enter the amount you want to add to your wallet</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <p className="text-sm">Click "Pay via WhatsApp" to contact our support</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <p className="text-sm">Follow payment instructions provided by support</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <p className="text-sm">Your wallet will be funded within 5-10 minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'deposit' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <WalletIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.type === 'deposit' ? 'Wallet Deposit' : 'Purchase'}
                    </p>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    transaction.amount > 0 ? 'text-success' : 'text-foreground'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;