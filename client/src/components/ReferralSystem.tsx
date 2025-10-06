import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Copy, 
  Gift, 
  UserPlus, 
  Coins, 
  Zap,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ReferralSystemProps {
  userId: string;
  totalReferrals: number;
  className?: string;
}

interface ReferralReward {
  id: string;
  referrerId: string;
  referredId: string;
  rewardType: string;
  rewardAmount: number;
  claimed: boolean;
  claimedAt: string | null;
  createdAt: string;
}

export function ReferralSystem({ userId, totalReferrals, className }: ReferralSystemProps) {
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralInput, setReferralInput] = useState<string>("");
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralCode();
    fetchReferralRewards();
  }, [userId]);

  const fetchReferralCode = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/referral-code`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referralCode);
      }
    } catch (error) {
      console.error("Error fetching referral code:", error);
    }
  };

  const fetchReferralRewards = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/referral-rewards`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }
      });

      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error("Error fetching referral rewards:", error);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopySuccess(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy referral code",
        variant: "destructive",
      });
    }
  };

  const processReferral = async () => {
    if (!referralInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/process-referral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify({ referralCode: referralInput.trim() })
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Referral processed successfully! You've earned bonus coins and XP!",
        });
        setReferralInput("");
        // Refresh user data
        window.location.reload();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to process referral",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process referral",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalEarnedCoins = rewards
    .filter(r => r.rewardType === 'coins')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  const totalEarnedXP = rewards
    .filter(r => r.rewardType === 'xp')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Referral Program
        </h3>
        <Badge variant="outline">
          {totalReferrals} referral{totalReferrals !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Your Referral Code */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Your Referral Code
          </h4>
          <div className="flex gap-2">
            <Input
              value={referralCode}
              readOnly
              className="font-mono"
              placeholder="Generating..."
            />
            <Button
              onClick={copyReferralCode}
              variant="outline"
              size="icon"
              className={copySuccess ? "bg-green-500 text-white" : ""}
            >
              {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Share this code with friends to earn rewards when they join!
          </p>
        </div>

        {/* Use Referral Code */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Use a Referral Code
          </h4>
          <div className="flex gap-2">
            <Input
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              placeholder="Enter referral code"
              className="font-mono"
              maxLength={8}
            />
            <Button
              onClick={processReferral}
              disabled={loading || !referralInput.trim()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? "Processing..." : "Apply"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Enter a friend's referral code to get bonus coins and XP!
          </p>
        </div>

        {/* Rewards Summary */}
        {(totalEarnedCoins > 0 || totalEarnedXP > 0) && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Your Referral Rewards
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Coins className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-bold text-amber-600">{totalEarnedCoins}</div>
                  <div className="text-xs text-muted-foreground">Coins Earned</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-bold text-yellow-600">{totalEarnedXP}</div>
                  <div className="text-xs text-muted-foreground">XP Earned</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            How Referrals Work
          </h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>When someone uses your code:</span>
              <span className="text-green-600">You get 1000 coins + 200 XP</span>
            </div>
            <div className="flex justify-between">
              <span>When you use someone's code:</span>
              <span className="text-green-600">You get 500 coins + 100 XP</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
