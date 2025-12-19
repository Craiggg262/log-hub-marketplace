import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Shield, Zap, CheckCircle, Star, Users, Clock } from 'lucide-react';
import SocialIcon from '@/components/SocialIcon';
import { InstallPWA } from '@/components/InstallPWA';
import logoImage from '@/assets/logo.png';

const Index = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Facebook', icon: 'facebook' },
    { name: 'Instagram', icon: 'instagram' },
    { name: 'TikTok', icon: 'tiktok' },
    { name: 'Twitter', icon: 'twitter' },
    { name: 'VPN/Streaming', icon: 'vpn/streaming' }
  ];

  const handleCategoryClick = (category: string) => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            {/* Top stats card */}
            <div className="flex justify-end mb-8">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                    <p className="text-sm text-muted-foreground">Real-time</p>
                    <p className="text-2xl font-bold">15,248</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logo and Trust badge */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <img src={logoImage} alt="Log Hub Logo" className="h-20 w-20 object-contain rounded-xl" />
              <Badge variant="secondary" className="px-4 py-2 bg-card/50 backdrop-blur-sm border border-border/50">
                <Star className="h-4 w-4 text-primary mr-2" />
                Trusted by thousands of customers
              </Badge>
            </div>

            {/* Main heading */}
            <div className="text-center space-y-6 mb-12">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Your Trusted Marketplace for{' '}
                <span className="text-gradient">Social Media Accounts</span>
                {' '}& Instant Bill Payments
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Fast, secure, and reliable platform for verified social media accounts,
                electricity bills, data bundles, airtime, and cable TV subscriptions.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="gap-2 px-8 h-14 text-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
                onClick={() => navigate('/signup')}
              >
                Buy Accounts Now
                <ShoppingCart className="h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 px-8 h-14 text-lg font-semibold border-primary/50 hover:bg-primary/10"
                onClick={() => navigate('/login')}
              >
                Login to Dashboard
              </Button>
            </div>

            {/* Bottom info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Transaction card */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Latest Transaction</p>
                  <p className="font-semibold">Instagram Verified Account</p>
                  <p className="text-success flex items-center gap-1">
                    Completed <CheckCircle className="h-4 w-4" />
                  </p>
                </CardContent>
              </Card>

              {/* Trust indicators */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 flex items-center justify-around">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-sm">Secure Transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-sm">Instant Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-sm">24/7 Support</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Social Media Accounts Marketplace
          </h2>
          <p className="text-lg text-muted-foreground">
            Premium verified accounts across all major platforms. Secure, instant delivery guaranteed.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
          {categories.map((category) => (
            <Card 
              key={category.name}
              className="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm border-border/50"
              onClick={() => handleCategoryClick(category.name)}
            >
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <SocialIcon platform={category.name} size={24} />
                </div>
                <h3 className="font-semibold">{category.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Log Hub?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Skip the hassle of creating and managing new social media accounts. We make buying accounts 
            simple, secure, and convenient.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
                <ShoppingCart className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Wide Selection</h3>
              <p className="text-muted-foreground">
                Browse through various social media platforms and find the perfect account for your needs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Secure & Safe</h3>
              <p className="text-muted-foreground">
                All accounts are verified and tested before listing. Your transactions are protected
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Instant Access</h3>
              <p className="text-muted-foreground">
                Get immediate access to account details after purchase. Start using your accounts right away
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Install PWA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <h3 className="text-2xl font-bold">Download Our App</h3>
            <p className="text-muted-foreground">
              Get the Log Hub app for faster access and instant notifications
            </p>
            <InstallPWA />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logoImage} alt="Log Hub Logo" className="h-10 w-10 object-contain rounded-lg" />
            <span className="text-xl font-bold text-gradient">Log Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Log Hub Marketplace. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Support: <a href="mailto:info.loghubmarketplace@gmail.com" className="text-primary hover:underline">
              info.loghubmarketplace@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
