import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Wallet as WalletIcon, Plus, MessageCircle, History, Zap, Building2, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import PaymentPointAccount from '@/components/PaymentPointAccount';
import PayscribeAccount from '@/components/PayscribeAccount';
import LogPayFund from '@/components/LogPayFund';
import FundingAccountsDisplay from '@/components/FundingAccountsDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Wallet = () => {
  const [fundAmount, setFundAmount] = useState('');
  const { toast } = useToast();
  const { profile } = useAuth();
  const { transactions, loading } = useTransactions();
  const [autoProvider, setAutoProvider] = useState<'paymentpoint' | 'payscribe' | 'logpay'>('paymentpoint');

  const handleManualPayment = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid amount to fund.', variant: 'destructive' });
      return;
    }
    localStorage.setItem('pendingTransaction', JSON.stringify({
      amount: parseFloat(fundAmount), timestamp: new Date().toISOString(), status: 'pending',
    }));
    toast({ title: 'Redirecting…', description: `Sending you to support for ₦${parseFloat(fundAmount).toLocaleString('en-NG')}` });
    setTimeout(() => window.open('https://t.me/loghubmarketplace1', '_blank'), 800);
  };

  const formatPrice = (price: number) =>
    `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  const totalDeposits = transactions.filter((t) => t.transaction_type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.transaction_type === 'purchase').reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Balance hero card */}
      <div className="glass-card silk-shimmer rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Available Funds</p>
            <p className="text-3xl md:text-5xl font-bold mt-2">{formatPrice(profile?.wallet_balance || 0)}</p>
          </div>
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center">
            <WalletIcon className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-xl md:text-2xl font-bold mt-1">{formatPrice(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Deposits</p>
            <p className="text-xl md:text-2xl font-bold mt-1">{formatPrice(totalDeposits)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Instant funding cards */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Instant Funding</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Transfer to any of these virtual accounts to fund your wallet instantly.
        </p>
        <FundingAccountsDisplay variant="cards" />
      </div>

      {/* Funding options */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> Add Funds
          </CardTitle>
          <CardDescription>Choose your preferred payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="automatic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="automatic">Automatic Payment</TabsTrigger>
              <TabsTrigger value="manual">Manual Payment</TabsTrigger>
            </TabsList>

            <TabsContent value="automatic" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { key: 'paymentpoint', label: 'PaymentPoint', desc: 'Permanent NGN account', icon: Building2 },
                  { key: 'payscribe', label: 'Payscribe', desc: '9PSB virtual account', icon: CreditCard },
                  { key: 'logpay', label: 'LogPay', desc: 'Card, transfer, USSD', icon: Zap },
                ] as const).map(({ key, label, desc, icon: Icon }) => {
                  const active = autoProvider === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAutoProvider(key)}
                      className={`text-left glass-card rounded-2xl p-4 transition-all border-2 ${active ? 'border-primary shadow-lg scale-[1.02]' : 'border-transparent hover:border-border/60'}`}
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${active ? 'gradient-primary' : 'bg-muted'}`}>
                        <Icon className={`h-5 w-5 ${active ? 'text-primary-foreground' : 'text-foreground'}`} />
                      </div>
                      <div className="font-semibold">{label}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                {autoProvider === 'paymentpoint' && <PaymentPointAccount />}
                {autoProvider === 'payscribe' && <PayscribeAccount />}
                {autoProvider === 'logpay' && <LogPayFund />}
              </div>
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
              <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <MessageCircle className="h-4 w-4 text-primary" /> Manual Payment via Support
                </div>
                <p className="text-muted-foreground">
                  Click below to message support on Telegram with your amount and proof of payment. Your wallet is credited within 5–10 minutes.
                </p>
              </div>
              <Button onClick={handleManualPayment} className="w-full gap-2" size="lg">
                <MessageCircle className="h-4 w-4" />
                Pay via Support
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-background/40">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${transaction.transaction_type === 'deposit' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {transaction.transaction_type === 'deposit' ? <Plus className="h-4 w-4" /> : <History className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${transaction.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                    {transaction.amount > 0 ? '+' : ''}{formatPrice(Math.abs(transaction.amount))}
                  </p>
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
