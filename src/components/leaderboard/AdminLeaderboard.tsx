import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, RefreshCw, Loader2 } from 'lucide-react';
import { useLeaderboard, formatNaira } from '@/components/leaderboard/TradingLeaderboard';

export const AdminLeaderboard: React.FC = () => {
  const { data, loading, reload } = useLeaderboard(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Weekly Trading Leaderboard
        </CardTitle>
        <CardDescription>
          Full ranking with complete emails — Monday 6:00am to Sunday 6:00pm. Qualifying threshold:{' '}
          {data ? formatNaira(data.min_qualify) : '₦8,000'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {data && (
            <>
              <Badge variant={data.active ? 'default' : 'secondary'}>
                {data.active ? 'Live' : 'Closed'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(data.starts_at).toLocaleString()} → {new Date(data.ends_at).toLocaleString()}
              </span>
            </>
          )}
          <Button size="sm" variant="outline" className="ml-auto gap-2" onClick={reload}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !data || data.error ? (
          <p className="text-center text-muted-foreground py-8">
            {data?.error === 'Unauthorized'
              ? 'Admin role required to view full emails.'
              : 'Leaderboard unavailable.'}
          </p>
        ) : data.top.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No trades recorded this week yet.</p>
        ) : (
          <div className="space-y-2">
            {data.top.map((e) => (
              <div
                key={e.position}
                className="flex items-start gap-3 p-3 border rounded-lg flex-wrap"
              >
                <div className="w-8 shrink-0 font-bold text-sm">#{e.position}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-all">{e.email}</p>
                  {e.total >= data.min_qualify ? (
                    <Badge variant="default" className="mt-1">Qualified</Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-1">Below threshold</Badge>
                  )}
                </div>
                <div className="shrink-0 font-semibold text-primary">{formatNaira(e.total)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminLeaderboard;
