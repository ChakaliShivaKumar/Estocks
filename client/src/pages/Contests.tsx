import { ContestCard, type Contest } from "@/components/ContestCard";
import { MyContests } from "@/components/MyContests";
import { UserContestManagement } from "@/components/UserContestManagement";
import { PortfolioManagement } from "@/components/PortfolioManagement";
import { CoinBalance } from "@/components/CoinBalance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Zap, 
  ArrowLeft, 
  User, 
  Plus, 
  Trophy,
  Coins,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Star,
  Timer,
  Briefcase
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SavedPortfolio {
  id: string;
  name: string;
  description: string | null;
  holdings: Array<{ stockSymbol: string; coinsInvested: number }>;
  totalCoins: number;
  createdAt: string;
  updatedAt: string;
}

export default function Contests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "create" | "portfolios">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "upcoming" | "completed">("all");
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedPortfolio, setSelectedPortfolio, setSelectedContest } = useContest();
  const [, setLocation] = useLocation();

  // Fetch contests from API
  const { data: contestsData, refetch: refetchContests } = useQuery({
    queryKey: ['contests', statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all' 
        ? '/api/contests' 
        : `/api/contests?status=${statusFilter}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch contests');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: activeTab === 'all', // Only fetch when on 'all' tab
  });

  // Fetch user contests
  const { data: userContestsData } = useQuery({
    queryKey: ['user-contests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/users/${user.id}/contests`, { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch saved portfolios
  const { data: savedPortfoliosData, refetch: refetchSavedPortfolios } = useQuery({
    queryKey: ['saved-portfolios', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch('/api/portfolios', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (savedPortfoliosData) {
      setSavedPortfolios(savedPortfoliosData);
    }
  }, [savedPortfoliosData]);

  // Fetch participant counts for contests
  useEffect(() => {
    const fetchParticipantCounts = async () => {
      if (!contestsData) return;
      
      const contestsWithCounts = await Promise.all(
        contestsData.map(async (contest: any) => {
          try {
            const entriesRes = await fetch(`/api/contests/${contest.id}/leaderboard`, { credentials: 'include' });
            const entries = entriesRes.ok ? await entriesRes.json() : [];
            return {
              ...contest,
              participants: Array.isArray(entries) ? entries.length : 0,
            };
          } catch {
            return { ...contest, participants: 0 };
          }
        })
      );

      const transformedContests: Contest[] = contestsWithCounts.map((contest: any) => ({
          id: contest.id,
          name: contest.name,
          description: contest.description,
          entryFee: contest.entryFee,
          prizePool: contest.prizePool,
        participants: contest.participants || 0,
          maxParticipants: contest.maxParticipants,
          timeRemaining: calculateTimeRemaining(contest.endTime),
          featured: contest.featured,
        closingSoon: isClosingSoon(contest.endTime),
        status: contest.status,
        startTime: contest.startTime,
        endTime: contest.endTime,
      }));
      
      // Sort contests by status and time
      transformedContests.sort((a, b) => {
        // Active contests first
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        // Then by featured
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        // Then by end time (soonest first)
        const aEnd = a.endTime ? new Date(a.endTime).getTime() : 0;
        const bEnd = b.endTime ? new Date(b.endTime).getTime() : 0;
        return aEnd - bEnd;
      });
        
        setContests(transformedContests);
        setLoading(false);
    };

    if (contestsData) {
      fetchParticipantCounts();
    }
  }, [contestsData]);

  // Helper function to calculate time remaining
  const calculateTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Helper function to check if contest is closing soon
  const isClosingSoon = (endTime: string | undefined) => {
    if (!endTime) return false;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    return diff <= 2 * 60 * 60 * 1000 && diff > 0; // Less than 2 hours
  };

  // Filter contests by status
  const filteredContests = useMemo(() => {
    let filtered = contests;

    if (statusFilter === 'active') {
      filtered = filtered.filter(c => c.status === 'active');
    } else if (statusFilter === 'upcoming') {
      filtered = filtered.filter(c => c.status === 'upcoming');
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(c => c.status === 'completed');
    }

    // Sort: featured first, then by closing soon, then by prize pool
    return filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.closingSoon && !b.closingSoon) return -1;
      if (!a.closingSoon && b.closingSoon) return 1;
      return b.prizePool - a.prizePool;
    });
  }, [contests, statusFilter]);

  // Get featured contest
  const featuredContest = useMemo(() => {
    return filteredContests.find(c => c.featured && c.status === 'active');
  }, [filteredContests]);

  // Get user's active contests count
  const userActiveContestsCount = useMemo(() => {
    if (!userContestsData) return 0;
    const now = new Date();
    return userContestsData.filter((c: any) => {
      const endTime = new Date(c.endTime);
      return endTime > now && c.status === 'active';
    }).length;
  }, [userContestsData]);

  const handleJoinContest = async (contestId: string, useSavedPortfolioId?: string) => {
    if (!user) {
      alert("Please log in to join contests");
      return;
    }

    // Use saved portfolio ID if provided, otherwise use selected portfolio from context
    const portfolioIdToUse = useSavedPortfolioId || selectedPortfolioId;
    
    if (!portfolioIdToUse && (!selectedPortfolio || selectedPortfolio.length === 0)) {
      alert("Please create a portfolio first by selecting stocks in the Market page or choose a saved portfolio");
      setLocation('/market');
      return;
    }
    
    try {
      const requestBody: any = {};
      if (portfolioIdToUse) {
        requestBody.portfolioId = portfolioIdToUse;
      } else {
        requestBody.portfolio = selectedPortfolio;
      }

      const response = await fetch(`/api/contests/${contestId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join contest');
      }

      const result = await response.json();
      
      // Find the contest and set it as selected
      const contest = contests.find(c => c.id === contestId);
      if (contest) {
        setSelectedContest(contest);
      }
      
      // Refresh contests and saved portfolios
      refetchContests();
      refetchSavedPortfolios();
      
      alert("Successfully joined contest!");
      
      // Navigate to portfolio page
      setLocation('/portfolio');
    } catch (error) {
      console.error("Error joining contest:", error);
      alert(`Failed to join contest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Calculate participant percentage
  const getParticipantPercentage = (participants: number, maxParticipants: number) => {
    return Math.min(100, (participants / maxParticipants) * 100);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Enhanced Header - Mobile First */}
      <header className="flex-shrink-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="p-4 space-y-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
                onClick={() => setLocation('/')}
                className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
              <Logo size="sm" showText={false} />
              <h1 className="text-xl font-bold">Contests</h1>
          </div>
            {user && (
              <CoinBalance balance={user.coinsBalance || 0} />
            )}
        </div>

          {/* Portfolio Status Banner */}
          {user && (
            <Card className="p-3 bg-primary/10 border-primary/20">
              <div className="space-y-2">
            <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(selectedPortfolio && selectedPortfolio.length > 0) || selectedPortfolioId ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <h3 className="font-semibold text-sm text-primary">Portfolio Ready</h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedPortfolioId 
                              ? `Using saved portfolio`
                              : `${selectedPortfolio?.length || 0} stocks • 100 coins allocated`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                          <h3 className="font-semibold text-sm text-orange-600">No Portfolio Selected</h3>
                <p className="text-xs text-muted-foreground">
                            Create new or choose a saved portfolio
                </p>
              </div>
                      </>
                    )}
                  </div>
                  {(selectedPortfolio && selectedPortfolio.length > 0) || selectedPortfolioId ? (
                    <Badge variant="default" className="text-xs bg-green-500">
                Ready to Join
              </Badge>
                  ) : null}
            </div>
                
                {/* Portfolio Selector */}
                <div className="flex gap-2">
                  {savedPortfolios.length > 0 && (
                    <Select
                      value={selectedPortfolioId || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setSelectedPortfolioId(null);
                          setSelectedPortfolio([]);
                        } else {
                          const portfolio = savedPortfolios.find(p => p.id === value);
                          if (portfolio) {
                            setSelectedPortfolioId(portfolio.id);
                            setSelectedPortfolio(portfolio.holdings.map(h => ({
                              stockSymbol: h.stockSymbol,
                              coinsInvested: h.coinsInvested
                            })));
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1 h-8 text-xs">
                        <SelectValue placeholder="Select saved portfolio..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Create New Portfolio</SelectItem>
                        {savedPortfolios.map((portfolio) => (
                          <SelectItem key={portfolio.id} value={portfolio.id}>
                            {portfolio.name} ({portfolio.holdings.length} stocks)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/market')}
                    className="text-xs h-8 flex-shrink-0"
              >
                    {selectedPortfolioId ? "Edit" : "Create"}
              </Button>
            </div>
          </div>
            </Card>
        )}

          {/* Primary Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
              className="flex items-center gap-2 flex-shrink-0"
          >
            <Zap className="h-4 w-4" />
            All Contests
              {filteredContests.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                  {filteredContests.length}
                </Badge>
              )}
          </Button>
          {user && (
            <>
              <Button
                variant={activeTab === "my" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("my")}
                  className="flex items-center gap-2 flex-shrink-0"
              >
                <User className="h-4 w-4" />
                My Contests
                  {userActiveContestsCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                      {userActiveContestsCount}
                    </Badge>
                  )}
              </Button>
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("create")}
                  className="flex items-center gap-2 flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
                  Create
                </Button>
                <Button
                  variant={activeTab === "portfolios" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("portfolios")}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Briefcase className="h-4 w-4" />
                  Portfolios
                  {savedPortfolios.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                      {savedPortfolios.length}
                    </Badge>
                  )}
              </Button>
            </>
            )}
          </div>

          {/* Status Filter Tabs (Secondary) */}
          {activeTab === "all" && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { value: 'all', label: 'All', icon: Trophy },
                { value: 'active', label: 'Active', icon: Zap },
                { value: 'upcoming', label: 'Upcoming', icon: Clock },
                { value: 'completed', label: 'Completed', icon: CheckCircle2 },
              ].map(option => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(option.value as any)}
                    className="flex items-center gap-1.5 text-xs h-7 flex-shrink-0"
                  >
                    <Icon className="h-3 w-3" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "all" ? (
          <>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading contests...</div>
              </div>
            )}

            {error && (
              <Card className="m-4 p-6 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                <div className="text-red-500 mb-2 font-semibold">Error loading contests</div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </Card>
            )}

            {!loading && !error && (
              <div className="p-4 pb-24 space-y-4">
                {/* Featured Contest Hero */}
                {featuredContest && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-primary/30 border-2">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <Badge variant="default" className="bg-yellow-500 text-xs">
                            FEATURED
                          </Badge>
                        </div>
                        {featuredContest.closingSoon && (
                          <Badge variant="destructive" className="text-xs">
                            <Timer className="h-3 w-3 mr-1" />
                            Closing Soon
                          </Badge>
                        )}
                      </div>

                      <h2 className="text-2xl font-bold mb-2">{featuredContest.name}</h2>
                      {featuredContest.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {featuredContest.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Prize Pool</span>
                          </div>
                          <p className="text-lg font-bold text-primary tabular-nums">
                            {featuredContest.prizePool.toLocaleString()} coins
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Participants</span>
                          </div>
                          <p className="text-lg font-bold tabular-nums">
                            {featuredContest.participants}/{featuredContest.maxParticipants}
                          </p>
                          <Progress 
                            value={getParticipantPercentage(featuredContest.participants, featuredContest.maxParticipants)} 
                            className="h-1.5 mt-1"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Coins className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Entry Fee</span>
                          </div>
                          <p className="text-lg font-bold tabular-nums">
                            {featuredContest.entryFee} coins
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Time Left</span>
                          </div>
                          <p className="text-lg font-bold">
                            {featuredContest.timeRemaining}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full h-11 font-semibold"
                        onClick={() => handleJoinContest(featuredContest.id, selectedPortfolioId || undefined)}
                        disabled={!selectedPortfolio && !selectedPortfolioId}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Join Featured Contest
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Card>
                  </motion.div>
                )}

                {/* Regular Contest Cards */}
                {filteredContests
                  .filter(c => !(c.featured && c.status === 'active'))
                  .map((contest, index) => (
                    <motion.div
                      key={contest.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                  <ContestCard
                    contest={contest}
                        onJoin={(contestId) => handleJoinContest(contestId, selectedPortfolioId || undefined)}
                      />
                    </motion.div>
                  ))}

                {/* Empty State */}
                {filteredContests.length === 0 && (
                  <Card className="p-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-semibold mb-1">No Contests Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {statusFilter !== 'all' 
                        ? `No ${statusFilter} contests available`
                        : 'No active contests at the moment. Create your own contest to get started!'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      {statusFilter !== 'all' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setStatusFilter('all')}
                        >
                          View All Contests
                        </Button>
                      )}
                      {user && (
                        <Button
                          size="sm"
                          onClick={() => setActiveTab('create')}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Contest
                        </Button>
                      )}
                  </div>
                  </Card>
                )}
              </div>
            )}
          </>
        ) : activeTab === "my" ? (
          <div className="p-4 pb-24">
          <MyContests />
          </div>
        ) : activeTab === "portfolios" ? (
          <div className="p-4 pb-24">
            <PortfolioManagement />
          </div>
        ) : (
          <div className="p-4 pb-24">
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('all')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Contests
              </Button>
            </div>
            <UserContestManagement 
              onContestCreated={async () => {
                // Wait a bit for the database to be updated
                await new Promise(resolve => setTimeout(resolve, 500));
                setActiveTab('all');
                // Force refetch by invalidating the query
                refetchContests();
                // Also manually refetch after a short delay
                setTimeout(() => {
                  refetchContests();
                }, 1000);
              }}
            />
          </div>
        )}

        {/* Quick Create Button - Floating Action Button */}
      {user && activeTab === "all" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-20 right-4 z-50"
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={() => setActiveTab('create')}
            >
              <Plus className="h-6 w-6" />
          </Button>
          </motion.div>
        )}
        </div>
    </div>
  );
}
