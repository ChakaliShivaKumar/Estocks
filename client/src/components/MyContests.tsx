import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROIIndicator } from "./ROIIndicator";
import { Trophy, Clock, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { useLocation } from "wouter";

interface MyContest {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  status: string;
  featured: boolean;
  entryId: string;
  totalCoinsInvested: number;
  finalPortfolioValue?: string;
  roi?: string;
  rank?: number;
  joinedAt: string;
}

export function MyContests() {
  const [contests, setContests] = useState<MyContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  const { user } = useAuth();
  const { setSelectedContest } = useContest();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchMyContests = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/users/${user.id}/contests`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contests');
        }
        
        const data = await response.json();
        setContests(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contests');
      } finally {
        setLoading(false);
      }
    };

    fetchMyContests();
  }, [user]);

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

  const handleViewContest = (contest: MyContest) => {
    // Transform to Contest format expected by context
    const contestData = {
      id: contest.id,
      name: contest.name,
      description: contest.description,
      entryFee: contest.entryFee,
      prizePool: contest.prizePool,
      participants: 0, // We don't have this info easily available
      maxParticipants: contest.maxParticipants,
      timeRemaining: calculateTimeRemaining(contest.endTime),
      featured: contest.featured,
      closingSoon: false // We can calculate this if needed
    };
    
    setSelectedContest(contestData);
    setLocation('/portfolio');
  };

  const filteredContests = contests.filter(contest => {
    if (activeTab === "active") {
      return contest.status === 'active' || contest.status === 'upcoming';
    } else {
      return contest.status === 'completed';
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground">Loading your contests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-red-500 mb-2">Error loading contests</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="flex flex-col h-full justify-center">
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Contests Joined</h2>
          <p className="text-muted-foreground mb-4">Join your first contest to see it here</p>
          <Button onClick={() => setLocation('/contests')}>
            Browse Contests
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6" />
        <h1 className="text-2xl font-bold">My Contests</h1>
        <Badge variant="secondary">{contests.length} total</Badge>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("active")}
        >
          Active Contests
          <Badge variant="secondary" className="ml-2">
            {contests.filter(c => c.status === 'active' || c.status === 'upcoming').length}
          </Badge>
        </Button>
        <Button
          variant={activeTab === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("completed")}
        >
          Completed
          <Badge variant="secondary" className="ml-2">
            {contests.filter(c => c.status === 'completed').length}
          </Badge>
        </Button>
      </div>

      {/* Contests List */}
      <div className="space-y-4">
        {filteredContests.map((contest) => {
          const roi = contest.roi ? parseFloat(contest.roi) : 0;
          const portfolioValue = contest.finalPortfolioValue ? parseFloat(contest.finalPortfolioValue) : contest.totalCoinsInvested;
          
          return (
            <Card key={contest.entryId} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{contest.name}</h3>
                    {contest.featured && (
                      <Badge variant="default" className="text-xs">Featured</Badge>
                    )}
                    <Badge 
                      variant={contest.status === 'active' ? 'default' : contest.status === 'completed' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {contest.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activeTab === "completed" ? "Ended" : calculateTimeRemaining(contest.endTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Entry Fee: {contest.entryFee} coins
                    </div>
                    {contest.rank && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        Rank: #{contest.rank}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Portfolio Value</div>
                      <div className="font-semibold tabular-nums">
                        {portfolioValue.toFixed(2)} coins
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">ROI</div>
                      <div className="flex items-center gap-1">
                        <ROIIndicator roi={roi} size="sm" />
                        <span className="font-semibold tabular-nums">
                          {roi >= 0 ? "+" : ""}{roi.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    {contest.rank && (
                      <div>
                        <div className="text-xs text-muted-foreground">Final Rank</div>
                        <div className="flex items-center gap-1">
                          {contest.rank <= 3 ? (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-semibold">#{contest.rank}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleViewContest(contest)}
                    size="sm"
                  >
                    View Portfolio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const contestData = {
                        id: contest.id,
                        name: contest.name,
                        description: contest.description,
                        entryFee: contest.entryFee,
                        prizePool: contest.prizePool,
                        participants: 0,
                        maxParticipants: contest.maxParticipants,
                        timeRemaining: calculateTimeRemaining(contest.endTime),
                        featured: contest.featured,
                        closingSoon: false
                      };
                      setSelectedContest(contestData);
                      setLocation('/leaderboard');
                    }}
                  >
                    View Leaderboard
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredContests.length === 0 && (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">
            No {activeTab === "active" ? "Active" : "Completed"} Contests
          </h2>
          <p className="text-muted-foreground">
            {activeTab === "active" 
              ? "You don't have any active contests right now" 
              : "You haven't completed any contests yet"
            }
          </p>
        </Card>
      )}
    </div>
  );
}
