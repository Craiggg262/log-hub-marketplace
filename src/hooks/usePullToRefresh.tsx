import { useState, useRef, useCallback, TouchEvent } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}

export const usePullToRefresh = ({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY.current);
    // Dampen the pull distance
    setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
  }, [pulling, refreshing, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);
    
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      setPullDistance(threshold * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, threshold, refreshing, onRefresh]);

  return {
    containerRef,
    pullDistance,
    refreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
};
