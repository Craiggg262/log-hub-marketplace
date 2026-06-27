import React, { useState } from 'react';
import { CreditCard, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import VirtualAccountCard from '@/components/VirtualAccountCard';

interface Props {
  variant?: 'desktop' | 'mobile-compact' | 'mobile-full' | 'cards';
}

const FundingAccountsDisplay: React.FC<Props> = ({ variant = 'desktop' }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const p: any = profile || {};
  const accounts = [
    p.virtual_account_number && {
      key: 'pp',
      label: 'PaymentPoint',
      bank: p.virtual_account_bank,
      name: p.virtual_account_name,
      number: p.virtual_account_number,
    },
    p.payscribe_account_number && {
      key: 'ps',
      label: 'Payscribe',
      bank: p.payscribe_account_bank,
      name: p.payscribe_account_name,
      number: p.payscribe_account_number,
    },
  ].filter(Boolean) as Array<{ key: string; label: string; bank: string; name: string; number: string }>;

  if (accounts.length === 0) return null;

  const copy = (n: string, key: string) => {
    navigator.clipboard.writeText(n);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: 'Account number copied' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Credit-card style (used by Wallet pages, Dashboard, MobileHome)
  if (variant === 'cards' || variant === 'desktop' || variant === 'mobile-full') {
    return (
      <div className={variant === 'desktop' ? 'mt-4 space-y-3' : 'space-y-3'}>
        {accounts.map((a, i) => (
          <React.Fragment key={a.key}>
            {i > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span className="font-semibold">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            <VirtualAccountCard
              provider={a.label}
              bank={a.bank || ''}
              name={a.name || ''}
              number={a.number}
            />
          </React.Fragment>
        ))}
        <p className="text-xs text-muted-foreground text-center">
          Transfer to any of these accounts to fund your wallet instantly
        </p>
      </div>
    );
  }

  // mobile-compact (small inline)
  return (
    <div className="space-y-2 mt-3">
      {accounts.map((a, i) => (
        <React.Fragment key={a.key}>
          {i > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <div className="flex-1 h-px bg-border" /><span>OR</span><div className="flex-1 h-px bg-border" />
            </div>
          )}
          <div className="glass-button rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">{a.label} • {a.bank}</p>
                  <p className="text-sm font-mono font-bold">{a.number}</p>
                </div>
              </div>
              <button
                onClick={() => copy(a.number, a.key)}
                className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                {copiedKey === a.key ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-primary" />}
              </button>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FundingAccountsDisplay;
