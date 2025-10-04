import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeaderboardEntry } from "./LeaderboardEntry";
import { Trophy, TrendingUp, History, Users, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";

interface EnhancedLeaderboardProps {
  contestId?: string;
}

interface LeaderboardEntry {
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
}

interface EnhancedLeaderboardData {
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  totalParticipants: number;
}

export function EnhancedLeaderboard({ contestId }: EnhancedLeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<EnhancedLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { selectedContest } = useContest();
  const currentContestId = contestId || selectedContest?.id;

  const fetchLeaderboard = async (showRefresh = false) => {
    if (!currentContestId) return;

    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await fetch(
        `/api/contests/${currentContestId}/leaderboard?enhanced=true${user ? `&userId=${user.id}` : ''}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentContestId, user]);

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to follow user');
      }
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  };

  if (!currentContestId) {
    return (
      <Card className="p-8 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">No Contest Selected</h2>
        <p className="text-muted-foreground">Select a contest to view the leaderboard</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading leaderboard...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">Error loading leaderboard</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button onClick={() => fetchLeaderboard()} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  if (!leaderboardData || leaderboardData.leaderboard.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">No Participants Yet</h2>
        <p className="text-muted-foreground">Be the first to join the contest!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <Badge variant="secondary">
            {leaderboardData.totalParticipants} participants
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {leaderboardData.userRank && (
            <Badge variant="outline">
              Your Rank: #{leaderboardData.userRank}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Leaderboard Content */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Current
          </TabsTrigger>
          <TabsTrigger value="top-performers" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Performers
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-3">
          {leaderboardData.leaderboard.map((entry) => (
            <LeaderboardEntry
              key={entry.userId}
              entry={entry}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          ))}
        </TabsContent>

        <TabsContent value="top-performers" className="space-y-3">
          {leaderboardData.leaderboard
            .filter(entry => entry.rank <= 10)
            .map((entry) => (
              <LeaderboardEntry
                key={entry.userId}
                entry={entry}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
        </TabsContent>

        <TabsContent value="following" className="space-y-3">
          {leaderboardData.leaderboard
            .filter(entry => entry.isFollowing)
            .map((entry) => (
              <LeaderboardEntry
                key={entry.userId}
                entry={entry}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />
            ))}
          {leaderboardData.leaderboard.filter(entry => entry.isFollowing).length === 0 && (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Followed Users</h2>
              <p className="text-muted-foreground">Follow other traders to see them here</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Real-time indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Real-time updates active
      </div>
    </div>
  );
}
