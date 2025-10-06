import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Trophy, 
  Clock, 
  Check, 
  X, 
  UserPlus,
  Send,
  Calendar
} from "lucide-react";

interface ContestInvitation {
  id: string;
  contestId: string;
  inviterId: string;
  inviteeId: string;
  message?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contest: {
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
  };
  inviter?: {
    id: string;
    username: string;
    fullName?: string;
  };
  invitee?: {
    id: string;
    username: string;
    fullName?: string;
  };
}

export function ContestInvitations() {
  const { user } = useAuth();
  const [receivedInvitations, setReceivedInvitations] = useState<ContestInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<ContestInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [receivedResponse, sentResponse] = await Promise.all([
        fetch(`/api/users/${user.id}/contest-invitations`, { credentials: 'include' }),
        fetch(`/api/users/${user.id}/sent-contest-invitations`, { credentials: 'include' })
      ]);

      if (!receivedResponse.ok || !sentResponse.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const [receivedData, sentData] = await Promise.all([
        receivedResponse.json(),
        sentResponse.json()
      ]);

      setReceivedInvitations(receivedData);
      setSentInvitations(sentData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/contest-invitations/${invitationId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      setReceivedInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'accepted' }
            : inv
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/contest-invitations/${invitationId}/decline`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to decline invitation');
      }

      setReceivedInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'declined' }
            : inv
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline invitation');
    }
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading invitations...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Contest Invitations</h3>
        <p className="text-muted-foreground">Manage your contest invitations</p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Received ({receivedInvitations.filter(inv => inv.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Sent ({sentInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedInvitations.length === 0 ? (
            <Card className="p-8 text-center">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Invitations</h3>
              <p className="text-muted-foreground">
                You haven't received any contest invitations yet
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedInvitations.map((invitation) => (
                <Card key={invitation.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{invitation.contest.name}</h4>
                        <Badge className={getStatusColor(invitation.status)}>
                          {invitation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Invited by {invitation.inviter?.fullName || invitation.inviter?.username}
                      </p>
                      {invitation.message && (
                        <p className="text-sm bg-muted p-2 rounded-md mb-3">
                          "{invitation.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Entry Fee</div>
                        <div className="font-semibold">{invitation.contest.entryFee} coins</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Prize Pool</div>
                        <div className="font-semibold">{invitation.contest.prizePool} coins</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Max Participants</div>
                        <div className="font-semibold">{invitation.contest.maxParticipants}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Ends</div>
                        <div className="font-semibold text-sm">{formatDate(invitation.contest.endTime)}</div>
                      </div>
                    </div>
                  </div>

                  {invitation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentInvitations.length === 0 ? (
            <Card className="p-8 text-center">
              <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Sent Invitations</h3>
              <p className="text-muted-foreground">
                You haven't sent any contest invitations yet
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentInvitations.map((invitation) => (
                <Card key={invitation.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{invitation.contest.name}</h4>
                        <Badge className={getStatusColor(invitation.status)}>
                          {invitation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Invited {invitation.invitee?.fullName || invitation.invitee?.username}
                      </p>
                      {invitation.message && (
                        <p className="text-sm bg-muted p-2 rounded-md mb-3">
                          "{invitation.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Entry Fee</div>
                        <div className="font-semibold">{invitation.contest.entryFee} coins</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Prize Pool</div>
                        <div className="font-semibold">{invitation.contest.prizePool} coins</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Max Participants</div>
                        <div className="font-semibold">{invitation.contest.maxParticipants}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Ends</div>
                        <div className="font-semibold text-sm">{formatDate(invitation.contest.endTime)}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
