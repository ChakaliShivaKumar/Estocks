import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Medal } from "lucide-react";

export interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  portfolioValue: number;
  roi: number;
}

interface LeaderboardEntryProps {
  user: LeaderboardUser;
}

export function LeaderboardEntry({ user }: LeaderboardEntryProps) {
  const isPositive = user.roi >= 0;
  const isTopThree = user.rank <= 3;

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "";
  };

  return (
    <Card className="p-3" data-testid={`card-leaderboard-${user.rank}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
          {isTopThree ? (
            <Medal className={`h-6 w-6 ${getMedalColor(user.rank)}`} />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">
              {user.rank}
            </span>
          )}
        </div>

        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarFallback className="bg-muted text-foreground font-medium">
            {user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate" data-testid={`text-username-${user.rank}`}>
            {user.username}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            ₹{user.portfolioValue.toLocaleString()}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div
            className={`flex items-center gap-1 text-base font-bold tabular-nums ${
              isPositive ? "text-primary" : "text-destructive"
            }`}
            data-testid={`text-roi-${user.rank}`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {isPositive ? "+" : ""}
            {user.roi.toFixed(2)}%
          </div>
        </div>
      </div>
    </Card>
  );
}
