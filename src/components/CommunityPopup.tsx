import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ExternalLink, Users, Rocket, MessageCircle } from 'lucide-react';

const STORAGE_KEY = 'community_popup_session';

export const CommunityPopup: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Show once per session per user (resets on each new login)
    const key = `${STORAGE_KEY}_${user.id}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(key, '1');
    }, 600);
    return () => clearTimeout(t);
  }, [user?.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-2">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Welcome to Log Hub Marketplace</DialogTitle>
          <DialogDescription className="text-center">
            Stay connected and unlock more from our community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <a
            href="https://chat.whatsapp.com/LltaVAyG0BvJp5t9gmlqz7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition"
          >
            <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium flex items-center gap-1">
                Join our Community <ExternalLink className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                Get updates, drops, and tips from other users.
              </p>
            </div>
          </a>

          <a
            href="https://boosterhub.name.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition"
          >
            <Rocket className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium flex items-center gap-1">
                Sign up on our Boosting site <ExternalLink className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">boosterhub.name.ng</p>
            </div>
          </a>

          <a
            href="https://t.me/bitinvest02"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition"
          >
            <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium flex items-center gap-1">
                For any complaints, message our Support <ExternalLink className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">We respond fast on WhatsApp.</p>
            </div>
          </a>
        </div>

        <Button onClick={() => setOpen(false)} className="w-full mt-2">
          Got it, thanks!
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityPopup;
