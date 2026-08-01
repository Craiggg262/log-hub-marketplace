import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  position: number;
  email: string;
  total: number;
}

export interface LeaderboardData {
  active: boolean;
  starts_at: string;
  ends_at: string;
  min_qualify: number;
  top: LeaderboardEntry[];
  me: (LeaderboardEntry & { qualified: boolean }) | null;
  error?: string;
}

export const formatNaira = (n: number) =>
  `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

export function useLeaderboard(fullEmail = false) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res, error } = await supabase.rpc('get_weekly_leaderboard', {
      p_full_email: fullEmail,
    });
    if (!error && res) setData(res as unknown as LeaderboardData);
    setLoading(false);
  }, [fullEmail]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}

const rankIcon = (pos: number) => {
  if (pos === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (pos === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (pos === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return null;
};

const countdown = (endsAt: string) => {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Closed';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${d}d ${h}h ${m}m left`;
};

export const LeaderboardList: React.FC<{
  data: LeaderboardData | null;
  loading: boolean;
  showMe?: boolean;
}> = ({ data, loading, showMe = true }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!data || data.error) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Leaderboard unavailable.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant={data.active ? 'default' : 'secondary'}>
          {data.active ? 'Live now' : 'Closed'}
        </Badge>
        <span>{countdown(data.ends_at)}</span>
      </div>

      <div className="space-y-2">
        {data.top.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No trades yet this week — be the first on the board!
          </p>
        )}
        {data.top.map((e) => (
          <div
            key={e.position}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3"
          >
            <div className="w-8 shrink-0 flex items-center justify-center font-bold text-sm">
              {rankIcon(e.position) || e.position}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium break-all">{e.email}</p>
            </div>
            <div className="shrink-0 text-sm font-semibold text-primary">{formatNaira(e.total)}</div>
          </div>
        ))}
      </div>

      {showMe && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
          {data.me ? (
            <div className="flex items-center gap-3">
              <div className="w-8 shrink-0 text-center font-bold text-sm">#{data.me.position}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Your position</p>
                <p className="text-xs text-muted-foreground break-all">{data.me.email}</p>
              </div>
              <div className="shrink-0 text-sm font-semibold">{formatNaira(data.me.total)}</div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You haven't traded this week yet. Trade at least {formatNaira(data.min_qualify)} to qualify
              for a prize.
            </p>
          )}
          {data.me && !data.me.qualified && (
            <p className="text-xs text-muted-foreground mt-2">
              Trade {formatNaira(data.min_qualify - data.me.total)} more to reach the{' '}
              {formatNaira(data.min_qualify)} qualifying threshold.
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Competition runs Monday 6:00am to Sunday 6:00pm. Minimum qualifying trade volume is{' '}
        {formatNaira(data.min_qualify)}. Emails are partly hidden for privacy.
      </p>
    </div>
  );
};

export const TradingLeaderboard: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const { data, loading, reload } = useLeaderboard(false);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-2">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Weekly Trading Champions</DialogTitle>
          <DialogDescription className="text-center">
            Top 4 traders of the week. Climb the board and win.
          </DialogDescription>
        </DialogHeader>

        <LeaderboardList data={data} loading={loading} />

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={reload}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradingLeaderboard;
