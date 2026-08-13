import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Keeps crypto deposits in sync: whenever the user lands on a wallet screen
 * (or returns from a crypto checkout with ?crypto=success) we ask the backend to
 * re-check every pending invoice with the provider and credit the wallet.
 */
export function useCryptoReconcile(options: { poll?: boolean } = {}) {
  const { user, refreshProfile } = useAuth() as any;
  const { toast } = useToast();
  const running = useRef(false);

  const reconcile = useCallback(
    async (opts: { notify?: boolean } = {}) => {
      if (!user || running.current) return;
      running.current = true;
      try {
        const { data, error } = await supabase.functions.invoke('crypto-reconcile', {
          body: { user_id: user.id },
        });
        if (error) return;
        const credited = Number(data?.credited_naira ?? 0);
        if (credited > 0) {
          if (typeof refreshProfile === 'function') await refreshProfile();
          toast({
            title: 'Crypto deposit confirmed',
            description: `₦${credited.toLocaleString('en-NG')} has been added to your wallet.`,
          });
        } else if (opts.notify) {
          toast({
            title: 'Payment not confirmed yet',
            description: 'We are still waiting for the blockchain confirmation. Your wallet is credited automatically once it lands.',
          });
        }
      } finally {
        running.current = false;
      }
    },
    [user, refreshProfile, toast],
  );

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const returned = params.get('crypto') === 'success';

    reconcile({ notify: returned });

    if (!options.poll && !returned) return;
    // Poll briefly so a payment that confirms while the user waits is picked up
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      reconcile();
      if (ticks >= 20) clearInterval(id);
    }, 15000);
    return () => clearInterval(id);
  }, [user, reconcile, options.poll]);

  return { reconcile };
}

export default useCryptoReconcile;
