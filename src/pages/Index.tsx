import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingCart, Shield, Zap, CheckCircle, Star, Mail, Phone, Receipt,
  Headphones, Lock, ArrowRight,
} from 'lucide-react';
import { InstallPWA } from '@/components/InstallPWA';
import logoImage from '@/assets/logo.png';

const Index = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: ShoppingCart, name: 'Social Accounts',
      desc: 'Verified Facebook, Instagram, TikTok, Twitter & more, ready to use.',
      stock: 'In Stock', color: 'text-primary', bg: 'bg-primary/10',
    },
    {
      icon: Mail, name: 'Email Rentals',
      desc: 'Aged and verified email accounts for any project, short or long term.',
      stock: 'In Stock', color: 'text-accent', bg: 'bg-accent/10',
    },
    {
      icon: Phone, name: 'Number Rentals',
      desc: 'USA & international numbers for secure SMS verifications.',
      stock: 'In Stock', color: 'text-green-500', bg: 'bg-green-500/10',
    },
    {
      icon: Receipt, name: 'VTU & Bill Payments',
      desc: 'Instant data, airtime, electricity and cable TV top-ups.',
      stock: 'Live', color: 'text-purple-500', bg: 'bg-purple-500/10',
    },
  ];

  const trustBadges = [
    { icon: CheckCircle, label: '100% Verified Logins' },
    { icon: Zap, label: 'Instant Auto-Delivery' },
    { icon: Lock, label: 'Escrow Protection' },
    { icon: Headphones, label: 'Live Help Desk' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="max-w-5xl mx-auto">
            {/* Brand */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <img src={logoImage} alt="Log Hub Marketplace" className="h-16 w-16 object-contain rounded-xl" />
              <Badge variant="secondary" className="px-4 py-2 glass-card border-border/50">
                <Star className="h-4 w-4 text-primary mr-2" /> Trusted by thousands of customers
              </Badge>
            </div>

            <div className="text-center space-y-5 mb-10">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Buy Verified <span className="text-gradient">Accounts & Logins</span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Purchase direct access to our strictly vetted inventory of social profiles,
                virtual numbers, and premium services. Digital solutions for every market.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-10">
              <Button
                size="lg"
                className="gap-2 px-8 h-14 text-lg font-semibold gradient-primary text-primary-foreground hover:opacity-90 glow-primary"
                onClick={() => navigate('/signup')}
              >
                Browse Accounts <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 h-14 text-lg font-semibold border-primary/50 hover:bg-primary/10"
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {trustBadges.map((b) => (
                <div key={b.label} className="glass-card rounded-xl p-3 flex items-center gap-2 text-xs md:text-sm">
                  <b.icon className="h-4 w-4 text-success shrink-0" />
                  <span className="font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Digital Solutions for Every Market</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One marketplace for accounts, numbers, and bills. Fast, vetted, and instant.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {services.map((s) => (
            <Card
              key={s.name}
              className="glass-card silk-shimmer border-0 cursor-pointer hover:scale-[1.02] transition-all"
              onClick={() => navigate('/signup')}
            >
              <CardContent className="p-5 space-y-4">
                <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <Badge className="bg-success/20 text-success border-success/30">{s.stock}</Badge>
                  <span className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                    Buy Now <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="glass-card silk-shimmer border-0 max-w-4xl mx-auto">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <Shield className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-2xl md:text-4xl font-bold">Ready To Purchase Premium Logs?</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop dealing with bans and unreliable vendors. Buy verified credentials from Log Hub Marketplace and scale instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gradient-primary text-primary-foreground gap-2" onClick={() => navigate('/signup')}>
                Register Free Account <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary/50" onClick={() => navigate('/login')}>
                Browse All Logins
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* PWA install */}
      <section className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto glass-card border-0">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Download Our App</h3>
            <p className="text-muted-foreground text-sm">
              Get the Log Hub app for faster access and instant notifications.
            </p>
            <InstallPWA />
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border/50 py-8 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <img src={logoImage} alt="Log Hub" className="h-10 w-10 object-contain rounded-lg" />
            <span className="text-xl font-bold text-gradient">Log Hub Marketplace</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 Log Hub Marketplace. All rights reserved.</p>
          <p className="text-sm text-muted-foreground">
            Support:{' '}
            <a href="https://t.me/loghubmarketplace1" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              t.me/loghubmarketplace1
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
