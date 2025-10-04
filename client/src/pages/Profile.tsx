import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsGrid } from "@/components/StatsGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LeaderboardEntry, type LeaderboardUser } from "@/components/LeaderboardEntry";
import { Trophy, TrendingUp, Target, Award, Settings, LogOut, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

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
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is admin
  const isAdmin = user?.email === 'admin@estocks.com' || user?.email === 'capshiv@example.com';

  useEffect(() => {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" data-testid="button-settings">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {user?.username?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold" data-testid="text-username">
                {user?.username || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {user?.createdAt ? formatJoinDate(user.createdAt) : 'Unknown'}
              </p>
            </div>
          </div>
          <Button variant="outline" className="w-full" data-testid="button-edit-profile">
            Edit Profile
          </Button>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading statistics...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : stats ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Statistics</h3>
              <StatsGrid stats={[
                { 
                  label: "Contests Played", 
                  value: stats.totalContests.toString(), 
                  icon: <Trophy className="h-4 w-4" /> 
                },
                { 
                  label: "Win Rate", 
                  value: `${stats.winRate}%`, 
                  icon: <Target className="h-4 w-4" /> 
                },
                { 
                  label: "Average ROI", 
                  value: `${stats.avgROI >= 0 ? '+' : ''}${stats.avgROI}%`, 
                  icon: <TrendingUp className="h-4 w-4" /> 
                },
                { 
                  label: "Best Rank", 
                  value: stats.bestRank ? `${stats.bestRank}${getRankSuffix(stats.bestRank)}` : 'N/A', 
                  icon: <Award className="h-4 w-4" /> 
                },
              ]} />
            </div>

            {stats.recentPerformance.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Recent Performance</h3>
                <div className="flex flex-col gap-3">
                  {stats.recentPerformance.map((perf, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{perf.contestName}</span>
                        <span className="text-sm text-muted-foreground">
                          {perf.rank > 0 ? `${perf.rank}${getRankSuffix(perf.rank)} place` : 'No rank'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>ROI: {perf.roi >= 0 ? '+' : ''}{perf.roi.toFixed(2)}%</span>
                        <span>Value: ${perf.portfolioValue.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No statistics available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Join some contests to see your performance statistics!
            </p>
          </div>
        )}

        <div className="space-y-3">
          {isAdmin && (
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => setLocation('/admin')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          )}
          <Button variant="outline" className="w-full justify-start" data-testid="button-transaction-history">
            Transaction History
          </Button>
          <Button variant="outline" className="w-full justify-start" data-testid="button-help">
            Help & Support
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive" 
            data-testid="button-logout"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
