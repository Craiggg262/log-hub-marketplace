import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Download, Eye, Calendar, Copy, Lock, Wallet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useOrders, type Order } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import SocialIcon from '@/components/SocialIcon';
import logoImage from '@/assets/logo.png';

const OrderDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, loading } = useOrders();
  const { profile } = useAuth();
  const { createTransaction } = useTransactions();
  const { toast } = useToast();

  const filteredOrders = orders.filter(order => {
    if (!order.order_items || order.order_items.length === 0) return false;
    
    const matchesSearch = order.order_items.some(item => 
      item.logs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  const handleCopyText = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${description} copied to clipboard`,
    });
  };

  const handleCashout = async (order: Order) => {
    if (!profile) {
      toast({
        title: "Authentication required",
        description: "Please log in to cashout your order.",
        variant: "destructive",
      });
      return;
    }

    const cashoutAmount = order.total_amount * 0.8;
    
    try {
      await createTransaction(
        cashoutAmount,
        'refund',
        `Cashout from order #${order.id.slice(0, 8)} - ${order.order_items.length} items`
      );

      toast({
        title: "Cashout successful!",
        description: `₦${cashoutAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} has been added to your wallet balance.`,
      });

    } catch (error) {
      console.error('Cashout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('insufficient')) {
        toast({
          title: "Insufficient balance",
          description: "You don't have sufficient balance for this cashout.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cashout failed",
          description: "There was an error processing your cashout. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadOrder = (order: Order) => {
    if (order.status !== 'completed') {
      toast({
        title: "Order not completed",
        description: "You can only download completed orders",
        variant: "destructive",
      });
      return;
    }
 let content = `ORDER DETAILS\n`;
    content += `Order ID: ${order.id}\n`;
    content += `Date: ${new Date(order.created_at).toLocaleDateString()}\n`;
    content += `Status: ${order.status}\n`;
    content += `Total: ₦${order.total_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n\n`;

    order.order_items.forEach((item, index) => {
      content += `--- LOG ${index + 1}: ${item.logs.title} ---\n`;
      content += `Quantity: ${item.quantity}\n`;
      content += `Price per item: ₦${item.price_per_item.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n\n`;
      
      if (item.order_log_items && item.order_log_items.length > 0) {
        content += `ACCOUNT DETAILS:\n`;
        item.order_log_items.forEach((orderLogItem, accountIndex) => {
          const accountDetails = orderLogItem.log_id.account_details|| ;
          content += `Account ${accountIndex + 1}:\n`;
          content += `${accountDetails}\n\n`;
        });
      }
    });                        
    

    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-${order.id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your order details have been downloaded",
    });
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const totalSpent = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <img src={logoImage} alt="Log Hub Logo" className="h-12 w-12 object-contain rounded-lg" />
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">View your purchased logs and account details</p>
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
                <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{order.id.slice(0, 8)}
                      </Badge>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <SocialIcon platform={item.logs.categories?.name || ''} size={20} />
                            <h3 className="text-lg font-semibold">{item.logs.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">×{item.quantity}</span>
                            {order.status === 'completed' && item.order_log_items && item.order_log_items.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {item.order_log_items.length} Account{item.order_log_items.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      Ordered on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatPrice(order.total_amount)}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Order #{order.id.slice(0, 8)}</DialogTitle>
                            <DialogDescription>
                              Placed on {new Date(order.created_at).toLocaleDateString()} • {order.status}
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6">
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <pre className="text-sm whitespace-pre-wrap bg-background p-3 rounded border">
                                              {accountDetails}
                                            </pre>
                                            {orderLogItem.log_items && (
                                              <p className="text-xs text-muted-foreground mt-2">
                                                Added: {new Date(orderLogItem.log_items.created_at).toLocaleDateString()}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : order.status === 'pending' ? (
                                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                                      <div className="flex items-center gap-2 text-warning">
                                        <Lock className="h-4 w-4" />
                                        <span className="font-medium">Details will be revealed once payment is processed</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-muted/50 rounded-lg p-4">
                                      <p className="text-muted-foreground text-sm">Details not available</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      
                      {order.status === 'completed' && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleDownloadOrder(order)}
                            size="sm"
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          
                          <Button 
                            onClick={() => handleCashout(order)}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                          >
                            <Wallet className="h-4 w-4" />
                            Cashout
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? "No orders match your filters."
                : "You haven't purchased any logs yet. Visit Dashboard to browse."}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                className="mt-4"
                onClick={() => window.location.href = '/dashboard'}
              >
                Browse Logs
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderDetails;
