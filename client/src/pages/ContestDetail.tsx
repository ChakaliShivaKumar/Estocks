import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContestComments } from "@/components/ContestComments";
import { EnhancedLeaderboard } from "@/components/EnhancedLeaderboard";
import { ArrowLeft, Trophy, Users, Clock, DollarSign, Target } from "lucide-react";

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
  featured: boolean;
}

export default function ContestDetail() {
  const [, params] = useRoute("/contests/:id");
  const contestId = params?.id;
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (contestId) {
      fetchContest();
    }
  }, [contestId]);

  const fetchContest = async () => {
    if (!contestId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/contests/${contestId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contest');
      }
      
      const data = await response.json();
      setContest(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contest');
    } finally {
      setLoading(false);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">Loading contest...</div>
        </Card>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-2">Error loading contest</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={() => window.history.back()} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{contest.name}</h1>
            {contest.description && (
              <p className="text-muted-foreground mt-1">{contest.description}</p>
            )}
          </div>
          <Badge variant={contest.featured ? "default" : "secondary"}>
            {contest.featured ? "Featured" : contest.status}
          </Badge>
        </div>

        {/* Contest Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Entry Fee</div>
                <div className="text-lg font-bold">{contest.entryFee} coins</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Prize Pool</div>
                <div className="text-lg font-bold">{contest.prizePool} coins</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max Participants</div>
                <div className="text-lg font-bold">{contest.maxParticipants}</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Time Remaining</div>
                <div className="text-lg font-bold">{calculateTimeRemaining(contest.endTime)}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Contest Details */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Contest Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Start Time</div>
              <div className="font-medium">{formatDate(contest.startTime)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">End Time</div>
              <div className="font-medium">{formatDate(contest.endTime)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{contest.status}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Contest ID</div>
              <div className="font-medium font-mono text-xs">{contest.id}</div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-4">
            <EnhancedLeaderboard 
              contestId={contestId} 
              userId={user?.id}
            />
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <ContestComments contestId={contestId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
