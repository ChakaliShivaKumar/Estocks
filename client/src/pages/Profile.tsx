import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { CoinManagement } from "@/components/CoinManagement";
import { StatsGrid } from "@/components/StatsGrid";
import { GamificationDashboard } from "@/components/GamificationDashboard";
import { SocialFeatures } from "@/components/SocialFeatures";
import { 
  User, 
  Settings, 
  Coins, 
  BarChart3, 
  LogOut, 
  Shield,
  Trophy,
  TrendingUp,
  Target,
  Award,
  Gamepad2,
  Users
} from "lucide-react";

interface UserStats {
  totalContests: number;
  winRate: number;
  avgROI: number;
  bestRank: number | null;
  recentPerformance: Array<{
    rank: number;
    userId: string;
    username: string;
    portfolioValue: number;
    roi: number;
    contestName: string;
  }>;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"overview" | "edit" | "coins" | "stats" | "gamification" | "social">("overview");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string>("");
  
  const { user, logout, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check if user is admin
  const isAdmin = user?.email === 'admin@estocks.com' || user?.email === 'capshiv@example.com';

  useEffect(() => {
    if (user) {
      fetchUserStats();
      if (user.profilePicture) {
        setProfileImage(user.profilePicture);
      }
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/stats`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleImageChange = (imageUrl: string) => {
    setProfileImage(imageUrl);
    if (updateUser) {
      updateUser({ profilePicture: imageUrl });
    }
  };

  const handleImageRemove = () => {
    setProfileImage("");
    if (updateUser) {
      updateUser({ profilePicture: "" });
    }
  };

  const handleProfileSave = () => {
    // Refresh user data or show success message
    fetchUserStats();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">Please log in to view your profile</div>
          <Button onClick={() => setLocation('/login')} className="mt-4">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.fullName || user.username}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>@{user.username}</span>
                {isAdmin && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => setLocation('/admin')}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Button>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Profile</span>
            </TabsTrigger>
            <TabsTrigger value="coins" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Coins</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Gamification</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Photo Upload */}
            <ProfilePhotoUpload
              currentImage={profileImage}
              onImageChange={handleImageChange}
              onRemove={handleImageRemove}
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Coins className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Coin Balance</div>
                    <div className="text-xl font-bold">{user.coinsBalance.toLocaleString()}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contests Joined</div>
                    <div className="text-xl font-bold">{stats?.totalContests || 0}</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                    <div className="text-xl font-bold">{stats?.winRate ? `${stats.winRate.toFixed(1)}%` : '0%'}</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Account Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{user.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Username</div>
                  <div className="font-medium">@{user.username}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Full Name</div>
                  <div className="font-medium">{user.fullName || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Member Since</div>
                  <div className="font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="edit">
            <ProfileEditForm onSave={handleProfileSave} />
          </TabsContent>

          <TabsContent value="coins">
            <CoinManagement />
          </TabsContent>

          <TabsContent value="stats">
            {loading ? (
              <Card className="p-8 text-center">
                <div className="text-muted-foreground">Loading statistics...</div>
              </Card>
            ) : error ? (
              <Card className="p-8 text-center">
                <div className="text-red-500 mb-2">Error loading statistics</div>
                <div className="text-sm text-muted-foreground">{error}</div>
                <Button onClick={fetchUserStats} className="mt-4">
                  Try Again
                </Button>
              </Card>
            ) : stats ? (
              <div className="space-y-6">
                <StatsGrid stats={[
                  {
                    label: "Total Contests",
                    value: stats.totalContests,
                    icon: <Trophy className="h-4 w-4" />
                  },
                  {
                    label: "Win Rate",
                    value: `${stats.winRate}%`,
                    icon: <TrendingUp className="h-4 w-4" />
                  },
                  {
                    label: "Average ROI",
                    value: `${stats.avgROI}%`,
                    icon: <Target className="h-4 w-4" />
                  },
                  {
                    label: "Best Rank",
                    value: stats.bestRank ? `#${stats.bestRank}` : "N/A",
                    icon: <Award className="h-4 w-4" />
                  }
                ]} />
                
                {stats.recentPerformance.length > 0 ? (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Recent Performance
                    </h3>
                    <div className="space-y-3">
                      {stats.recentPerformance.slice(0, 5).map((performance, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{performance.contestName}</div>
                            <div className="text-sm text-muted-foreground">
                              Portfolio: {performance.portfolioValue.toFixed(2)} coins
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              <span className="font-semibold">#{performance.rank}</span>
                            </div>
                            <div className={`text-sm ${performance.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {performance.roi >= 0 ? '+' : ''}{performance.roi.toFixed(2)}% ROI
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Contest History Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Join your first contest to start building your trading statistics
                    </p>
                    <Button onClick={() => setLocation('/contests')}>
                      Browse Contests
                    </Button>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <div className="text-muted-foreground">No statistics available</div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="gamification">
            <GamificationDashboard userId={user.id} />
          </TabsContent>

          <TabsContent value="social">
            <SocialFeatures userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}