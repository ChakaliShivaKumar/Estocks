import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Zap, Coins, Target } from "lucide-react";

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  rewardXP: number;
  rewardCoins: number;
  isActive: boolean;
  date: string;
  createdAt: string;
}

interface ChallengeProgress {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  claimedReward: boolean;
  createdAt: string;
}

interface DailyChallengesProps {
  userId: string;
  className?: string;
}

export function DailyChallenges({ userId, className }: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, [userId]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      const [challengesResponse, progressResponse] = await Promise.all([
        fetch("/api/daily-challenges", {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        }),
        fetch(`/api/users/${userId}/daily-challenges`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
        })
      ]);

      if (!challengesResponse.ok || !progressResponse.ok) {
        throw new Error("Failed to fetch challenges");
      }

      const [challengesData, progressData] = await Promise.all([
        challengesResponse.json(),
        progressResponse.json()
      ]);

      setChallenges(challengesData);
      setProgress(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const getProgressForChallenge = (challengeId: string) => {
    return progress.find(p => p.challengeId === challengeId);
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case "trading":
        return <Target className="h-4 w-4 text-blue-500" />;
      case "social":
        return <Circle className="h-4 w-4 text-green-500" />;
      case "achievement":
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">Loading challenges...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-red-500">
          Error loading challenges: {error}
          <Button onClick={fetchChallenges} className="mt-2" variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          No challenges available today. Check back tomorrow!
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Daily Challenges
        </h3>
        <Badge variant="outline">
          {progress.filter(p => p.completed).length} / {challenges.length} completed
        </Badge>
      </div>

      <div className="space-y-4">
        {challenges.map((challenge) => {
          const challengeProgress = getProgressForChallenge(challenge.id);
          const progressValue = challengeProgress?.progress || 0;
          const isCompleted = challengeProgress?.completed || false;
          const progressPercent = Math.min((progressValue / challenge.target) * 100, 100);

          return (
            <div key={challenge.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getChallengeIcon(challenge.type)}
                  <div>
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                </div>
                {isCompleted && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{progressValue} / {challenge.target}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Zap className="h-4 w-4" />
                    {challenge.rewardXP} XP
                  </div>
                  {challenge.rewardCoins > 0 && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Coins className="h-4 w-4" />
                      {challenge.rewardCoins} coins
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="capitalize">
                  {challenge.type}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
