import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, DollarSign, Users, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Log {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  walletBalance: number;
  joinedDate: string;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [newLog, setNewLog] = useState({
    title: '',
    description: '',
    price: '',
    category: 'streaming'
  });
  const [fundUser, setFundUser] = useState({ email: '', amount: '' });
  const { toast } = useToast();

  // Admin credentials (in production, this should be handled securely)
  const ADMIN_CREDENTIALS = {
    username: 'loghub_admin',
    password: 'LogHub2024!Admin'
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

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.title || !newLog.description || !newLog.price) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would save to the database
    toast({
      title: "Log added successfully",
      description: `${newLog.title} has been added to the marketplace`,
    });
    
    setNewLog({ title: '', description: '', price: '', category: 'streaming' });
  };

  const handleFundUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundUser.email || !fundUser.amount) {
      toast({
        title: "Missing fields",
        description: "Please provide email and amount",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would update the user's wallet in the database
    toast({
      title: "User funded successfully",
      description: `$${fundUser.amount} has been added to ${fundUser.email}'s wallet`,
    });
    
    setFundUser({ email: '', amount: '' });
  };

  // Mock data for demo
  const mockLogs: Log[] = [
    { id: '1', title: 'Premium Netflix Logs', description: 'High-quality Netflix logs', price: 15.99, category: 'streaming', inStock: true },
    { id: '2', title: 'Spotify Premium Logs', description: 'Fresh Spotify premium access', price: 8.99, category: 'streaming', inStock: true },
    { id: '3', title: 'PayPal Logs', description: 'Verified PayPal account logs', price: 25.99, category: 'finance', inStock: false },
  ];

  const mockUsers: User[] = [
    { id: '1', email: 'john@example.com', fullName: 'John Doe', walletBalance: 34.01, joinedDate: '2024-01-15' },
    { id: '2', email: 'jane@example.com', fullName: 'Jane Smith', walletBalance: 15.50, joinedDate: '2024-01-12' },
    { id: '3', email: 'bob@example.com', fullName: 'Bob Johnson', walletBalance: 0.00, joinedDate: '2024-01-10' },
  ];

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
    <div className="space-y-6">
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
                <p className="text-2xl font-bold">{mockUsers.length}</p>
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
                <p className="text-2xl font-bold">{mockLogs.filter(log => log.inStock).length}</p>
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
                <p className="text-2xl font-bold">$1,247</p>
              </div>
              <DollarSign className="h-10 w-10 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">23</p>
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
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newLog.price}
                      onChange={(e) => setNewLog({...newLog, price: e.target.value})}
                      placeholder="15.99"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newLog.category} onValueChange={(value) => setNewLog({...newLog, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="streaming">Streaming</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                {mockLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{log.title}</h4>
                        <Badge variant={log.inStock ? "default" : "secondary"}>
                          {log.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {log.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">${log.price}</p>
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
                <DollarSign className="h-5 w-5" />
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
                    <Label htmlFor="fundAmount">Amount (USD)</Label>
                    <Input
                      id="fundAmount"
                      type="number"
                      value={fundUser.amount}
                      onChange={(e) => setFundUser({...fundUser, amount: e.target.value})}
                      placeholder="50.00"
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
                {mockUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.fullName}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.joinedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${user.walletBalance.toFixed(2)}</p>
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
  );
};

export default Admin;