import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Users, Edit, Trash2, TrendingUp, Database, Eye, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  wallet_balance: number;
  created_at: string;
}

interface LogData {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  in_stock: boolean;
  categories: {
    name: string;
  } | null;
}

interface LogItem {
  id: string;
  log_id: string;
  account_details: string;
  is_available: boolean;
  created_at: string;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<LogData[]>([]);
  const [logItems, setLogItems] = useState<Record<string, LogItem[]>>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogs: 0,
    totalRevenue: 0,
    totalOrders: 0
  });
  const [newLog, setNewLog] = useState({
    title: '',
    description: '',
    price: '',
    category_id: ''
  });
  const [editingLog, setEditingLog] = useState<LogData | null>(null);
  const [fundUser, setFundUser] = useState({ userId: '', amount: '' });
  const [newLogItem, setNewLogItem] = useState({ log_id: '', account_details: '' });
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedLogForItems, setSelectedLogForItems] = useState<string | null>(null);
  const { toast } = useToast();

  // Check authentication and admin status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleData) {
        setIsAuthenticated(true);
        setIsAdmin(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Check current auth session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Admin session:', session);
      console.log('Current user:', session?.user?.id);

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Profiles data:', profilesData);
      console.log('Profiles error:', profilesError);

      setProfiles(profilesData || []);

      // Fetch logs
      const { data: logsData } = await supabase
        .from('logs')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('created_at', { ascending: false });

      setLogs(logsData || []);

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*');

      setCategories(categoriesData || []);

      // Fetch all log items
      const { data: logItemsData } = await supabase
        .from('log_items')
        .select('*')
        .order('created_at', { ascending: false });

      // Group log items by log_id
      const groupedLogItems: Record<string, LogItem[]> = {};
      logItemsData?.forEach(item => {
        if (!groupedLogItems[item.log_id]) {
          groupedLogItems[item.log_id] = [];
        }
        groupedLogItems[item.log_id].push(item);
      });
      setLogItems(groupedLogItems);

      // Calculate stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, status');

      const completedOrders = ordersData?.filter(order => order.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);

      setStats({
        totalUsers: profilesData?.length || 0,
        totalLogs: logsData?.length || 0,
        totalRevenue,
        totalOrders: ordersData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          title: "Access denied",
          description: "You do not have admin privileges",
          variant: "destructive",
        });
        return;
      }

      setIsAuthenticated(true);
      setIsAdmin(true);
      toast({
        title: "Admin login successful",
        description: "Welcome to the admin panel",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsAdmin(false);
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    });
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.title || !newLog.description || !newLog.price || !newLog.category_id) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('logs')
        .insert({
          title: newLog.title,
          description: newLog.description,
          price: parseFloat(newLog.price),
          stock: 0, // Always 0 since we use log_items now
          category_id: newLog.category_id,
          in_stock: false, // Will be true when log_items are added
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(newLog.title)}&background=3b82f6&color=fff`
        });

      if (error) throw error;

      toast({
        title: "Log added successfully",
        description: `${newLog.title} has been added to the marketplace`,
      });
      
      setNewLog({ title: '', description: '', price: '', category_id: '' });
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add log",
        variant: "destructive",
      });
    }
  };

  const handleEditLog = async (log: LogData) => {
    if (!editingLog) return;

    try {
      const { error } = await supabase
        .from('logs')
        .update({
          title: editingLog.title,
          description: editingLog.description,
          price: editingLog.price,
        })
        .eq('id', log.id);

      if (error) throw error;

      toast({
        title: "Log updated successfully",
        description: "Log details have been updated",
      });
      
      setEditingLog(null);
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update log",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log? All associated sub-accounts will also be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: "Log deleted successfully",
        description: "Log and all associated data have been removed",
      });
      
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete log",
        variant: "destructive",
      });
    }
  };

  const handleAddLogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogItem.log_id || !newLogItem.account_details) {
      toast({
        title: "Missing fields",
        description: "Please select a log and enter account details",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('log_items')
        .insert({
          log_id: newLogItem.log_id,
          account_details: newLogItem.account_details,
          is_available: true
        });

      if (error) throw error;

      // Update the log to be in stock if it wasn't already
      await supabase
        .from('logs')
        .update({ in_stock: true })
        .eq('id', newLogItem.log_id);

      toast({
        title: "Sub-account added successfully",
        description: "New account details have been added to the log",
      });
      
      setNewLogItem({ log_id: '', account_details: '' });
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add sub-account",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLogItem = async (itemId: string, logId: string) => {
    if (!confirm('Are you sure you want to delete this sub-account?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('log_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Check if this was the last item for the log
      const remainingItems = logItems[logId]?.filter(item => item.id !== itemId && item.is_available) || [];
      if (remainingItems.length === 0) {
        await supabase
          .from('logs')
          .update({ in_stock: false })
          .eq('id', logId);
      }

      toast({
        title: "Sub-account deleted successfully",
        description: "Account details have been removed",
      });
      
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sub-account",
        variant: "destructive",
      });
    }
  };

  const handleFundUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundUser.userId || !fundUser.amount) {
      toast({
        title: "Missing fields",
        description: "Please provide user email and amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const userEmail = fundUser.userId.trim().toLowerCase();
      
      // Find user by email
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (findError) {
        console.error('Error finding user:', findError);
        toast({
          title: "Database error",
          description: "Error searching for user. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
        toast({
          title: "User not found",
          description: `No user found with email: ${userEmail}`,
          variant: "destructive",
        });
        return;
      }

      const amount = parseFloat(fundUser.amount);

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          wallet_balance: profile.wallet_balance + amount
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating balance:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: profile.user_id,
          amount,
          transaction_type: 'deposit',
          description: `Admin funding - ₦${amount.toLocaleString('en-NG')}`
        });

      if (transactionError) throw transactionError;

      toast({
        title: "User funded successfully",
        description: `₦${amount.toLocaleString('en-NG')} has been added to ${profile.email}'s wallet`,
      });
      
      setFundUser({ userId: '', amount: '' });
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fund user wallet",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const getAvailableLogItemsCount = (logId: string) => {
    return logItems[logId]?.filter(item => item.is_available).length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Access the Log Hub admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="admin@loghub.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Login to Admin Panel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage logs, users, and system settings</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.totalLogs}</p>
                </div>
                <Database className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <Shield className="h-10 w-10 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="logs">Manage Logs</TabsTrigger>
            <TabsTrigger value="sub-accounts">Sub-Accounts</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            {/* Add/Edit New Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingLog ? 'Edit Log' : 'Add New Log'}
                </CardTitle>
                <CardDescription>
                  {editingLog ? 'Update log details' : 'Add a new log to the marketplace'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingLog ? (e) => { e.preventDefault(); handleEditLog(editingLog); } : handleAddLog} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Log Title</Label>
                      <Input
                        id="title"
                        value={editingLog ? editingLog.title : newLog.title}
                        onChange={(e) => editingLog ? 
                          setEditingLog({...editingLog, title: e.target.value}) :
                          setNewLog({...newLog, title: e.target.value})
                        }
                        placeholder="e.g., Premium Netflix Logs"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={editingLog ? editingLog.price : newLog.price}
                        onChange={(e) => editingLog ? 
                          setEditingLog({...editingLog, price: parseFloat(e.target.value) || 0}) :
                          setNewLog({...newLog, price: e.target.value})
                        }
                        placeholder="5000"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {!editingLog && (
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={newLog.category_id} onValueChange={(value) => setNewLog({...newLog, category_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editingLog ? editingLog.description : newLog.description}
                      onChange={(e) => editingLog ? 
                        setEditingLog({...editingLog, description: e.target.value}) :
                        setNewLog({...newLog, description: e.target.value})
                      }
                      placeholder="Describe the log product..."
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingLog ? 'Update Log' : 'Add Log to Marketplace'}
                    </Button>
                    {editingLog && (
                      <Button type="button" variant="outline" onClick={() => setEditingLog(null)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Current Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Current Logs</CardTitle>
                <CardDescription>Manage existing logs in the marketplace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{log.title}</h4>
                          <Badge variant={getAvailableLogItemsCount(log.id) > 0 ? "default" : "secondary"}>
                            {getAvailableLogItemsCount(log.id)} Available
                          </Badge>
                          {log.categories && (
                            <Badge variant="outline" className="capitalize">
                              {log.categories.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{log.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatPrice(log.price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingLog(log)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedLogForItems(log.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sub-accounts" className="space-y-6">
            {/* Add Sub-Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Add Sub-Account
                </CardTitle>
                <CardDescription>
                  Add account details to existing logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLogItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logSelect">Select Log</Label>
                    <Select value={newLogItem.log_id} onValueChange={(value) => setNewLogItem({...newLogItem, log_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a log to add accounts to" />
                      </SelectTrigger>
                      <SelectContent>
                        {logs.map((log) => (
                          <SelectItem key={log.id} value={log.id}>
                            {log.title} - {formatPrice(log.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountDetails">Account Details</Label>
                    <Textarea
                      id="accountDetails"
                      value={newLogItem.account_details}
                      onChange={(e) => setNewLogItem({...newLogItem, account_details: e.target.value})}
                      placeholder="Username: example@email.com&#10;Password: password123&#10;Additional info: Premium account, expires 2024-12-31"
                      required
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Add Sub-Account
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sub-Accounts List */}
            <Card>
              <CardHeader>
                <CardTitle>Sub-Accounts by Log</CardTitle>
                <CardDescription>Manage account details for each log</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{log.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getAvailableLogItemsCount(log.id)} available accounts
                          </p>
                        </div>
                        <Badge variant={getAvailableLogItemsCount(log.id) > 0 ? "default" : "secondary"}>
                          {formatPrice(log.price)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {logItems[log.id]?.length > 0 ? (
                          logItems[log.id].map((item) => (
                            <div key={item.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-md">
                              <div className="flex-1">
                                <pre className="text-xs whitespace-pre-wrap">{item.account_details}</pre>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Added: {new Date(item.created_at).toLocaleDateString()}
                                  {!item.is_available && <span className="text-destructive"> • Sold</span>}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteLogItem(item.id, log.id)}
                                className="text-destructive hover:text-destructive ml-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No sub-accounts added yet
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Fund User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Fund User Wallet
                </CardTitle>
                <CardDescription>
                  Add funds to a user's wallet using their email address (shown in the Users list below)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFundUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId">User Email</Label>
                      <Input
                        id="userId"
                        type="email"
                        value={fundUser.userId}
                        onChange={(e) => setFundUser({...fundUser, userId: e.target.value})}
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fundAmount">Amount (₦)</Label>
                      <Input
                        id="fundAmount"
                        type="number"
                        value={fundUser.amount}
                        onChange={(e) => setFundUser({...fundUser, amount: e.target.value})}
                        placeholder="10000"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Fund User Wallet
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{profile.full_name || 'Unnamed User'}</h4>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded inline-block my-1">
                          UID: {profile.user_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatPrice(profile.wallet_balance)}</p>
                        <p className="text-xs text-muted-foreground">Wallet Balance</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">System Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Database:</span>
                        <span className="ml-2 text-green-600">Connected</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Admin Panel:</span>
                        <span className="ml-2 text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Quick Actions</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={fetchData}>
                        Refresh Data
                      </Button>
                      <Button variant="outline" size="sm">
                        Export Reports
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Log Items Dialog */}
        <Dialog open={!!selectedLogForItems} onOpenChange={() => setSelectedLogForItems(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Sub-Accounts for {logs.find(l => l.id === selectedLogForItems)?.title}
              </DialogTitle>
              <DialogDescription>
                View and manage account details for this log
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3">
                {selectedLogForItems && logItems[selectedLogForItems]?.length > 0 ? (
                  logItems[selectedLogForItems].map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <pre className="text-sm whitespace-pre-wrap">{item.account_details}</pre>
                        <p className="text-xs text-muted-foreground mt-1">
                          Added: {new Date(item.created_at).toLocaleDateString()}
                          {!item.is_available && <span className="text-destructive"> • Sold</span>}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedLogForItems && handleDeleteLogItem(item.id, selectedLogForItems)}
                        className="text-destructive hover:text-destructive ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No sub-accounts added yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;