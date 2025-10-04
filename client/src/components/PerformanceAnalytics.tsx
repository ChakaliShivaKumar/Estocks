import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy, AlertTriangle } from "lucide-react";

interface PerformanceAnalyticsProps {
  bestPerformers: Array<{
    symbol: string;
    roi: number;
  }>;
  worstPerformers: Array<{
    symbol: string;
    roi: number;
  }>;
}

export function PerformanceAnalytics({ bestPerformers, worstPerformers }: PerformanceAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Best Performers */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Top Performers</h3>
        </div>
        
        {bestPerformers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <TrendingUp className="h-6 w-6 mb-2" />
            <p className="text-sm">No performance data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bestPerformers.map((performer, index) => (
              <div key={performer.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{performer.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-mono text-green-600 font-semibold">
                    +{performer.roi.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Worst Performers */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold">Underperformers</h3>
        </div>
        
        {worstPerformers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <TrendingDown className="h-6 w-6 mb-2" />
            <p className="text-sm">No performance data</p>
          </div>
        ) : (
          <div className="space-y-3">
            {worstPerformers.map((performer, index) => (
              <div key={performer.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{performer.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-mono text-red-600 font-semibold">
                    {performer.roi.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
