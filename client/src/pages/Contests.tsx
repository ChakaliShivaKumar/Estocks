import { ContestCard, type Contest } from "@/components/ContestCard";
import { MyContests } from "@/components/MyContests";
import { UserContestManagement } from "@/components/UserContestManagement";
import { CoinBalance } from "@/components/CoinBalance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, ArrowLeft, User, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { useLocation } from "wouter";

export default function Contests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "create">("all");
  const { user } = useAuth();
  const { selectedPortfolio, setSelectedContest } = useContest();
  const [, setLocation] = useLocation();

  // Fetch contests from API
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/contests');
        if (!response.ok) {
          throw new Error('Failed to fetch contests');
        }
        const contestsData = await response.json();
        
        // Transform database format to frontend format
        const transformedContests: Contest[] = contestsData.map((contest: any) => ({
          id: contest.id,
          name: contest.name,
          description: contest.description,
          entryFee: contest.entryFee,
          prizePool: contest.prizePool,
          participants: 0, // TODO: Calculate from contest_entries
          maxParticipants: contest.maxParticipants,
          timeRemaining: calculateTimeRemaining(contest.endTime),
          featured: contest.featured,
          closingSoon: isClosingSoon(contest.endTime)
        }));
        
        setContests(transformedContests);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contests');
      } finally {
        setLoading(false);
      }
    };

    fetchContests();
  }, []);

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
  const isClosingSoon = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    return diff <= 2 * 60 * 60 * 1000; // Less than 2 hours
  };

  const handleJoinContest = async (contestId: string) => {
    if (!user) {
      alert("Please log in to join contests");
      return;
    }

    if (!selectedPortfolio || selectedPortfolio.length === 0) {
      alert("Please create a portfolio first by selecting stocks in the Market page");
      setLocation('/market');
      return;
    }
    
    try {
      const response = await fetch(`/api/contests/${contestId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          portfolio: selectedPortfolio
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join contest');
      }

      const result = await response.json();
      console.log("Successfully joined contest:", result);
      
      // Find the contest and set it as selected
      const contest = contests.find(c => c.id === contestId);
      if (contest) {
        setSelectedContest(contest);
      }
      
      alert("Successfully joined contest!");
      
      // Navigate to portfolio page
      setLocation('/portfolio');
    } catch (error) {
      console.error("Error joining contest:", error);
      alert(`Failed to join contest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/market')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Contests</h1>
          </div>
          <CoinBalance balance={user?.coinsBalance || 15000} />
        </div>

        {selectedPortfolio.length > 0 && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary text-sm">Portfolio Ready</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedPortfolio.length} stocks selected • 100 coins allocated
                </p>
              </div>
              <Badge variant="default" className="text-xs">
                Ready to Join
              </Badge>
            </div>
          </div>
        )}

        {selectedPortfolio.length === 0 && (
          <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-600 text-sm">No Portfolio</h3>
                <p className="text-xs text-muted-foreground">
                  Create a portfolio first to join contests
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation('/market')}
                className="text-xs"
              >
                Create Portfolio
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            All Contests
          </Button>
          {user && (
            <>
              <Button
                variant={activeTab === "my" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("my")}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                My Contests
              </Button>
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("create")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Contest
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {activeTab === "all" ? (
          <>
            {loading && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading contests...</div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="text-red-500 mb-2">Error loading contests</div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </div>
            )}

            {!loading && !error && (
              <div className="flex flex-col gap-4">
                {contests.map((contest) => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    onJoin={handleJoinContest}
                  />
                ))}
                {contests.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No active contests available
                  </div>
                )}
              </div>
            )}
          </>
        ) : activeTab === "my" ? (
          <MyContests />
        ) : (
          <UserContestManagement />
        )}
      </div>

      {user && activeTab === "all" && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setActiveTab("my")}
            data-testid="button-view-my-contests"
          >
            View My Contests
          </Button>
        </div>
      )}
    </div>
  );
}
