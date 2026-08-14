import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff, Banknote, Bitcoin, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/lib/currency';
import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import { cn } from '@/lib/utils';

interface Props {
  /** mobile routes vs desktop routes */
  mobile?: boolean;
  className?: string;
}

/**
 * Balance header used on both the desktop dashboard and the mobile home.
 * Balance + hide toggle + inline currency picker, then Fund Naira / Fund Crypto / History.
 */
export const BalanceHeaderCard: React.FC<Props> = ({ mobile = false, className }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { formatPrice } = useCurrency();
  const [hidden, setHidden] = useState(false);

  const fundPath = mobile ? '/app/wallet/fund' : '/fund-wallet';
  const historyPath = mobile ? '/app/history' : '/history';

  const actions = [
    {
      label: 'Fund Naira',
      icon: Banknote,
      onClick: () => navigate(fundPath),
      tint: 'bg-primary/15 text-primary',
    },
    {
      label: 'Fund Crypto',
      icon: Bitcoin,
      onClick: () => navigate(`${fundPath}#crypto`),
      tint: 'bg-orange-500/15 text-orange-500',
    },
    {
      label: 'History',
      icon: History,
      onClick: () => navigate(historyPath),
      tint: 'bg-accent/15 text-accent',
    },
  ];

  return (
    <div className={cn('glass-card silk-shimmer rounded-3xl p-5 md:p-6', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-10 w-10 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Available Balance
              </p>
              <div className="flex items-center gap-2">
                <p className="text-2xl md:text-3xl font-bold truncate">
                  {hidden ? '••••••' : formatPrice(profile?.wallet_balance || 0)}
                </p>
                <button
                  type="button"
                  aria-label={hidden ? 'Show balance' : 'Hide balance'}
                  onClick={() => setHidden((h) => !h)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <CurrencySwitcher inline />
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="glass-button rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center transition-transform active:scale-95"
          >
            <span className={cn('h-9 w-9 rounded-xl flex items-center justify-center', a.tint)}>
              <a.icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-[11px] md:text-xs font-semibold leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BalanceHeaderCard;
