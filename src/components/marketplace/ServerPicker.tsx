import React from 'react';
import { Crown, Zap, ChevronRight } from 'lucide-react';
import { useServerSelection } from '@/hooks/useServerSelection';

interface Props {
  onPicked?: (server: 'king' | 'lite') => void;
}

const ServerPicker: React.FC<Props> = ({ onPicked }) => {
  const { setServer } = useServerSelection();

  const choose = (s: 'king' | 'lite') => {
    setServer(s);
    onPicked?.(s);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Browse the Marketplace</h1>
        <p className="text-sm text-muted-foreground">Pick a server to view its verified inventory</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => choose('king')}
          className="glass-card silk-shimmer rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover:border-primary/50 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
              <Crown className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">King Server</h3>
              <p className="text-xs text-muted-foreground mt-1">Premium curated logs, tutorials and tools</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </button>

        <button
          onClick={() => choose('lite')}
          className="glass-card silk-shimmer rounded-2xl p-6 text-left transition-all hover:scale-[1.02] hover:border-accent/50 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Zap className="h-7 w-7 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Lite Server</h3>
              <p className="text-xs text-muted-foreground mt-1">Hand-uploaded fresh accounts & social logs</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default ServerPicker;
