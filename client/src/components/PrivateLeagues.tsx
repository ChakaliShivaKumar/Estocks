import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Copy, 
  Share2, 
  Settings,
  Trophy,
  Calendar,
  UserPlus,
  Crown,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PrivateLeague {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  inviteCode: string;
  maxMembers: number;
  isPublic: boolean;
  createdAt: Date;
  memberCount: number;
  isMember: boolean;
}

interface LeagueMember {
  id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  level: number;
  experiencePoints: number;
  role: 'creator' | 'admin' | 'member';
  joinedAt: Date;
}

interface Contest {
  id: string;
  name: string;
  description?: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  startTime: Date;
  endTime: Date;
  status: string;
  featured: boolean;
  addedBy: {
    id: string;
    username: string;
  };
  addedAt: Date;
}

export function PrivateLeagues() {
  const [leagues, setLeagues] = useState<PrivateLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<PrivateLeague | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // Create league form
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    maxMembers: 50,
    isPublic: false
  });

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchLeagues();
    }
  }, [user?.id]);

  const fetchLeagues = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/private-leagues`, { 
        credentials: 'include' 
      });

      if (response.ok) {
        const data = await response.json();
        setLeagues(data);
      } else {
        setError('Failed to fetch leagues');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagueDetails = async (leagueId: string) => {
    try {
      const [membersRes, contestsRes] = await Promise.all([
        fetch(`/api/private-leagues/${leagueId}/members`, { credentials: 'include' }),
        fetch(`/api/private-leagues/${leagueId}/contests`, { credentials: 'include' })
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData);
      }

      if (contestsRes.ok) {
        const contestsData = await contestsRes.json();
        setContests(contestsData);
      }
    } catch (err) {
      console.error('Error fetching league details:', err);
    }
  };

  const handleCreateLeague = async () => {
    if (!createForm.name.trim()) return;

    try {
      const response = await fetch('/api/private-leagues', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setCreateForm({ name: "", description: "", maxMembers: 50, isPublic: false });
        fetchLeagues();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
      setError('Failed to create league');
    }
  };

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) return;

    try {
      const response = await fetch('/api/private-leagues/join', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });

      if (response.ok) {
        setShowJoinDialog(false);
        setInviteCode("");
        fetchLeagues();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join league');
      }
    } catch (error) {
      console.error('Error joining league:', error);
      setError('Failed to join league');
    }
  };

  const handleLeaveLeague = async (leagueId: string) => {
    try {
      const response = await fetch(`/api/private-leagues/${leagueId}/leave`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        fetchLeagues();
        if (selectedLeague?.id === leagueId) {
          setSelectedLeague(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to leave league');
      }
    } catch (error) {
      console.error('Error leaving league:', error);
      setError('Failed to leave league');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'creator':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading private leagues...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">Error loading leagues</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button onClick={fetchLeagues} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Private Leagues</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Join League
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Private League</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="Enter invite code..."
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                </div>
                <Button onClick={handleJoinLeague} className="w-full">
                  Join League
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create League
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Private League</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">League Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter league name..."
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter league description..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="100"
                    value={createForm.maxMembers}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={createForm.isPublic}
                    onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label htmlFor="isPublic">Make league public</Label>
                </div>
                <Button onClick={handleCreateLeague} className="w-full">
                  Create League
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="my-leagues" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-leagues">My Leagues</TabsTrigger>
          <TabsTrigger value="league-details">League Details</TabsTrigger>
        </TabsList>

        <TabsContent value="my-leagues" className="space-y-4">
          {leagues.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Leagues Yet</h2>
              <p className="text-muted-foreground mb-4">
                Create your own private league or join an existing one to compete with friends!
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create League
                </Button>
                <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join League
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.map((league) => (
                <Card key={league.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{league.name}</h3>
                        {league.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {league.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={league.isMember ? "default" : "secondary"}>
                        {league.isMember ? "Member" : "Not Member"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {league.memberCount}/{league.maxMembers}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(league.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteCode(league.inviteCode)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLeague(league)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      {league.isMember && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleLeaveLeague(league.id)}
                        >
                          Leave
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="league-details" className="space-y-4">
          {selectedLeague ? (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedLeague.name}</h2>
                    {selectedLeague.description && (
                      <p className="text-muted-foreground mt-2">{selectedLeague.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteCode(selectedLeague.inviteCode)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Invite
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedLeague.memberCount}</div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{selectedLeague.maxMembers}</div>
                    <div className="text-sm text-muted-foreground">Max Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{contests.length}</div>
                    <div className="text-sm text-muted-foreground">Contests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {selectedLeague.isPublic ? "Public" : "Private"}
                    </div>
                    <div className="text-sm text-muted-foreground">Visibility</div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Members</h3>
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profilePicture} />
                            <AvatarFallback>
                              {member.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.username}</div>
                            <div className="text-sm text-muted-foreground">
                              Level {member.level}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <span className="text-sm capitalize">{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Contests</h3>
                  <div className="space-y-3">
                    {contests.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No contests added yet
                      </p>
                    ) : (
                      contests.map((contest) => (
                        <div key={contest.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{contest.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Added by {contest.addedBy.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(contest.addedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">{contest.status}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Select a League</h2>
              <p className="text-muted-foreground">
                Choose a league from the "My Leagues" tab to view details, members, and contests.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
