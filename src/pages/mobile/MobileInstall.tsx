import React, { useState, useEffect } from 'react';
import { Download, Share, Plus, Smartphone, CheckCircle, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import logoImage from '@/assets/logo.png';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MobileInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Use your browser menu",
        description: "Tap the menu (⋮ or Share) and select 'Add to Home Screen'",
      });
      return;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        toast({ title: "App Installed!", description: "Log Hub has been added to your home screen" });
      }
      setDeferredPrompt(null);
    } catch (error) {
      toast({ title: "Error", description: "Please try from your browser menu", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background silk-gradient flex flex-col">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-3xl mx-auto mb-6 overflow-hidden glass-card p-1">
            <img src={logoImage} alt="Log Hub" className="w-full h-full rounded-2xl object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Log Hub</h1>
          <p className="text-muted-foreground">Your Premium Marketplace</p>
        </div>

        {isInstalled ? (
          <div className="glass-card rounded-3xl p-8 text-center max-w-sm w-full">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Already Installed!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Log Hub is on your home screen. Open it from there for the best experience.
            </p>
            <Button 
              onClick={() => window.location.href = '/app'}
              className="w-full gradient-primary text-primary-foreground rounded-xl h-12"
            >
              Open App
            </Button>
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 max-w-sm w-full space-y-6">
            <div className="text-center">
              <Smartphone className="h-12 w-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">Install Log Hub</h2>
              <p className="text-sm text-muted-foreground">
                Get the full app experience — fast, offline-ready, and always accessible
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {[
                'Works offline & loads instantly',
                'Home screen icon like a native app',
                'Push notifications for orders',
                'No app store needed',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 glass-button rounded-xl p-3">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Install Button */}
            {deferredPrompt ? (
              <Button 
                onClick={handleInstall}
                className="w-full gradient-primary text-primary-foreground rounded-xl h-14 text-base gap-2"
              >
                <Download className="h-5 w-5" />
                Install Now
              </Button>
            ) : isIOS ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center">How to install on iPhone:</p>
                <div className="space-y-2">
                  <div className="glass-button rounded-xl p-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">1</div>
                    <span className="text-sm">Tap the <Share className="inline h-4 w-4" /> Share button</span>
                  </div>
                  <div className="glass-button rounded-xl p-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">2</div>
                    <span className="text-sm">Scroll down and tap <Plus className="inline h-4 w-4" /> Add to Home Screen</span>
                  </div>
                  <div className="glass-button rounded-xl p-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">3</div>
                    <span className="text-sm">Tap "Add" to confirm</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button 
                  onClick={handleInstall}
                  className="w-full gradient-primary text-primary-foreground rounded-xl h-14 text-base gap-2"
                >
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Or tap ⋮ in your browser menu → "Install App"
                </p>
              </div>
            )}

            {/* Skip Link */}
            <button 
              onClick={() => window.location.href = '/app'}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Continue in browser →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInstall;
