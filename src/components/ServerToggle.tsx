import React from 'react';
import { useServerSelection, ServerType } from '@/hooks/useServerSelection';
import { Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ServerToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { server, setServer } = useServerSelection();

  const servers: { key: ServerType; label: string; icon: React.ElementType; desc: string }[] = [
    { key: 'king', label: 'King Server', icon: Crown, desc: 'Premium logs' },
    { key: 'lite', label: 'Lite Server', icon: Zap, desc: 'Budget logs' },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {servers.map((s) => (
        <button
          key={s.key}
          onClick={() => setServer(s.key)}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
            server === s.key
              ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
              : "border-border/50 bg-card/50 hover:border-primary/30"
          )}
        >
          {server === s.key && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            server === s.key ? "gradient-primary" : "bg-muted"
          )}>
            <s.icon className={cn(
              "h-6 w-6",
              server === s.key ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          </div>
          <div className="text-center">
            <p className={cn(
              "text-sm font-bold",
              server === s.key ? "text-primary" : "text-foreground"
            )}>{s.label}</p>
            <p className="text-[10px] text-muted-foreground">{s.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ServerToggle;
