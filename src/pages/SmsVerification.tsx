import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  Search, 
  Copy, 
  RefreshCw, 
  X, 
  Clock,
  CheckCircle,
  Loader2,
  MessageSquare,
  Globe,
  History,
  AlertCircle,
  Wallet
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Service {
  service_id: string;
  name: string;
  price: string;
  price_display: string;
  original_usd_price: string;
  validity_time: string;
}

interface ActiveRental {
  id: string;
  number: string;
  service_name: string;
  price: number;
  price_display: string;
  code: string | null;
  time_remaining: number;
  expires_at: number;
  status: 'waiting_number' | 'waiting_code' | 'code_received' | 'cancelled' | 'expired';
}

interface OrderHistory {
  id: string;
  rental_id: string;
  service_name: string;
  phone_number: string | null;
  verification_code: string | null;
  charged_price: number;
  status: string;
  refunded: boolean;
  created_at: string;
  expires_at: string;
}

export default function SmsVerification() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
  const [purchasingService, setPurchasingService] = useState<string | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchOrderHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = services.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchQuery, services]);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRentals(prev => prev.map(rental => {
        const remaining = Math.max(0, Math.floor((rental.expires_at - Date.now()) / 1000));
        
        // If expired and no code, trigger refund
        if (remaining <= 0 && rental.status !== 'code_received' && rental.status !== 'expired' && rental.status !== 'cancelled') {
          handleExpiredRental(rental.id);
          return { ...rental, time_remaining: 0, status: 'expired' as const };
        }
        
        return { ...rental, time_remaining: remaining };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Poll for code updates on active rentals
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    activeRentals.forEach(rental => {
      if ((rental.status === 'waiting_code' || rental.status === 'waiting_number') && rental.time_remaining > 0) {
        const interval = setInterval(() => {
          checkRentalStatus(rental.id);
        }, 5000);
        intervals.push(interval);
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [activeRentals]);

  const fetchOrderHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('sms_verification_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrderHistory(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data, error } = await supabase.functions.invoke('sms-verification', {
        body: { action: 'allService' }
      });

      if (error) throw error;
      if (data.status === 'success') {
        setServices(data.data || []);
        setFilteredServices(data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpiredRental = async (rentalId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sms-verification', {
        body: { action: 'refundExpired', id: rentalId }
      });

      if (error) throw error;
      
      if (data.status === 'success') {
        toast({
          title: "Refund Processed",
          description: `${data.refunded_amount_display} has been refunded to your wallet`,
        });
        refreshProfile?.();
        fetchOrderHistory();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
    }
  };

  const purchaseNumber = async (service: Service) => {
    if (!profile) return;
    
    const price = parseFloat(service.price);
    if (profile.wallet_balance < price) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${service.price_display} but only have ₦${profile.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        variant: "destructive"
      });
      return;
    }

    setPurchasingService(service.service_id);
    
    try {
      const { data, error } = await supabase.functions.invoke('sms-verification', {
        body: { 
          action: 'getNumber',
          service_id: service.service_id,
          max_price: service.original_usd_price
        }
      });

      if (error) throw error;
      
      if (data.status === 'success' && data.data) {
        const expiresAt = Date.now() + (data.data.time_remaining * 1000);
        
        const rental: ActiveRental = {
          id: data.data.id,
          number: data.data.number,
          service_name: data.data.service_name,
          price: data.data.charged_price,
          price_display: data.data.charged_price_display,
          code: null,
          time_remaining: data.data.time_remaining,
          expires_at: expiresAt,
          status: data.data.number === 'waiting' ? 'waiting_number' : 'waiting_code'
        };
        
        setActiveRentals(prev => [...prev, rental]);
        refreshProfile?.();
        fetchOrderHistory();
        
        toast({
          title: "Number Purchased",
          description: rental.number === 'waiting' 
            ? "Waiting for number assignment..." 
            : `Number: ${rental.number}`,
        });
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error(data.message || 'Failed to purchase number');
      }
    } catch (error: any) {
      console.error('Error purchasing number:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to purchase number",
        variant: "destructive"
      });
    } finally {
      setPurchasingService(null);
    }
  };

  const checkRentalStatus = async (rentalId: string) => {
    try {
      const rental = activeRentals.find(r => r.id === rentalId);
      if (!rental) return;

      if (rental.status === 'waiting_number') {
        const { data } = await supabase.functions.invoke('sms-verification', {
          body: { action: 'getStatus', id: rentalId }
        });

        if (data?.status === 'success' && data.data?.number !== 'waiting') {
          setActiveRentals(prev => prev.map(r => 
            r.id === rentalId 
              ? { ...r, number: data.data.number, status: 'waiting_code' as const }
              : r
          ));
          toast({
            title: "Number Assigned",
            description: `Your number: ${data.data.number}`,
          });
        }
      } else {
        // Check for code
        const { data } = await supabase.functions.invoke('sms-verification', {
          body: { action: 'getCode', id: rentalId }
        });

        if (data?.status === 'success' && data.data?.code && data.data.code !== 'waiting') {
          setActiveRentals(prev => prev.map(r => 
            r.id === rentalId 
              ? { ...r, code: data.data.code, status: 'code_received' as const }
              : r
          ));
          fetchOrderHistory();
          toast({
            title: "Code Received!",
            description: `Your verification code is: ${data.data.code}`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking rental status:', error);
    }
  };

  const cancelRental = async (rentalId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sms-verification', {
        body: { action: 'cancelNumber', id: rentalId }
      });

      if (error) throw error;
      
      setActiveRentals(prev => prev.filter(r => r.id !== rentalId));
      refreshProfile?.();
      fetchOrderHistory();
      
      toast({
        title: "Rental Cancelled",
        description: data.refunded_amount_display 
          ? `${data.refunded_amount_display} has been refunded to your wallet`
          : "Number rental has been cancelled",
      });
    } catch (error: any) {
      console.error('Error cancelling rental:', error);
      toast({
        title: "Error",
        description: "Failed to cancel rental",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, refunded: boolean) => {
    if (refunded) return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">Refunded</Badge>;
    switch (status) {
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'waiting_code': return <Badge variant="secondary">Waiting for Code</Badge>;
      case 'waiting_number': return <Badge variant="secondary">Waiting for Number</Badge>;
      case 'cancelled': return <Badge variant="outline">Cancelled</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            SMS Verification (USA)
          </h1>
          <p className="text-muted-foreground">Get USA phone numbers for verification</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Wallet className="h-4 w-4 mr-1" />
          ₦{profile?.wallet_balance?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) || '0.00'}
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Verification code is sent only once. Make sure you're ready to use it immediately. 
          If no code is received before the timer expires, your payment will be automatically refunded.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="verify" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verify" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Verify
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Order History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verify" className="space-y-6">
          {/* Active Rentals */}
          {activeRentals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Active Rentals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeRentals.map((rental) => (
                  <div 
                    key={rental.id} 
                    className="p-4 border rounded-lg bg-muted/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{rental.service_name}</p>
                        <p className="text-sm text-muted-foreground">{rental.price_display}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={rental.status === 'code_received' ? 'default' : rental.time_remaining <= 60 ? 'destructive' : 'secondary'}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(rental.time_remaining)}
                        </Badge>
                        {rental.status !== 'code_received' && rental.status !== 'expired' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => cancelRental(rental.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Number */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Number:</span>
                      {rental.number === 'waiting' ? (
                        <Badge variant="outline">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Waiting...
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <code className="bg-background px-2 py-1 rounded text-sm font-mono">
                            {rental.number}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(rental.number, 'Number')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Code */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Code:</span>
                      {rental.code ? (
                        <div className="flex items-center gap-2">
                          <code className="bg-primary/10 text-primary px-3 py-1 rounded text-lg font-mono font-bold">
                            {rental.code}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(rental.code!, 'Code')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      ) : rental.status === 'expired' ? (
                        <Badge variant="destructive">Expired - Refunded</Badge>
                      ) : (
                        <Badge variant="outline">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Waiting for SMS...
                        </Badge>
                      )}
                    </div>

                    {rental.status !== 'code_received' && rental.status !== 'expired' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => checkRentalStatus(rental.id)}
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Status
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Available Services
              </CardTitle>
              <CardDescription>
                Select a service to get a USA phone number for verification
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-2">
                    {filteredServices.map((service) => (
                      <div 
                        key={service.service_id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Valid for {Math.floor(parseInt(service.validity_time) / 60)} min
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary">{service.price_display}</span>
                          <Button
                            size="sm"
                            onClick={() => purchaseNumber(service)}
                            disabled={purchasingService === service.service_id}
                          >
                            {purchasingService === service.service_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Get Number'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredServices.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No services found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Order History
              </CardTitle>
              <CardDescription>
                Your SMS verification order history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : orderHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No orders yet
                </p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {orderHistory.map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{order.service_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              ₦{order.charged_price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </p>
                            {getStatusBadge(order.status, order.refunded)}
                          </div>
                        </div>
                        
                        {order.phone_number && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Number:</span>
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {order.phone_number}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(order.phone_number!, 'Number')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        {order.verification_code && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Code:</span>
                            <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono font-bold">
                              {order.verification_code}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(order.verification_code!, 'Code')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
