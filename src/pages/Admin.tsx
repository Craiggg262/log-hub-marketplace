import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Users, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<LogData[]>([]);
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
    stock: '',
    category_id: ''
  });
  const [fundUser, setFundUser] = useState({ email: '', amount: '' });
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  // Admin credentials
  const ADMIN_CREDENTIALS = {
    username: 'loghub_admin',
    password: 'LogHub2024!Admin'
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

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

      // Calculate stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, status');

      const completedOrders = ordersData?.filter(order => order.status === 'completed') || [];
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total_amount, 0);

      setStats({
        totalUsers: profilesData?.length || 0,
        totalLogs: logsData?.filter(log => log.in_stock).length || 0,
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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === ADMIN_CREDENTIALS.username && 
        loginData.password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      toast({
        title: "Admin login successful",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Login failed",
        description: "Invalid admin credentials",
        variant: "destructive",
      });
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.title || !newLog.description || !newLog.price || !newLog.stock || !newLog.category_id) {
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
          stock: parseInt(newLog.stock),
          category_id: newLog.category_id,
          in_stock: true,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(newLog.title)}&background=3b82f6&color=fff`
        });

      if (error) throw error;

      toast({
        title: "Log added successfully",
        description: `${newLog.title} has been added to the marketplace`,
      });
      
      setNewLog({ title: '', description: '', price: '', stock: '', category_id: '' });
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add log",
        variant: "destructive",
      });
    }
  };

  const handleFundUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundUser.email || !fundUser.amount) {
      toast({
        title: "Missing fields",
        description: "Please provide email and amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find user by email
      const { data: profile, error: findError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', fundUser.email)
        .single();

      if (findError || !profile) {
        toast({
          title: "User not found",
          description: "No user found with that email",
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

      if (updateError) throw updateError;

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
        description: `₦${amount.toLocaleString('en-NG')} has been added to ${fundUser.email}'s wallet`,
      });
      
      setFundUser({ email: '', amount: '' });
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

  if (!isAuthenticated) {
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
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

            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Admin Credentials:</p>
              <p>Username: <code>loghub_admin</code></p>
              <p>Password: <code>LogHub2024!Admin</code></p>
            </div>
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
            onClick={() => setIsAuthenticated(false)}
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
                  <p className="text-sm text-muted-foreground">Available Logs</p>
                  <p className="text-2xl font-bold">{stats.totalLogs}</p>
                </div>
                <Plus className="h-10 w-10 text-muted-foreground/20" />
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Manage Logs</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            {/* Add New Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Log
                </CardTitle>
                <CardDescription>
                  Add a new log to the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLog} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Log Title</Label>
                      <Input
                        id="title"
                        value={newLog.title}
                        onChange={(e) => setNewLog({...newLog, title: e.target.value})}
                        placeholder="e.g., Premium Netflix Logs"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₦)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newLog.price}
                        onChange={(e) => setNewLog({...newLog, price: e.target.value})}
                        placeholder="5000"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newLog.stock}
                        onChange={(e) => setNewLog({...newLog, stock: e.target.value})}
                        placeholder="100"
                        min="0"
                        required
                      />
                    </div>

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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newLog.description}
                      onChange={(e) => setNewLog({...newLog, description: e.target.value})}
                      placeholder="Describe the log product..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Add Log to Marketplace
                  </Button>
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
                          <Badge variant={log.in_stock ? "default" : "secondary"}>
                            {log.in_stock ? `${log.stock} In Stock` : "Out of Stock"}
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
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
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

          <TabsContent value="users" className="space-y-6">
            {/* Fund User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Fund User Wallet
                </CardTitle>
                <CardDescription>
                  Add funds to a user's wallet using their email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFundUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">User Email</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={fundUser.email}
                        onChange={(e) => setFundUser({...fundUser, email: e.target.value})}
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
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">System settings panel coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;