import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Shield, Zap, Users } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const categories = [
    'FACEBOOK [BELOW 50 FRIENDS]',
    'FACEBOOK (STANDARD)',
    'INSTAGRAM',
    'TEXTING APPS',
    'TWITTER',
    'TIKTOK',
    'RARE SOCIAL'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Welcome to Log Hub Marketplace
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                The ultimate destination for premium social media accounts! We offer high-quality, 
                ready-to-use accounts tailored to your needs. Experience quick, secure transactions 
                and unmatched convenience. Start exploring now and find the perfect account for your goals.
              </p>
            </div>

            {/* Category Badges */}
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {categories.map((category, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  {category}
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
                <Users className="h-5 w-5" />
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
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Shop Social Media Accounts with Ease
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Skip the hassle of creating and managing new social media accounts. Our platform 
              offers a wide range of ready-made accounts for immediate use. Whether you need them 
              for business, personal use, or special projects, we make buying social media accounts 
              simple, secure, and convenient. Find the perfect account to fit your needs today!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center space-y-4 p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-8 w-8 text-primary" />
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
