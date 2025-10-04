import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AchievementBadge } from "./AchievementBadge";
import { ROIIndicator } from "./ROIIndicator";
import { UserPlus, UserMinus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntryProps {
  entry: {
    rank: number;
    userId: string;
    username: string;
    portfolioValue: number;
    roi: number;
    rankChange?: number;
    isFollowing?: boolean;
    achievements?: Array<{
      id: string;
      name: string;
      description: string;
      icon?: string;
      category: string;
      rarity: string;
    }>;
  };
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
}

export function LeaderboardEntry({ entry, onFollow, onUnfollow }: LeaderboardEntryProps) {
  const [isFollowing, setIsFollowing] = useState(entry.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleFollowToggle = async () => {
    if (!user || user.id === entry.userId) return;
    
    setIsLoading(true);
    try {
      if (isFollowing) {
        await onUnfollow?.(entry.userId);
        setIsFollowing(false);
      } else {
        await onFollow?.(entry.userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankChangeIcon = () => {
    if (entry.rankChange === undefined) return null;
    
    if (entry.rankChange > 0) {
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    } else if (entry.rankChange < 0) {
      return <TrendingDown className="h-3 w-3 text-red-600" />;
    } else {
      return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRankBadgeVariant = () => {
    if (entry.rank === 1) return "default"; // Gold
    if (entry.rank === 2) return "secondary"; // Silver  
    if (entry.rank === 3) return "outline"; // Bronze
    return "outline";
  };

  const getRankBadgeColor = () => {
    if (entry.rank === 1) return "bg-yellow-500 text-white";
    if (entry.rank === 2) return "bg-gray-400 text-white";
    if (entry.rank === 3) return "bg-orange-600 text-white";
    return "";
  };

  return (
    <Card className={`p-4 transition-all duration-200 hover:shadow-md ${
      entry.rank <= 3 ? "border-2" : "border"
    } ${entry.rank === 1 ? "border-yellow-400" : entry.rank === 2 ? "border-gray-400" : entry.rank === 3 ? "border-orange-400" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <div className="flex items-center gap-2">
            <Badge 
              variant={getRankBadgeVariant()}
              className={`${getRankBadgeColor()} text-sm font-bold min-w-[2rem] h-8 flex items-center justify-center`}
            >
              #{entry.rank}
            </Badge>
            {getRankChangeIcon()}
            {entry.rankChange !== undefined && entry.rankChange !== 0 && (
              <span className={`text-xs font-medium ${
                entry.rankChange > 0 ? "text-green-600" : "text-red-600"
              }`}>
                {entry.rankChange > 0 ? "+" : ""}{entry.rankChange}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{entry.username}</span>
              {user?.id !== entry.userId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFollowToggle}
                  disabled={isLoading}
                  className="h-6 w-6 p-0"
                >
                  {isFollowing ? (
                    <UserMinus className="h-3 w-3 text-red-500" />
                  ) : (
                    <UserPlus className="h-3 w-3 text-blue-500" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Achievements */}
            {entry.achievements && entry.achievements.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {entry.achievements.slice(0, 3).map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    size="sm"
                  />
                ))}
                {entry.achievements.length > 3 && (
                  <Badge variant="secondary" className="text-xs h-4 px-1">
                    +{entry.achievements.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Portfolio Value</div>
            <div className="font-semibold tabular-nums">
              {entry.portfolioValue.toFixed(2)} coins
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">ROI</div>
            <div className="flex items-center gap-1">
              <ROIIndicator roi={entry.roi} size="sm" />
              <span className="font-semibold tabular-nums">
                {entry.roi >= 0 ? "+" : ""}{entry.roi.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}