import React, { useState } from 'react';
import { Copy, Check, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  provider: 'PaymentPoint' | 'Payscribe' | string;
  bank: string;
  name: string;
  number: string;
}

const formatNumber = (n: string) => n.replace(/(.{4})/g, '$1 ').trim();

const VirtualAccountCard: React.FC<Props> = ({ provider, bank, name, number }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(number);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Account number copied' });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-foreground"
      style={{
        background:
          'linear-gradient(135deg, hsl(220 30% 18%) 0%, hsl(220 35% 12%) 60%, hsl(25 40% 18%) 100%)',
        border: '1px solid hsl(220 20% 30% / 0.6)',
        boxShadow:
          '0 10px 30px hsl(0 0% 0% / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.08), inset 0 0 80px hsl(38 92% 50% / 0.06)',
      }}
    >
      {/* Shine */}
      <div className="pointer-events-none absolute -top-1/2 -right-1/3 w-2/3 h-[200%] rotate-12 opacity-20"
        style={{ background: 'radial-gradient(closest-side, hsl(38 92% 50% / 0.6), transparent)' }} />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Virtual Payment Method</p>
          <p className="text-xs text-muted-foreground mt-1">{provider} • {bank}</p>
        </div>
        <Wifi className="h-5 w-5 text-primary rotate-90 opacity-70" />
      </div>

      <div className="mt-6 relative">
        <p className="font-mono font-bold text-2xl md:text-3xl tracking-wider text-foreground">
          {formatNumber(number)}
        </p>
      </div>

      <div className="flex items-end justify-between mt-5 relative">
        <div>
          <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Account Name</p>
          <p className="text-sm font-semibold uppercase">{name}</p>
        </div>
        <button
          onClick={copy}
          className="glass-button rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold"
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-primary" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default VirtualAccountCard;
