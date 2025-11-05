import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Coins, 
  BarChart3, 
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Award,
  Users,
  Flame,
  ChevronRight,
  Target,
  Sparkles
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

interface Contest {
  id: string;
  name: string;
  description: string | null;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  status: string;
  featured: boolean;
  participants?: number;
}

interface Stock {
  symbol: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  sector: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  category: string;
  rarity: string;
  earnedAt: string;
}

interface UserStats {
  coinsBalance: number;
  level: number;
  experiencePoints: number;
  totalContests: number;
  winRate: number;
  totalROI: number;
  currentStreak: number;
}

interface ActiveContest {
  contestId: string;
  contestName: string;
  rank: number | null;
  roi: number;
  portfolioValue: number;
  endTime: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);

  // Fetch active contests
  const { data: activeContests = [], isLoading: contestsLoading } = useQuery({
    queryKey: ['active-contests'],
    queryFn: async () => {
      const res = await fetch('/api/contests', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch contests');
      const contests = await res.json();
      // Filter only active contests
      const now = new Date();
      return contests.filter((c: Contest) => {
        const endTime = new Date(c.endTime);
        return endTime > now && c.status === 'active';
      });
    },
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch user's active contest entries
  const { data: userActiveContests = [], isLoading: userContestsLoading } = useQuery({
    queryKey: ['user-active-contests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/users/${user.id}/contests`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch user contests');
      const data = await res.json();
      // Filter only active contests
      return data.filter((entry: any) => {
        const now = new Date();
        const endTime = new Date(entry.endTime);
        return endTime > now && entry.status === 'active';
      });
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch user stats (for additional stats like win rate, etc.)
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/users/${user.id}/stats`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch gamification stats (for level, XP, etc.)
  const { data: gamificationStats } = useQuery({
    queryKey: ['gamification-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/users/${user.id}/gamification`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch recent achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/users/${user.id}/achievements`, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.slice(0, 5); // Get 5 most recent
    },
    enabled: !!user,
  });

  // Fetch trending stocks (top gainers)
  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        const res = await fetch('/api/stocks', { credentials: 'include' });
        if (res.ok) {
          const stocks: any[] = await res.json();
          // Parse and normalize stock data
          const normalizedStocks: Stock[] = stocks.map(s => ({
            ...s,
            currentPrice: typeof s.currentPrice === 'number' ? s.currentPrice : parseFloat(s.currentPrice || '0'),
            priceChange: typeof s.priceChange === 'number' ? s.priceChange : parseFloat(s.priceChange || '0'),
            priceChangePercent: typeof s.priceChangePercent === 'number' ? s.priceChangePercent : parseFloat(s.priceChangePercent || '0'),
          }));
          // Sort by price change and get top 5 gainers
          const trending = normalizedStocks
            .filter(s => s.priceChange > 0)
            .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
            .slice(0, 5);
          setTrendingStocks(trending);
        }
      } catch (error) {
        console.error('Failed to fetch trending stocks:', error);
      }
    };
    fetchTrendingStocks();
    const interval = setInterval(fetchTrendingStocks, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate time remaining for contest
  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  // Calculate XP progress percentage
  const getXPProgress = () => {
    const currentLevel = gamificationStats?.level || user?.level || 1;
    const experiencePoints = gamificationStats?.experiencePoints || user?.experiencePoints || 0;
    const xpForCurrentLevel = (currentLevel - 1) * 100;
    const xpForNextLevel = currentLevel * 100;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    if (xpNeeded === 0) return 100;
    const xpProgress = experiencePoints - xpForCurrentLevel;
    return Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));
  };

  // Get best active contest ROI
  const bestActiveROI = userActiveContests.length > 0
    ? Math.max(...userActiveContests.map((c: any) => c.roi || 0))
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {/* Personalized Header (For logged-in users) */}
        {user ? (
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 pb-8">
            {/* App Icon/Logo at the top */}
            <div className="flex items-center justify-center mb-4">
              <div 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setLocation('/')}
              >
                <div className="flex items-center">
                  <img 
                    src="/logo.png" 
                    alt="TRADE UP Logo" 
                    className="h-48 w-48 object-contain"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  Welcome back, {user.fullName?.split(' ')[0] || user.username}! 👋
                </h1>
                <p className="text-muted-foreground text-sm">
                  Ready to dominate the market?
                </p>
              </div>
              {user.profilePicture && (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  <img src={user.profilePicture} alt={user.fullName || user.username} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* User Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Card className="p-4 bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Coins</p>
                    <p className="text-lg font-bold tabular-nums">
                      {user.coinsBalance?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Level</p>
                    <p className="text-lg font-bold">
                      {gamificationStats?.level || user.level || 1}
                    </p>
                  </div>
                </div>
              </Card>

              {(gamificationStats?.currentStreak || user.currentStreak) && (gamificationStats?.currentStreak || user.currentStreak || 0) > 0 && (
                <Card className="p-4 bg-background/50 backdrop-blur-sm col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Current Streak</p>
                        <p className="text-lg font-bold">{gamificationStats?.currentStreak || user.currentStreak || 0} days 🔥</p>
                      </div>
                    </div>
                    {(gamificationStats?.currentStreak || user.currentStreak || 0) >= 7 && (
                      <Badge variant="default" className="bg-orange-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        On Fire!
                      </Badge>
                    )}
                  </div>
                </Card>
              )}

              {/* XP Progress Bar */}
              {(gamificationStats || user) && (
                <Card className="p-4 bg-background/50 backdrop-blur-sm col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">XP Progress</span>
                    <span className="text-xs text-muted-foreground">
                      {gamificationStats?.experiencePoints || user.experiencePoints || 0} / {((gamificationStats?.level || user.level || 1) * 100)} XP
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getXPProgress()}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          // Hero Section for New Users
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 pb-8">
          <div className="flex items-center justify-center mb-6">
            <Logo size="lg" showText={false} className="scale-150" />
          </div>
          
          <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-3">
                Trade Stocks, Win Contests
              </h1>
              <p className="text-muted-foreground text-base max-w-2xl mx-auto">
              Experience the thrill of stock trading without the risk. Create portfolios, join contests, 
              and compete for the highest returns in our fantasy trading platform.
            </p>
          </div>

            <div className="flex gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={() => setLocation('/register')}
                className="px-8"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setLocation('/login')}
                className="px-8"
              >
                Sign In
              </Button>
            </div>
            </div>
          )}

        {/* Portfolio Performance Card (For logged-in users with active contests) */}
        {user && userActiveContests.length > 0 && bestActiveROI !== null && (
          <div className="px-6 -mt-4 mb-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Portfolio Performance</h3>
                  <p className="text-sm text-muted-foreground">Your best active contest</p>
        </div>
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-4xl font-bold tabular-nums ${bestActiveROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {bestActiveROI >= 0 ? '+' : ''}{bestActiveROI.toFixed(2)}%
                </span>
                {bestActiveROI >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-500 mb-1" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-500 mb-1" />
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/portfolio')}
                className="mt-2"
              >
                View Portfolio
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Card>
          </div>
        )}

        {/* Active Contests Carousel */}
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {user ? 'Your Active Contests' : 'Active Contests'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/contests')}
            >
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
        </div>

          {contestsLoading || (user && userContestsLoading) ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={`skeleton-${i}`} className="p-4 animate-pulse">
                  <div className="h-20 bg-muted rounded" />
                </Card>
              ))}
            </div>
          ) : userActiveContests.length > 0 ? (
            <div className="space-y-3">
              {userActiveContests.slice(0, 3).map((contest: any) => (
                <motion.div
                  key={contest.contestId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setLocation(`/contests/${contest.contestId}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{contest.contestName}</h4>
                          {contest.rank && (
                            <Badge variant="secondary" className="text-xs">
                              Rank #{contest.rank}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className={`font-medium ${contest.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ROI: {contest.roi >= 0 ? '+' : ''}{contest.roi?.toFixed(2)}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeRemaining(contest.endTime)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : activeContests.length > 0 ? (
            <div className="space-y-3">
              {activeContests.slice(0, 3).map((contest: Contest) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setLocation(`/contests/${contest.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{contest.name}</h4>
                          {contest.featured && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                  </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {contest.description || 'Join this contest and compete!'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Coins className="h-3 w-3 text-primary" />
                            {contest.prizePool} coins
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {contest.participants || 0}/{contest.maxParticipants}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {getTimeRemaining(contest.endTime)}
                          </span>
                  </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
                </motion.div>
            ))}
          </div>
          ) : (
            <Card className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h4 className="font-semibold mb-1">No Active Contests</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Check back soon for new contests!
              </p>
              {user && (
                <Button onClick={() => setLocation('/market')} size="sm">
                  Create Portfolio
                </Button>
              )}
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-6 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setLocation('/market')}
            >
              <Target className="h-6 w-6" />
              <span>Browse Stocks</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => setLocation('/contests')}
            >
              <Trophy className="h-6 w-6" />
              <span>Join Contest</span>
            </Button>
                    {user && (
              <>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => setLocation('/portfolio')}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span>Portfolio</span>
                </Button>
                      <Button 
                        variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setLocation('/leaderboard')}
                >
                  <Users className="h-6 w-6" />
                  <span>Leaderboard</span>
                      </Button>
              </>
                    )}
          </div>
        </div>

        {/* Trending Stocks */}
        {trendingStocks.length > 0 && (
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Trending Stocks
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/market')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {trendingStocks.map((stock) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card 
                    className="p-4 min-w-[140px] cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setLocation(`/market?symbol=${stock.symbol}`)}
                  >
                    <div className="mb-2">
                      <p className="font-bold text-sm">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {stock.companyName}
                      </p>
                </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold tabular-nums">
                        ${stock.currentPrice.toFixed(2)}
                      </span>
                </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                      stock.priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stock.priceChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stock.priceChange >= 0 ? '+' : ''}{stock.priceChangePercent.toFixed(2)}%
              </div>
            </Card>
                </motion.div>
              ))}
                </div>
              </div>
        )}

        {/* Recent Achievements */}
        {user && achievements.length > 0 && (
          <div className="px-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Recent Achievements
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/profile/${user.id}`)}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {achievements.map((achievement: Achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-4 min-w-[120px] text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full flex items-center justify-center">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-semibold text-sm mb-1 line-clamp-2">
                      {achievement.name}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {achievement.rarity}
                    </Badge>
            </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* How It Works (For new users) */}
        {!user && (
          <div className="px-6 mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              How It Works
            </h3>
            <div className="space-y-3">
              {[
                { step: "1", title: "Browse Stocks", desc: "Explore the market and select stocks", icon: Target },
                { step: "2", title: "Allocate Coins", desc: "Distribute your 100 coins strategically", icon: Coins },
                { step: "3", title: "Join Contests", desc: "Enter contests and compete", icon: Trophy },
                { step: "4", title: "Track Performance", desc: "Monitor your portfolio and climb ranks", icon: BarChart3 },
              ].map((step, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <step.icon className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
              </div>
            </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 TRADE UP. Fantasy trading for educational purposes.</p>
            <p className="mt-1">Not real money. Not real risk. Real learning.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
