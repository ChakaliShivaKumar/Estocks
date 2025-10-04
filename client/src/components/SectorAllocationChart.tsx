import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface SectorAllocationChartProps {
  data: Array<{
    sector: string;
    value: number;
    percentage: number;
  }>;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
];

export function SectorAllocationChart({ data }: SectorAllocationChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <TrendingUp className="h-8 w-8 mb-2" />
          <p>No sector data available</p>
          <p className="text-sm">Sector allocation will appear once you have holdings</p>
        </div>
      </Card>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }));

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Sector Allocation</h3>
          <p className="text-sm text-muted-foreground">
            Total Value: {totalValue.toFixed(2)} coins
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ sector, percentage }) => `${sector} (${percentage.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.sector}</p>
                      <p className="text-sm text-muted-foreground">
                        Value: <span className="font-mono">{data.value.toFixed(2)} coins</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Percentage: <span className="font-mono">{data.percentage.toFixed(1)}%</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Sector breakdown list */}
      <div className="mt-4 space-y-2">
        {chartData.map((item, index) => (
          <div key={item.sector} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              />
              <span>{item.sector}</span>
            </div>
            <div className="text-right">
              <div className="font-mono">{item.percentage.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground font-mono">
                {item.value.toFixed(2)} coins
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
