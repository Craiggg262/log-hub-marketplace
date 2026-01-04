import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Wallet, Copy, Check, ArrowRight, Clock, CheckCircle, XCircle, Building2, Banknote } from 'lucide-react';

interface Referral {
  id: string;
  referred_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface ReferralEarning {
  id: string;
  amount: number;
  created_at: string;
  referred_id: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  withdrawal_type: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  status: string;
  created_at: string;
}

const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Opay',
  'Palmpay',
  'Parallex Bank',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'VFD Microfinance Bank',
  'Wema Bank',
  'Zenith Bank',
];

const ReferralEarn = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    type: 'wallet' as 'wallet' | 'bank',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
  const totalEarnings = profile?.total_referral_earnings || 0;

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      setReferrals(referralsData || []);

      // Fetch earnings
      const { data: earningsData } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      setEarnings(earningsData || []);

      // Fetch withdrawal requests
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      setWithdrawals(withdrawalsData || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Referral link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawalForm.amount);
    
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive',
      });
      return;
    }

    if (amount > totalEarnings) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have ₦${totalEarnings.toLocaleString('en-NG')} available`,
        variant: 'destructive',
      });
      return;
    }

    if (withdrawalForm.type === 'bank') {
      if (!withdrawalForm.bankName || !withdrawalForm.accountNumber || !withdrawalForm.accountName) {
        toast({
          title: 'Missing Bank Details',
          description: 'Please fill in all bank details',
          variant: 'destructive',
        });
        return;
      }
    }

    setWithdrawing(true);
    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: user?.id,
        amount,
        withdrawal_type: withdrawalForm.type,
        bank_name: withdrawalForm.type === 'bank' ? withdrawalForm.bankName : null,
        account_number: withdrawalForm.type === 'bank' ? withdrawalForm.accountNumber : null,
        account_name: withdrawalForm.type === 'bank' ? withdrawalForm.accountName : null,
        status: 'pending',
      });

      if (error) throw error;

      // Deduct from total_referral_earnings
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_referral_earnings: totalEarnings - amount })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: 'Withdrawal Request Submitted',
        description: withdrawalForm.type === 'wallet' 
          ? 'Your funds will be added to your wallet shortly'
          : 'Your bank transfer will be processed soon',
      });

      setWithdrawalForm({
        amount: '',
        type: 'wallet',
        bankName: '',
        accountNumber: '',
        accountName: '',
      });

      fetchData();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: 'Withdrawal Failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">Earn 5% commission on every purchase your referrals make - for life!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{referrals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatPrice(totalEarnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Banknote className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Rate</p>
                <p className="text-2xl font-bold">5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link with friends to earn 5% on their purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={handleCopyLink} variant="outline" className="shrink-0 gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Your referral code: <span className="font-mono font-bold text-primary">{referralCode}</span>
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="withdraw" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="referrals">Referrals ({referrals.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Earnings</CardTitle>
              <CardDescription>
                Available balance: {formatPrice(totalEarnings)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label>Withdrawal Type</Label>
                  <Select
                    value={withdrawalForm.type}
                    onValueChange={(value: 'wallet' | 'bank') =>
                      setWithdrawalForm({ ...withdrawalForm, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wallet">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          To Wallet Balance
                        </div>
                      </SelectItem>
                      <SelectItem value="bank">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          To Bank Account
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount (₦)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  />
                </div>

                {withdrawalForm.type === 'bank' && (
                  <>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Select
                        value={withdrawalForm.bankName}
                        onValueChange={(value) =>
                          setWithdrawalForm({ ...withdrawalForm, bankName: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {NIGERIAN_BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
                        type="text"
                        placeholder="Enter 10-digit account number"
                        maxLength={10}
                        value={withdrawalForm.accountNumber}
                        onChange={(e) =>
                          setWithdrawalForm({ ...withdrawalForm, accountNumber: e.target.value.replace(/\D/g, '') })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter account holder name"
                        value={withdrawalForm.accountName}
                        onChange={(e) =>
                          setWithdrawalForm({ ...withdrawalForm, accountName: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={withdrawing || totalEarnings <= 0}
                >
                  {withdrawing ? 'Processing...' : 'Submit Withdrawal Request'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Withdrawal History */}
          {withdrawals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(withdrawal.status)}
                        <div>
                          <p className="font-medium">{formatPrice(withdrawal.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.withdrawal_type === 'wallet' ? 'To Wallet' : `To ${withdrawal.bank_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(withdrawal.status)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(withdrawal.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>People who signed up using your referral link</CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No referrals yet</p>
                  <p className="text-sm">Share your referral link to start earning!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Referral</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {formatDate(referral.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
              <CardDescription>Commission earned from referral purchases</CardDescription>
            </CardHeader>
            <CardContent>
              {earnings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No earnings yet</p>
                  <p className="text-sm">You'll earn 5% when your referrals make purchases</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {earnings.map((earning) => (
                    <div
                      key={earning.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Banknote className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-green-500">+{formatPrice(earning.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            5% Commission
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(earning.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralEarn;