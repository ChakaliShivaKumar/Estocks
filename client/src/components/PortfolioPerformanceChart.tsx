import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioPerformanceChartProps {
  data: Array<{
    timestamp: string;
    portfolioValue: number;
  }>;
  initialValue?: number;
}

export function PortfolioPerformanceChart({ data, initialValue = 100 }: PortfolioPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <TrendingUp className="h-8 w-8 mb-2" />
          <p>No performance data available</p>
          <p className="text-sm">Performance tracking will start once you make your first trade</p>
        </div>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData = data.map((point, index) => ({
    time: new Date(point.timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    value: parseFloat(point.portfolioValue.toString()),
    roi: ((parseFloat(point.portfolioValue.toString()) - initialValue) / initialValue) * 100,
    timestamp: point.timestamp
  }));

  const latestValue = chartData[chartData.length - 1]?.value || initialValue;
  const totalROI = ((latestValue - initialValue) / initialValue) * 100;
  const isPositive = totalROI >= 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <p className="text-sm text-muted-foreground">Over time</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-lg font-semibold ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {totalROI.toFixed(2)}%
          </div>
          <div className="text-sm text-muted-foreground">
            {latestValue.toFixed(2)} coins
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={isPositive ? "#22c55e" : "#ef4444"} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={isPositive ? "#22c55e" : "#ef4444"} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              className="text-xs"
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              className="text-xs"
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(value) => `${value.toFixed(0)}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-muted-foreground">
                        Value: <span className="font-mono">{data.value.toFixed(2)} coins</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ROI: <span className={`font-mono ${data.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.roi >= 0 ? "+" : ""}{data.roi.toFixed(2)}%
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#22c55e" : "#ef4444"}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
