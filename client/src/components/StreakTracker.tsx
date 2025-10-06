import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Calendar } from "lucide-react";

interface StreakTrackerProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakTracker({ currentStreak, longestStreak, className }: StreakTrackerProps) {
  const getStreakBadgeColor = (streak: number) => {
    if (streak >= 30) return "bg-red-500";
    if (streak >= 7) return "bg-orange-500";
    if (streak >= 3) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "Great start! Keep it going!";
    if (streak < 3) return "Building momentum!";
    if (streak < 7) return "You're on fire!";
    if (streak < 30) return "Incredible streak!";
    return "Legendary status!";
  };

  const getNextMilestone = (streak: number) => {
    if (streak < 3) return 3;
    if (streak < 7) return 7;
    if (streak < 30) return 30;
    return null;
  };

  const nextMilestone = getNextMilestone(currentStreak);
  const daysToNextMilestone = nextMilestone ? nextMilestone - currentStreak : 0;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Streak Tracker
        </h3>
        <Badge className={getStreakBadgeColor(currentStreak)}>
          {currentStreak} day{currentStreak !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Current Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Best Streak</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">{longestStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            {getStreakMessage(currentStreak)}
          </p>
        </div>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Next Milestone</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{nextMilestone} days</div>
              <div className="text-xs text-muted-foreground">
                {daysToNextMilestone} more to go
              </div>
            </div>
          </div>
        )}

        {/* Streak Benefits */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>7-day streak:</span>
            <span className="text-green-600">+100 XP bonus</span>
          </div>
          <div className="flex justify-between">
            <span>30-day streak:</span>
            <span className="text-green-600">+500 XP bonus</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
