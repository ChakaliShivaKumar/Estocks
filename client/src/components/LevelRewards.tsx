import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gift, Coins, Zap, CheckCircle, Star } from "lucide-react";

interface LevelReward {
  id: string;
  userId: string;
  level: number;
  rewardType: string;
  rewardAmount: number;
  claimed: boolean;
  claimedAt: string | null;
  createdAt: string;
}

interface LevelRewardsProps {
  userId: string;
  className?: string;
}

export function LevelRewards({ userId, className }: LevelRewardsProps) {
  const [rewards, setRewards] = useState<LevelReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRewards();
  }, [userId]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}/level-rewards`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error("Error fetching level rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    setClaiming(rewardId);
    try {
      const response = await fetch(`/api/users/${userId}/level-rewards/${rewardId}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });

      if (response.ok) {
        toast({
          title: "Reward Claimed!",
          description: "Level reward has been added to your account",
        });
        fetchRewards(); // Refresh rewards
        // Refresh user data to update coins/XP
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: "Failed to claim reward",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim reward",
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
  };

  const unclaimedRewards = rewards.filter(r => !r.claimed);
  const claimedRewards = rewards.filter(r => r.claimed);

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case "coins":
        return <Coins className="h-4 w-4 text-amber-600" />;
      case "xp":
        return <Zap className="h-4 w-4 text-yellow-600" />;
      default:
        return <Gift className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRewardColor = (rewardType: string) => {
    switch (rewardType) {
      case "coins":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "xp":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-muted-foreground">Loading rewards...</div>
      </Card>
    );
  }

  if (rewards.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Level Rewards Yet</h3>
          <p className="text-sm text-muted-foreground">
            Level up to unlock amazing rewards!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-500" />
          Level Rewards
        </h3>
        <Badge variant="outline">
          {unclaimedRewards.length} unclaimed
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Unclaimed Rewards */}
        {unclaimedRewards.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-green-600">Ready to Claim</h4>
            <div className="space-y-2">
              {unclaimedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getRewardColor(reward.rewardType)}`}
                >
                  <div className="flex items-center gap-3">
                    {getRewardIcon(reward.rewardType)}
                    <div>
                      <div className="font-medium">
                        Level {reward.level} {reward.rewardType === 'coins' ? 'Coin' : 'XP'} Reward
                      </div>
                      <div className="text-sm text-muted-foreground">
                        +{reward.rewardAmount} {reward.rewardType}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => claimReward(reward.id)}
                    disabled={claiming === reward.id}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {claiming === reward.id ? "Claiming..." : "Claim"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claimed Rewards */}
        {claimedRewards.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-muted-foreground">Claimed Rewards</h4>
            <div className="space-y-2">
              {claimedRewards.slice(0, 5).map((reward) => (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between p-3 rounded-lg border opacity-60 ${getRewardColor(reward.rewardType)}`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">
                        Level {reward.level} {reward.rewardType === 'coins' ? 'Coin' : 'XP'} Reward
                      </div>
                      <div className="text-sm text-muted-foreground">
                        +{reward.rewardAmount} {reward.rewardType}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Claimed
                  </Badge>
                </div>
              ))}
            </div>
            {claimedRewards.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2">
                +{claimedRewards.length - 5} more claimed rewards
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rewards Info */}
      <div className="mt-6 bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Level Reward System</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>• Level up to unlock rewards</div>
          <div>• Each level gives coins and XP bonuses</div>
          <div>• Rewards must be claimed manually</div>
          <div>• Higher levels = better rewards</div>
        </div>
      </div>
    </Card>
  );
}
