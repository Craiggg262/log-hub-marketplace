import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Search, TrendingDown, TrendingUp, History, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  wallet_balance: number;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface AdminBalanceManagementProps {
  profiles: Profile[];
  onRefresh: () => void;
}

const AdminBalanceManagement: React.FC<AdminBalanceManagementProps> = ({ profiles, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const { toast } = useToast();

  const filteredProfiles = profiles.filter(profile => 
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    profile.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const fetchUserTransactions = async (userId: string) => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUserTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user transactions",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleViewUser = async (profile: Profile) => {
    setSelectedUser(profile);
    await fetchUserTransactions(profile.user_id);
  };

  const handleOpenAdjustDialog = (type: 'add' | 'deduct') => {
    setAdjustType(type);
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustDialogOpen(true);
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !adjustAmount || !adjustReason) {
      toast({
        title: "Missing fields",
        description: "Please enter amount and reason",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive amount",
        variant: "destructive",
      });
      return;
    }

    setAdjusting(true);

    try {
      // Get current admin user
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) throw new Error('Not authenticated');

      // Calculate adjustment (negative for deductions)
      const adjustmentAmount = adjustType === 'deduct' ? -amount : amount;

      // Call secure RPC function
      const { data, error } = await supabase.rpc('admin_adjust_balance', {
        p_target_user_id: selectedUser.user_id,
        p_amount: adjustmentAmount,
        p_reason: adjustReason,
        p_admin_user_id: adminUser.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; previous_balance?: number; new_balance?: number; adjustment?: number };

      if (!result.success) {
        throw new Error(result.error || 'Adjustment failed');
      }

      toast({
        title: "Balance adjusted",
        description: `${adjustType === 'add' ? 'Added' : 'Deducted'} ${formatPrice(amount)} ${adjustType === 'add' ? 'to' : 'from'} ${selectedUser.email}. New balance: ${formatPrice(result.new_balance || 0)}`,
      });

      // Refresh data
      setAdjustDialogOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
      onRefresh();
      
      // Refresh transactions and update selected user balance
      await fetchUserTransactions(selectedUser.user_id);
      setSelectedUser(prev => prev ? { ...prev, wallet_balance: result.new_balance || 0 } : null);

    } catch (error) {
      console.error('Adjust balance error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to adjust balance",
        variant: "destructive",
      });
    } finally {
      setAdjusting(false);
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'deposit' || type === 'refund' || type === 'referral_withdrawal') {
      return 'text-green-600';
    }
    if (type === 'purchase' || type === 'adjustment') {
      return amount < 0 ? 'text-red-600' : 'text-green-600';
    }
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Balance Management
          </CardTitle>
          <CardDescription>
            View and adjust user wallet balances with full audit trail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{profile.full_name || 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {profile.user_id.slice(0, 8)}...
                    </code>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={profile.wallet_balance > 0 ? 'text-green-600 font-semibold' : ''}>
                      {formatPrice(profile.wallet_balance)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewUser(profile)}
                        >
                          <History className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[85vh]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            {selectedUser?.full_name || selectedUser?.email}
                          </DialogTitle>
                          <DialogDescription>
                            Current Balance: <span className="font-bold text-foreground">{formatPrice(selectedUser?.wallet_balance || 0)}</span>
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {/* Quick Actions */}
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleOpenAdjustDialog('add')}
                              className="gap-1"
                            >
                              <TrendingUp className="h-4 w-4" />
                              Add Funds
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleOpenAdjustDialog('deduct')}
                              className="gap-1"
                            >
                              <TrendingDown className="h-4 w-4" />
                              Deduct Funds
                            </Button>
                          </div>

                          {/* Transactions */}
                          <div>
                            <h4 className="font-medium mb-2">Transaction History</h4>
                            <ScrollArea className="h-[300px] border rounded-lg">
                              {loadingTransactions ? (
                                <div className="flex items-center justify-center py-8">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                </div>
                              ) : userTransactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No transactions</p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {userTransactions.map((tx) => (
                                      <TableRow key={tx.id}>
                                        <TableCell className="text-xs">
                                          {new Date(tx.created_at).toLocaleDateString('en-NG', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="text-xs">
                                            {tx.transaction_type}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm max-w-[200px] truncate">
                                          {tx.description || '-'}
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${getTransactionColor(tx.transaction_type, tx.amount)}`}>
                                          {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustType === 'add' ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
              {adjustType === 'add' ? 'Add Funds' : 'Deduct Funds'}
            </DialogTitle>
            <DialogDescription>
              {adjustType === 'add' 
                ? `Add funds to ${selectedUser?.email}'s wallet`
                : `Deduct funds from ${selectedUser?.email}'s wallet`
              }
            </DialogDescription>
          </DialogHeader>

          {adjustType === 'deduct' && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                This action cannot be undone. Deducted funds will be removed from the user's available balance.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjustAmount">Amount (₦)</Label>
              <Input
                id="adjustAmount"
                type="number"
                placeholder="Enter amount"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustReason">Reason (Required)</Label>
              <Textarea
                id="adjustReason"
                placeholder="e.g., Refund for failed order, Balance correction, Promo credit..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustBalance}
              disabled={adjusting || !adjustAmount || !adjustReason}
              variant={adjustType === 'deduct' ? 'destructive' : 'default'}
            >
              {adjusting ? 'Processing...' : adjustType === 'add' ? 'Add Funds' : 'Deduct Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBalanceManagement;
