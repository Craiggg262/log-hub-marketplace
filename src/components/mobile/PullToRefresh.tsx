import React from 'react';
import { Loader2 } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ children, onRefresh, className }) => {
  const { containerRef, pullDistance, refreshing, handlers } = usePullToRefresh({ onRefresh });

  return (
    <div
      ref={containerRef}
      className={cn("overflow-y-auto", className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <div className={cn(
          "flex items-center gap-2 text-primary transition-opacity",
          pullDistance > 40 ? "opacity-100" : "opacity-50"
        )}>
          <Loader2 className={cn("h-5 w-5", refreshing && "animate-spin")} />
          <span className="text-xs font-medium">
            {refreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
};
