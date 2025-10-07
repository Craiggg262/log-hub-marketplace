import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart,
  Search,
  Download,
  Eye,
  Calendar,
  Copy
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useOrders } from '@/hooks/useOrders';
import { toast } from '@/components/ui/use-toast'; // optional if your UI lib supports toast

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { orders, loading } = useOrders();

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
          content += `Account ${accountIndex + 1}:\n`;
          content += `${orderLogItem.log_items.account_details}\n\n`;
        });
      }
      content += `\n`;
    });

      const blob = new Blob([fullContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-${order.id.slice(0, 8)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Download failed.');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (toast) toast({ title: 'Copied!', description: text });
      else alert('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const totalSpent = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">View and manage your purchases</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
            <ShoppingCart className="h-10 w-10 text-muted-foreground/20" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedOrders}</p>
            </div>
            <Badge className="bg-success/20 text-success">Success</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
            </div>
            <Calendar className="h-10 w-10 text-muted-foreground/20" />
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
        <div className="flex justify-center py-12">
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
                          <h3 className="text-lg font-semibold">{item.logs.title}</h3>
                          <span className="text-sm text-muted-foreground">×{item.quantity}</span>
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
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>

                      {order.status === 'completed' && (
                        <Button onClick={() => handleDownload(order)} size="sm" className="gap-2">
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

      {!loading && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'No orders match your current filters.'
                : "You haven't made any purchases yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Log Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder.id.slice(0, 8)}</DialogTitle>
              <DialogDescription>
                Purchased on {new Date(selectedOrder.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {selectedOrder.order_items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.logs.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.logs ? (
                      <div className="space-y-2 text-sm">
                        {Object.entries(item.logs).map(([key, value]) => {
                          if (key === 'title' || key === 'id') return null;
                          return (
                            <div key={key} className="flex justify-between items-center border-b pb-1">
                              <span className="capitalize text-muted-foreground">{key}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium break-all">{String(value)}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(String(value))}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No details available for this log.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default Orders;
