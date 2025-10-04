import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, TrendingUp, BarChart3 } from "lucide-react";

interface ContestEntry {
  rank: number;
  userId: string;
  username: string;
  portfolioValue: number;
  roi: number;
}

interface PortfolioComparisonProps {
  onCompare?: (userId: string) => void;
}

export function PortfolioComparison({ onCompare }: PortfolioComparisonProps) {
  const [leaderboard, setLeaderboard] = useState<ContestEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"bar" | "line">("bar");

  const { user } = useAuth();
  const { selectedContest } = useContest();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedContest) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/contests/${selectedContest.id}/leaderboard`);
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedContest]);

  if (!selectedContest) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Users className="h-8 w-8 mb-2" />
          <p>No contest selected</p>
          <p className="text-sm">Select a contest to view portfolio comparisons</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-muted-foreground">Loading leaderboard...</div>
        </div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Users className="h-8 w-8 mb-2" />
          <p>No participants yet</p>
          <p className="text-sm">Join the contest to see comparisons</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data - show top 10 performers
  const chartData = leaderboard.slice(0, 10).map((entry, index) => ({
    rank: entry.rank || index + 1,
    username: entry.username,
    roi: entry.roi,
    portfolioValue: entry.portfolioValue,
    isCurrentUser: entry.userId === user?.id
  }));

  const currentUserEntry = leaderboard.find(entry => entry.userId === user?.id);
  const currentUserRank = currentUserEntry ? (currentUserEntry.rank || leaderboard.indexOf(currentUserEntry) + 1) : null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Comparison</h3>
          <p className="text-sm text-muted-foreground">
            Your Rank: {currentUserRank ? `#${currentUserRank}` : "Not ranked"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "bar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("bar")}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("line")}
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="rank" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Rank: <span className="font-mono">#{data.rank}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ROI: <span className={`font-mono ${data.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {data.roi >= 0 ? "+" : ""}{data.roi.toFixed(2)}%
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Value: <span className="font-mono">{data.portfolioValue.toFixed(2)} coins</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="roi" 
                fill={(entry: any) => entry.isCurrentUser ? "#3b82f6" : "#22c55e"}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="rank" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => `${value.toFixed(0)}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Rank: <span className="font-mono">#{data.rank}</span>
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
              <Line 
                type="monotone" 
                dataKey="roi" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* User Selection */}
      <div className="flex items-center gap-4">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Compare with user..." />
          </SelectTrigger>
          <SelectContent>
            {leaderboard
              .filter(entry => entry.userId !== user?.id)
              .slice(0, 10)
              .map((entry) => (
                <SelectItem key={entry.userId} value={entry.userId}>
                  {entry.username} (Rank #{entry.rank || leaderboard.indexOf(entry) + 1})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={() => selectedUser && onCompare?.(selectedUser)}
          disabled={!selectedUser}
        >
          Compare
        </Button>
      </div>

      {/* Current User Stats */}
      {currentUserEntry && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Your Performance</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Rank</div>
              <div className="font-semibold">#{currentUserRank}</div>
            </div>
            <div>
              <div className="text-muted-foreground">ROI</div>
              <div className={`font-semibold ${currentUserEntry.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                {currentUserEntry.roi >= 0 ? "+" : ""}{currentUserEntry.roi.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Portfolio Value</div>
              <div className="font-semibold">{currentUserEntry.portfolioValue.toFixed(2)} coins</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
