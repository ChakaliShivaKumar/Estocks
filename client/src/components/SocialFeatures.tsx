import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "./AchievementBadge";
import { FriendSystem } from "./FriendSystem";
import { PrivateLeagues } from "./PrivateLeagues";
import { AchievementSharing, AchievementSharesList } from "./AchievementSharing";
import { Users, Trophy, UserPlus, UserMinus, Star, MessageCircle, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface SocialFeaturesProps {
  userId?: string;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  followedAt: Date;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  rarity: string;
}

interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Date;
  contestId?: string;
  achievement: Achievement;
}

export function SocialFeatures({ userId }: SocialFeaturesProps) {
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const currentUserId = userId || user?.id;

  useEffect(() => {
    if (currentUserId) {
      fetchSocialData();
    }
  }, [currentUserId]);

  const fetchSocialData = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      
      const [followersRes, followingRes, achievementsRes] = await Promise.all([
        fetch(`/api/users/${currentUserId}/followers`, { credentials: 'include' }),
        fetch(`/api/users/${currentUserId}/following`, { credentials: 'include' }),
        fetch(`/api/users/${currentUserId}/achievements`, { credentials: 'include' })
      ]);

      if (followersRes.ok) {
        const followersData = await followersRes.json();
        setFollowers(followersData);
      }

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowing(followingData);
      }

      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        setAchievements(achievementsData);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load social data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await fetch(`/api/users/${targetUserId}/follow`, {
          method: 'DELETE',
          credentials: 'include'
        });
        setFollowing(prev => prev.filter(u => u.id !== targetUserId));
      } else {
        await fetch(`/api/users/${targetUserId}/follow`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        // Refresh following list
        fetchSocialData();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading social features...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">Error loading social features</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button onClick={fetchSocialData} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Social Features</h1>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends
          </TabsTrigger>
          <TabsTrigger value="leagues" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Leagues
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Shares
          </TabsTrigger>
          <TabsTrigger value="followers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Followers ({followers.length})
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Following ({following.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <FriendSystem />
        </TabsContent>

        <TabsContent value="leagues" className="space-y-4">
          <PrivateLeagues />
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {achievements.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Achievements Yet</h2>
              <p className="text-muted-foreground">Start trading to earn your first achievement!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((userAchievement) => (
                <Card key={userAchievement.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <AchievementBadge
                      achievement={userAchievement.achievement}
                      size="lg"
                      showTooltip={false}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{userAchievement.achievement.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {userAchievement.achievement.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${
                            userAchievement.achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                            userAchievement.achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                            userAchievement.achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {userAchievement.achievement.rarity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Earned {new Date(userAchievement.earnedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shares" className="space-y-4">
          {currentUserId && <AchievementSharesList userId={currentUserId} />}
        </TabsContent>

        <TabsContent value="followers" className="space-y-3">
          {followers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Followers Yet</h2>
              <p className="text-muted-foreground">Share your achievements to get followers!</p>
            </Card>
          ) : (
            followers.map((follower) => (
              <Card key={follower.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{follower.username}</div>
                      <div className="text-sm text-muted-foreground">
                        Followed {new Date(follower.followedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {user?.id === currentUserId && user.id !== follower.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowToggle(follower.id, false)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow Back
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-3">
          {following.length === 0 ? (
            <Card className="p-8 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Not Following Anyone</h2>
              <p className="text-muted-foreground">Follow other traders to see their performance!</p>
            </Card>
          ) : (
            following.map((followedUser) => (
              <Card key={followedUser.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{followedUser.username}</div>
                      <div className="text-sm text-muted-foreground">
                        Following since {new Date(followedUser.followedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {user?.id === currentUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowToggle(followedUser.id, true)}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unfollow
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
