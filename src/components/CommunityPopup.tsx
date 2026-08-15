import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ExternalLink, Users, Gift, MessageCircle, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'community_popup_session';

const links = [
  {
    href: 'https://chat.whatsapp.com/K02gik0B7cT8vblUWIzMi8',
    icon: Users,
    label: 'Join our Community for updates & drops',
  },
  {
    href: 'https://craiggifts.site',
    icon: Gift,
    label: 'Send gifts to any country in the World',
  },
  {
    href: 'https://t.me/craiganalytics',
    icon: MessageCircle,
    label: 'Message our Support for any complaints',
  },
];

const tips = [
  'Delete and reinstall your WhatsApp before buying a WhatsApp number.',
  'Avoid using WhatsApp Business! They ban faster. We recommend using the normal WhatsApp instead.',
  "Match your Time Zone ⏰ and VPN 📶 to the country of the number you're purchasing. This will increase the chances of receiving verification codes.",
  'Enable 2FA immediately after verification codes.',
];

export const CommunityPopup: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
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
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-primary shrink-0 mt-1" />
            <div className="flex-1">
              <DialogTitle className="text-center text-xl leading-snug">
                Important Tips Before Buying Numbers
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="pt-1">
            Follow these guidelines to ensure successful verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-foreground">
          {tips.map((tip) => (
            <p key={tip}>{tip}</p>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Note:</span> Our support team will not attend to any issues
          regarding numbers being logged out.
        </div>

        <div className="space-y-2 pt-1">
          {links.map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg p-2 text-primary hover:bg-accent/50 transition"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ))}
        </div>

        <Button onClick={() => setOpen(false)} className="w-full mt-2">
          Got it, thanks!
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityPopup;
