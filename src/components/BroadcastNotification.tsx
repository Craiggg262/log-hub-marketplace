import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Broadcast {
  id: string;
  title: string;
  message: string;
}

const BroadcastNotification: React.FC = () => {
  const { user } = useAuth();
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: bcs } = await supabase
        .from('broadcast_notifications')
        .select('id, title, message')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!bcs || bcs.length === 0 || cancelled) return;

      const { data: views } = await supabase
        .from('broadcast_views')
        .select('broadcast_id')
        .eq('user_id', user.id);
      const seen = new Set((views || []).map((v: any) => v.broadcast_id));
      const next = bcs.find((b: any) => !seen.has(b.id));
      if (next && !cancelled) setBroadcast(next as Broadcast);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleClose = async () => {
    if (broadcast && user) {
      await supabase.from('broadcast_views').insert({
        broadcast_id: broadcast.id,
        user_id: user.id,
      });
    }
    setBroadcast(null);
  };

  if (!broadcast) return null;

  return (
    <Dialog open={!!broadcast} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/15 mx-auto mb-3">
            <Megaphone className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center">{broadcast.title}</DialogTitle>
          <DialogDescription className="text-center whitespace-pre-wrap text-foreground/80">
            {broadcast.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full gradient-primary text-primary-foreground">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastNotification;
