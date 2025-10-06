import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LevelProgress } from "./LevelProgress";
import { DailyChallenges } from "./DailyChallenges";
import { StreakTracker } from "./StreakTracker";
import { ReferralSystem } from "./ReferralSystem";
import { LevelRewards } from "./LevelRewards";
import { 
  Gamepad2, 
  Target, 
  Flame, 
  Users, 
  Gift, 
  Zap, 
  Coins,
  Trophy,
  Star
} from "lucide-react";

interface GamificationStats {
  level: number;
  experiencePoints: number;
  currentStreak: number;
  longestStreak: number;
  totalReferrals: number;
  unclaimedLevelRewards: number;
  todaysChallengesCompleted: number;
  todaysChallengesTotal: number;
}

interface GamificationDashboardProps {
  userId: string;
  className?: string;
}

export function GamificationDashboard({ userId, className }: GamificationDashboardProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}/gamification`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch gamification stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">Loading gamification data...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-red-500">
          Error loading gamification data: {error}
          <Button onClick={fetchStats} className="mt-2" variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-purple-500" />
          Gamification Center
        </h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Level {stats.level}
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Zap className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.experiencePoints.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">XP</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <div className="text-sm text-muted-foreground">Referrals</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.todaysChallengesCompleted}/{stats.todaysChallengesTotal}</div>
              <div className="text-sm text-muted-foreground">Challenges</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Level Progress */}
      <LevelProgress 
        level={stats.level} 
        experiencePoints={stats.experiencePoints} 
      />

      {/* Unclaimed Rewards Alert */}
      {stats.unclaimedLevelRewards > 0 && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  Level Rewards Available!
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  You have {stats.unclaimedLevelRewards} unclaimed level reward{stats.unclaimedLevelRewards !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Badge className="bg-purple-600 text-white">
              {stats.unclaimedLevelRewards}
            </Badge>
          </div>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="streaks" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            <span className="hidden sm:inline">Streaks</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Referrals</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-6">
          <DailyChallenges userId={userId} />
        </TabsContent>

        <TabsContent value="streaks" className="mt-6">
          <StreakTracker 
            currentStreak={stats.currentStreak} 
            longestStreak={stats.longestStreak} 
          />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralSystem 
            userId={userId} 
            totalReferrals={stats.totalReferrals} 
          />
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <LevelRewards userId={userId} />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <Card className="p-6">
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Achievements Coming Soon!</h3>
              <p className="text-muted-foreground">
                We're working on an amazing achievement system. Stay tuned!
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
