import React, { useState } from 'react';
import { CreditCard, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Props {
  variant?: 'desktop' | 'mobile-compact' | 'mobile-full';
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

  if (variant === 'mobile-compact') {
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
                <button onClick={() => copy(a.number, a.key)} className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  {copiedKey === a.key ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-primary" />}
                </button>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (variant === 'mobile-full') {
    return (
      <div className="space-y-3">
        {accounts.map((a, i) => (
          <React.Fragment key={a.key}>
            {i > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" /><span>OR</span><div className="flex-1 h-px bg-border" />
              </div>
            )}
            <div className="glass-button rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-primary">{a.label}</div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bank</span><span className="font-medium">{a.bank}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{a.name}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Account</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-lg">{a.number}</span>
                  <button onClick={() => copy(a.number, a.key)} className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                    {copiedKey === a.key ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-primary" />}
                  </button>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  // desktop
  return (
    <div className="mt-4 space-y-3">
      {accounts.map((a, i) => (
        <React.Fragment key={a.key}>
          {i > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /><span className="font-semibold">OR</span><div className="flex-1 h-px bg-border" />
            </div>
          )}
          <div className="p-3 bg-card/50 rounded-lg border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{a.label} Funding Account</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Bank:</span> <span className="font-medium">{a.bank}</span></p>
              <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{a.name}</span></p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Account:</span>
                <span className="font-mono font-bold text-primary">{a.number}</span>
                <Button onClick={() => copy(a.number, a.key)} variant="ghost" size="sm" className="h-6 px-2">
                  {copiedKey === a.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}
      <p className="text-xs text-muted-foreground">Transfer to any of these accounts to fund your wallet instantly</p>
    </div>
  );
};

export default FundingAccountsDisplay;
