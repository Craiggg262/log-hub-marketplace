import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Download, Eye, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Order {
  id: string;
  logTitle: string;
  price: number;
  purchaseDate: string;
  status: 'completed' | 'pending' | 'failed';
  category: string;
  downloadUrl?: string;
}

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock orders data
  const orders: Order[] = [
    {
      id: 'ORD-001',
      logTitle: 'Premium Netflix Logs',
      price: 15.99,
      purchaseDate: '2024-01-15',
      status: 'completed',
      category: 'streaming',
      downloadUrl: '/downloads/netflix-logs.txt'
    },
    {
      id: 'ORD-002',
      logTitle: 'Spotify Premium Logs',
      price: 8.99,
      purchaseDate: '2024-01-14',
      status: 'completed',
      category: 'streaming',
      downloadUrl: '/downloads/spotify-logs.txt'
    },
    {
      id: 'ORD-003',
      logTitle: 'Amazon Prime Logs',
      price: 12.99,
      purchaseDate: '2024-01-12',
      status: 'pending',
      category: 'shopping'
    },
    {
      id: 'ORD-004',
      logTitle: 'Disney+ Logs',
      price: 10.99,
      purchaseDate: '2024-01-10',
      status: 'completed',
      category: 'streaming',
      downloadUrl: '/downloads/disney-logs.txt'
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.logTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleDownload = (order: Order) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = order.downloadUrl || '#';
    link.download = `${order.logTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSpent = orders.reduce((sum, order) => order.status === 'completed' ? sum + order.price : sum, 0);
  const completedOrders = orders.filter(order => order.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">View and manage your purchases</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedOrders}</p>
              </div>
              <Badge className="bg-success/20 text-success">
                Success
              </Badge>
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
              <Calendar className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {order.id}
                    </Badge>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {order.category}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-1">{order.logTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    Purchased on {new Date(order.purchaseDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">${order.price}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    
                    {order.status === 'completed' && order.downloadUrl && (
                      <Button 
                        onClick={() => handleDownload(order)}
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? "No orders match your current filters."
                : "You haven't made any purchases yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Orders;