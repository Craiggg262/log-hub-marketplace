import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { History as HistoryIcon, Search, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  type: 'purchase' | 'deposit' | 'refund';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  category?: string;
  balanceAfter: number;
}

const History = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Mock transaction history
  const transactions: Transaction[] = [
    {
      id: 'TXN-015',
      type: 'purchase',
      description: 'Premium Netflix Logs',
      amount: -15.99,
      date: '2024-01-15T10:30:00Z',
      status: 'completed',
      category: 'streaming',
      balanceAfter: 34.01
    },
    {
      id: 'TXN-014',
      type: 'deposit',
      description: 'Wallet funding via WhatsApp',
      amount: 50.00,
      date: '2024-01-15T09:15:00Z',
      status: 'completed',
      balanceAfter: 50.00
    },
    {
      id: 'TXN-013',
      type: 'purchase',
      description: 'Spotify Premium Logs',
      amount: -8.99,
      date: '2024-01-14T16:45:00Z',
      status: 'completed',
      category: 'streaming',
      balanceAfter: 41.01
    },
    {
      id: 'TXN-012',
      type: 'deposit',
      description: 'Wallet funding via WhatsApp',
      amount: 25.00,
      date: '2024-01-12T14:20:00Z',
      status: 'completed',
      balanceAfter: 25.00
    },
    {
      id: 'TXN-011',
      type: 'purchase',
      description: 'Disney+ Logs',
      amount: -10.99,
      date: '2024-01-10T11:30:00Z',
      status: 'completed',
      category: 'streaming',
      balanceAfter: 14.01
    },
    {
      id: 'TXN-010',
      type: 'deposit',
      description: 'Initial wallet funding',
      amount: 25.00,
      date: '2024-01-08T09:00:00Z',
      status: 'completed',
      balanceAfter: 25.00
    },
    {
      id: 'TXN-009',
      type: 'purchase',
      description: 'Failed purchase - Hulu Logs',
      amount: -9.99,
      date: '2024-01-07T15:20:00Z',
      status: 'failed',
      category: 'streaming',
      balanceAfter: 25.00
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'deposit' || amount > 0) {
      return <ArrowDownRight className="h-4 w-4 text-success" />;
    }
    return <ArrowUpRight className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success border-success/20';
      case 'pending':
        return 'bg-warning/20 text-warning border-warning/20';
      case 'failed':
        return 'bg-destructive/20 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = transactions
    .filter(t => t.type === 'purchase' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HistoryIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">View all your account activity</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <HistoryIcon className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold text-success">${totalDeposits.toFixed(2)}</p>
              </div>
              <ArrowDownRight className="h-10 w-10 text-success/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
              </div>
              <ArrowUpRight className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Activity</p>
                <p className={`text-2xl font-bold ${totalDeposits - totalSpent >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${(totalDeposits - totalSpent).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
            <SelectItem value="purchase">Purchases</SelectItem>
            <SelectItem value="refund">Refunds</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest transactions and account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction, index) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getTransactionIcon(transaction.type, transaction.amount)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{transaction.description}</h4>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      {transaction.category && (
                        <Badge variant="outline" className="capitalize">
                          {transaction.category}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{transaction.id}</span>
                      <span>{new Date(transaction.date).toLocaleString()}</span>
                      <span>Balance: ${transaction.balanceAfter.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    transaction.amount > 0 ? 'text-success' : 'text-foreground'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <HistoryIcon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || dateFilter !== 'all'
                  ? "No transactions match your current filters."
                  : "You haven't made any transactions yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default History;