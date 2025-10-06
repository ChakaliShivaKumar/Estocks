import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, DollarSign, Clock, ArrowLeft, AlertCircle } from "lucide-react";

interface Contest {
  id: string;
  name: string;
  description?: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  status: string;
}

export default function JoinContest() {
  const { contestId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { selectedPortfolio, setSelectedContest } = useContest();
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (contestId) {
      fetchContest();
    }
  }, [contestId]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contests/${contestId}`);
      
      if (!response.ok) {
        throw new Error('Contest not found');
      }
      
      const contestData = await response.json();
      setContest(contestData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contest');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinContest = async () => {
    if (!user) {
      alert("Please log in to join contests");
      setLocation('/login');
      return;
    }

    if (!selectedPortfolio || selectedPortfolio.length === 0) {
      alert("Please create a portfolio first by selecting stocks in the Market page");
      setLocation('/market');
      return;
    }
    
    try {
      setJoining(true);
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
      
      // Set the contest as selected and navigate to portfolio
      if (contest) {
        const contestData = {
          id: contest.id,
          name: contest.name,
          description: contest.description,
          entryFee: contest.entryFee,
          prizePool: contest.prizePool,
          participants: 0,
          maxParticipants: contest.maxParticipants,
          timeRemaining: calculateTimeRemaining(contest.endTime),
          featured: false,
          closingSoon: false
        };
        setSelectedContest(contestData);
      }
      
      alert("Successfully joined contest!");
      setLocation('/portfolio');
    } catch (error) {
      console.error("Error joining contest:", error);
      alert(`Failed to join contest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setJoining(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground">Loading contest...</div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="flex flex-col h-full justify-center items-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Contest Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || "The contest you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => setLocation('/contests')}>
            Browse Contests
          </Button>
        </Card>
      </div>
    );
  }

  const canJoin = contest.status === 'upcoming' || contest.status === 'active';
  const hasPortfolio = selectedPortfolio && selectedPortfolio.length > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/contests')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Join Contest</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{contest.name}</h2>
                  <Badge className={getStatusColor(contest.status)}>
                    {contest.status}
                  </Badge>
                </div>
                {contest.description && (
                  <p className="text-muted-foreground mb-3">{contest.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Entry Fee</div>
                  <div className="font-semibold">{contest.entryFee} coins</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Prize Pool</div>
                  <div className="font-semibold">{contest.prizePool} coins</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Max Participants</div>
                  <div className="font-semibold">{contest.maxParticipants}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Ends</div>
                  <div className="font-semibold text-sm">{formatDate(contest.endTime)}</div>
                </div>
              </div>
            </div>

            {!canJoin && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-800">
                  This contest is {contest.status} and cannot be joined at this time.
                </p>
              </div>
            )}

            {!hasPortfolio && canJoin && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800 text-sm">Create Portfolio First</h3>
                    <p className="text-xs text-blue-600">
                      You need to create a portfolio before joining this contest
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

            {hasPortfolio && canJoin && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800 text-sm">Portfolio Ready</h3>
                    <p className="text-xs text-green-600">
                      {selectedPortfolio.length} stocks selected • 100 coins allocated
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Ready to Join
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {canJoin && hasPortfolio ? (
                <Button 
                  onClick={handleJoinContest}
                  disabled={joining}
                  className="flex-1"
                  size="lg"
                >
                  {joining ? "Joining..." : `Join Contest (${contest.entryFee} coins)`}
                </Button>
              ) : (
                <Button 
                  onClick={() => setLocation('/market')}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Create Portfolio to Join
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
