import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateContestForm } from "@/components/CreateContestForm";
import { 
  Plus, 
  Trophy, 
  Users, 
  Clock, 
  DollarSign, 
  Eye, 
  Edit, 
  Trash2, 
  Share2,
  Calendar,
  Settings
} from "lucide-react";

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
  visibility: string;
  inviteCode?: string;
  allowFriends: boolean;
  createdAt: string;
}

export function UserContestManagement() {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my-contests" | "create">("my-contests");

  useEffect(() => {
    if (user) {
      fetchUserContests();
    }
  }, [user]);

  const fetchUserContests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/contests/created`, {
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

  const handleContestCreated = (contest: Contest) => {
    setContests(prev => [contest, ...prev]);
    setActiveTab("my-contests");
  };

  const handleDeleteContest = async (contestId: string) => {
    if (!confirm('Are you sure you want to delete this contest?')) return;

    try {
      const response = await fetch(`/api/contests/${contestId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete contest');
      }

      setContests(prev => prev.filter(c => c.id !== contestId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contest');
    }
  };

  const copyContestLink = (contestId: string) => {
    const contestLink = `${window.location.origin}/contests/join/${contestId}`;
    navigator.clipboard.writeText(contestLink);
    // You could add a toast notification here
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

  const isContestAtRisk = (contest: Contest) => {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const timeUntilStart = startTime.getTime() - now.getTime();
    const hoursUntilStart = timeUntilStart / (1000 * 60 * 60);
    
    // Contest is at risk if it starts within 24 hours and has no participants yet
    return hoursUntilStart <= 24 && hoursUntilStart > 0;
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'private': return 'bg-orange-100 text-orange-800';
      case 'friends': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading your contests...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Contests</h2>
          <p className="text-muted-foreground">Create and manage your trading contests</p>
        </div>
        <Button onClick={() => setActiveTab("create")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Contest
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-contests" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            My Contests
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-contests" className="space-y-4">
          {error && (
            <Card className="p-4 bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </Card>
          )}

          {contests.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Contests Created Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first contest to start competing with friends
              </p>
              <Button onClick={() => setActiveTab("create")}>
                Create Your First Contest
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {contests.map((contest) => (
                <Card key={contest.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{contest.name}</h3>
                        <Badge className={getStatusColor(contest.status)}>
                          {contest.status}
                        </Badge>
                        <Badge className={getVisibilityColor(contest.visibility)}>
                          {contest.visibility}
                        </Badge>
                      </div>
                      {contest.description && (
                        <p className="text-muted-foreground mb-3">{contest.description}</p>
                      )}
                      {isContestAtRisk(contest) && contest.status === 'upcoming' && (
                        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-xs text-orange-800">
                            ⚠️ <strong>At Risk:</strong> This contest starts soon and needs more participants to avoid cancellation.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteContest(contest.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Ends</div>
                        <div className="font-semibold text-sm">{formatDate(contest.endTime)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Contest Link</div>
                      <div className="font-mono text-xs text-muted-foreground truncate">
                        Share this link to invite others
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyContestLink(contest.id)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <CreateContestForm onSuccess={handleContestCreated} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
