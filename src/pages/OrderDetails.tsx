import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Search, Download, Eye, Calendar, Copy, Lock, Wallet, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOrders, type Order } from '@/hooks/useOrders';
import { useUniversalLogsOrders, type UniversalLogsOrder } from '@/hooks/useUniversalLogsOrders';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import SocialIcon from '@/components/SocialIcon';
import logoImage from '@/assets/logo.png';

const OrderDetails = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { orders, loading } = useOrders();
  const { orders: universalOrders, loading: universalLoading } = useUniversalLogsOrders();
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
          if (orderLogItem && orderLogItem.log_items && orderLogItem.log_items.account_details) {
            content += `Account ${accountIndex + 1}:\n`;
            content += `${orderLogItem.log_items.account_details}\n\n`;
          }
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

  const handleDownloadUniversalOrder = (order: UniversalLogsOrder) => {
    let content = `UNIVERSAL LOGS ORDER DETAILS\n`;
    content += `================================\n`;
    content += `Order ID (Local): ${order.id}\n`;
    if (order.api_order_id) {
      content += `Order ID (NO1LOGS): ${order.api_order_id}\n`;
    }
    content += `Date: ${new Date(order.created_at).toLocaleDateString()}\n`;
    content += `Status: ${order.status}\n`;
    content += `Product: ${order.product_name}\n`;
    content += `Quantity: ${order.quantity}\n`;
    content += `Price per unit: ₦${order.price_per_unit.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n`;
    content += `Total: ₦${order.total_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}\n\n`;

    const resp = order.order_response;
    const orderItems = resp?.order_items ?? resp?.order?.order_items;

    if (Array.isArray(orderItems) && orderItems.length > 0) {
      content += `ACCOUNT DETAILS:\n`;
      content += `================================\n`;
      orderItems.forEach((item: any, idx: number) => {
        content += `\n--- Account ${idx + 1} ---\n`;
        if (item?.url) content += `URL: ${item.url}\n`;
        if (item?.details) content += `${item.details}\n`;
        if (!item?.details && !item?.url) content += `${JSON.stringify(item, null, 2)}\n`;
      });
    } else if (resp) {
      content += JSON.stringify(resp, null, 2);
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `universal-logs-order-${order.id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Your Universal Logs order details have been downloaded",
    });
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const completedOrders = orders.filter(order => order.status === 'completed').length + 
    universalOrders.filter(order => order.status === 'completed').length;
  const totalSpent = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total_amount, 0) +
    universalOrders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length + universalOrders.length;

  // Filtered Universal Logs orders
  const filteredUniversalOrders = universalOrders.filter(order => {
    const matchesSearch = order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                <p className="text-2xl font-bold">{totalOrders}</p>
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

      {/* Tabs for order types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Dashboard Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="universal" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Universal Logs ({universalOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Orders Tab */}
        <TabsContent value="dashboard">
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
                              {order.order_items.map((item) => (
                                <div key={item.id} className="border rounded-lg p-4">
                                  <div className="flex items-center gap-3 mb-4">
                                    <SocialIcon platform={item.logs.categories?.name || ''} size={24} />
                                    <div>
                                      <h3 className="text-lg font-semibold">{item.logs.title}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        Qty: {item.quantity} • {formatPrice(item.price_per_item)} each
                                      </p>
                                    </div>
                                  </div>

                                  {order.status === 'completed' && item.order_log_items && item.order_log_items.length > 0 ? (
                                    <div className="space-y-3">
                                      <h4 className="font-medium text-success">Account Details:</h4>
                                      {item.order_log_items.map((orderLogItem, accountIndex) => {
                                        const accountDetails = orderLogItem?.log_items?.account_details;
                                        
                                        if (!accountDetails) {
                                          return (
                                            <div key={orderLogItem.id} className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                              <p className="text-destructive text-sm">
                                                Account {accountIndex + 1}: Details not loaded. Please contact support.
                                              </p>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={orderLogItem.id} className="bg-muted/50 rounded-lg p-4">
                                            <div className="flex items-start gap-2 mb-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopyText(accountDetails, 'Account details')}
                                                className="shrink-0"
                                              >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy
                                              </Button>
                                              <h5 className="font-medium">Account {accountIndex + 1}</h5>
                                            </div>
                                            <pre className="text-sm whitespace-pre-wrap break-all bg-background p-3 rounded border overflow-hidden">
                                              {accountDetails}
                                            </pre>
                                            <p className="text-xs text-muted-foreground mt-2">
                                              Added: {new Date(orderLogItem.log_items.created_at).toLocaleDateString()}
                                            </p>
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
            <h3 className="text-lg font-semibold mb-2">No dashboard orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? "No orders match your filters."
                : "You haven't purchased any dashboard logs yet."}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button 
                className="mt-4"
                onClick={() => window.location.href = '/dashboard'}
              >
                Browse Dashboard Logs
              </Button>
            )}
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Universal Logs Orders Tab */}
        <TabsContent value="universal">
          {universalLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading universal logs orders...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUniversalOrders.map((order) => (
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
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Universal Logs
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{order.product_name}</h3>
                          <span className="text-sm text-muted-foreground">×{order.quantity}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          Ordered on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{formatPrice(order.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(order.price_per_unit)} each</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Globe className="h-5 w-5 text-primary" />
                                  Universal Logs Order #{order.id.slice(0, 8)}
                                </DialogTitle>
                                <DialogDescription>
                                  Placed on {new Date(order.created_at).toLocaleDateString()} • {order.status}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4">
                                  <div className="border rounded-lg p-4">
                                    <h4 className="font-semibold mb-2">{order.product_name}</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Quantity</p>
                                        <p className="font-medium">{order.quantity}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Price per unit</p>
                                        <p className="font-medium">{formatPrice(order.price_per_unit)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Total</p>
                                        <p className="font-medium text-primary">{formatPrice(order.total_amount)}</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <Badge className={getStatusColor(order.status)}>
                                          {order.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {order.order_response && (
                                    <div className="border rounded-lg p-4">
                                      <h4 className="font-semibold mb-2 text-success">Account Details</h4>

                                      {(() => {
                                        const resp = order.order_response;
                                        const orderItems = resp?.order_items ?? resp?.order?.order_items;

                                        if (Array.isArray(orderItems) && orderItems.length > 0) {
                                          return (
                                            <div className="space-y-3">
                                              {orderItems.map((item: any, idx: number) => {
                                                const copyText = item?.details || item?.url || JSON.stringify(item);
                                                return (
                                                  <div key={idx} className="bg-muted/50 rounded-lg p-3">
                                                    <div className="flex items-start gap-2 mb-2">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCopyText(copyText, 'Account details')}
                                                        className="shrink-0"
                                                      >
                                                        <Copy className="h-3 w-3 mr-1" />
                                                        Copy
                                                      </Button>
                                                      <span className="font-medium">Account {idx + 1}</span>
                                                    </div>

                                                    {item?.url && (
                                                      <p className="text-xs text-muted-foreground mb-2 break-all">URL: {item.url}</p>
                                                    )}

                                                    <pre className="text-sm whitespace-pre-wrap break-all bg-background p-3 rounded border overflow-hidden">
                                                      {item?.details || JSON.stringify(item, null, 2)}
                                                    </pre>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          );
                                        }

                                        return (
                                          <div className="bg-muted/50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-medium">Order Response</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopyText(
                                                  JSON.stringify(order.order_response, null, 2),
                                                  'Order response'
                                                )}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <pre className="text-sm whitespace-pre-wrap bg-background p-3 rounded border overflow-x-auto">
                                              {JSON.stringify(order.order_response, null, 2)}
                                            </pre>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                          
                          {order.status === 'completed' && order.order_response && (
                            <Button 
                              onClick={() => handleDownloadUniversalOrder(order)}
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
          )}

          {!universalLoading && filteredUniversalOrders.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Universal Logs orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? "No orders match your filters."
                    : "You haven't purchased from Universal Logs yet."}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = '/universal-logs'}
                  >
                    Browse Universal Logs
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderDetails;
