import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Shield, Zap, CheckCircle, MessageCircle } from 'lucide-react';
import SocialIcon from '@/components/SocialIcon';
import logoImage from '@/assets/logo.png';
import heroImage from '@/assets/hero-shopping.jpg';

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <img src={logoImage} alt="Log Hub Logo" className="h-16 w-16 object-contain rounded-lg" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Log Hub
              </h1>
              <p className="text-sm text-muted-foreground">Marketplace</p>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Your Trusted Social Media Account Marketplace
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted marketplace for premium social media accounts. 
            Browse, purchase, and instantly access verified accounts across all major platforms.
          </p>

          {/* Hero Image */}
          <div className="my-12">
            <img 
              src={heroImage} 
              alt="Social Media Marketplace" 
              className="w-full max-w-3xl mx-auto rounded-2xl shadow-2xl"
            />
          </div>

          {/* Category Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Badge
                key={category.name}
                variant="secondary"
                className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleCategoryClick(category.name)}
              >
                <SocialIcon platform={category.name} size={16} className="mr-2" />
                {category.name}
              </Badge>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="gap-2 px-8"
              onClick={() => navigate('/signup')}
            >
              <CheckCircle className="h-5 w-5" />
              Register
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 px-8"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              size="lg" 
              variant="default"
              className="gap-2 px-8 bg-green-600 hover:bg-green-700"
              onClick={() => window.open('https://chat.whatsapp.com/LltaVAyG0BvJp5t9gmlqz7?mode=ems_copy_h_t', '_blank')}
            >
              <MessageCircle className="h-5 w-5" />
              Join WhatsApp Group
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Log Hub?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Skip the hassle of creating and managing new social media accounts. We make buying accounts 
            simple, secure, and convenient.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 p-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Wide Selection</h3>
            <p className="text-muted-foreground">
              Browse through various social media platforms and find the perfect account for your needs
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Secure & Safe</h3>
            <p className="text-muted-foreground">
              All accounts are verified and tested before listing. Your transactions are protected
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Instant Access</h3>
            <p className="text-muted-foreground">
              Get immediate access to account details after purchase. Start using your accounts right away
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-4">
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
