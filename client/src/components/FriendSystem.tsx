import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  UserX, 
  Search,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  level: number;
  experiencePoints: number;
}

interface FriendRequest {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  requester?: User;
  recipient?: User;
}

interface Friend extends User {
  friendshipDate: Date;
}

export function FriendSystem() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchFriendData();
    }
  }, [user?.id]);

  const fetchFriendData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        fetch(`/api/users/${user.id}/friends`, { credentials: 'include' }),
        fetch(`/api/users/${user.id}/friend-requests`, { credentials: 'include' }),
        fetch(`/api/users/${user.id}/sent-friend-requests`, { credentials: 'include' })
      ]);

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData);
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json();
        setFriendRequests(requestsData);
      }

      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setSentRequests(sentData);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friend data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/friend-request`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchFriendData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friend-requests/${requestId}/accept`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        fetchFriendData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setError('Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friend-requests/${requestId}/decline`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        fetchFriendData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      setError('Failed to decline friend request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const response = await fetch(`/api/users/${user?.id}/friends/${friendId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchFriendData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">Loading friend system...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-2">Error loading friend system</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button onClick={fetchFriendData} className="mt-4">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Friends</h1>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests ({friendRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sent ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredFriends.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No friends found' : 'No friends yet'}
              </h2>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start by sending friend requests to other traders!'
                }
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <Card key={friend.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.profilePicture} />
                        <AvatarFallback>
                          {friend.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{friend.username}</div>
                        <div className="text-sm text-muted-foreground">
                          Level {friend.level} • {friend.experiencePoints} XP
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Friends since {new Date(friend.friendshipDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-3">
          {friendRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Friend Requests</h2>
              <p className="text-muted-foreground">You don't have any pending friend requests.</p>
            </Card>
          ) : (
            friendRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.requester?.profilePicture} />
                      <AvatarFallback>
                        {request.requester?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{request.requester?.username}</div>
                      <div className="text-sm text-muted-foreground">
                        Level {request.requester?.level} • {request.requester?.experiencePoints} XP
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineRequest(request.id)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-3">
          {sentRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Sent Requests</h2>
              <p className="text-muted-foreground">You haven't sent any friend requests yet.</p>
            </Card>
          ) : (
            sentRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.recipient?.profilePicture} />
                      <AvatarFallback>
                        {request.recipient?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{request.recipient?.username}</div>
                      <div className="text-sm text-muted-foreground">
                        Level {request.recipient?.level} • {request.recipient?.experiencePoints} XP
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        request.status === 'accepted' ? 'default' :
                        request.status === 'declined' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {request.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'declined' && <XCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Search for Friends</h2>
            <p className="text-muted-foreground mb-4">
              Find other traders by username to send friend requests.
            </p>
            <div className="max-w-md mx-auto">
              <Input
                placeholder="Enter username..."
                className="mb-4"
              />
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search Users
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
