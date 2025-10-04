import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Coins,
  TrendingUp,
  Settings,
  Award
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Contest {
  id: string;
  name: string;
  description?: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  featured: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalContests: number;
  activeContests: number;
  upcomingContests: number;
  completedContests: number;
  totalStocks: number;
  totalPrizePool: number;
  recentContests: Contest[];
}

export default function Admin() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entryFee: 0,
    prizePool: 0,
    maxParticipants: 100,
    startTime: '',
    endTime: '',
    featured: false,
      status: 'upcoming' as 'upcoming' | 'active' | 'completed' | 'cancelled'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contestsRes, statsRes] = await Promise.all([
        fetch('/api/admin/contests', { credentials: 'include' }),
        fetch('/api/admin/dashboard', { credentials: 'include' })
      ]);

      if (!contestsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const [contestsData, statsData] = await Promise.all([
        contestsRes.json(),
        statsRes.json()
      ]);

      setContests(contestsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = async () => {
    try {
      const response = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contest');
      }

      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contest');
    }
  };

  const handleUpdateContest = async () => {
    if (!editingContest) return;

    try {
      const response = await fetch(`/api/admin/contests/${editingContest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update contest');
      }

      setIsEditDialogOpen(false);
      setEditingContest(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contest');
    }
  };

  const handleDeleteContest = async (contestId: string) => {
    if (!confirm('Are you sure you want to delete this contest?')) return;

    try {
      const response = await fetch(`/api/admin/contests/${contestId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete contest');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contest');
    }
  };

  const handleUpdateStatus = async (contestId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/contests/${contestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDistributePrizes = async (contestId: string) => {
    if (!confirm('Are you sure you want to distribute prizes for this contest?')) return;

    try {
      const response = await fetch(`/api/admin/contests/${contestId}/distribute-prizes`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to distribute prizes');
      }

      const result = await response.json();
      alert(`Prizes distributed successfully! ${result.results.length} winners received prizes.`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute prizes');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      entryFee: 0,
      prizePool: 0,
      maxParticipants: 100,
      startTime: '',
      endTime: '',
      featured: false,
      status: 'upcoming'
    });
  };

  const openEditDialog = (contest: Contest) => {
    setEditingContest(contest);
    setFormData({
      name: contest.name,
      description: contest.description || '',
      entryFee: contest.entryFee,
      prizePool: contest.prizePool,
      maxParticipants: contest.maxParticipants,
      startTime: new Date(contest.startTime).toISOString().slice(0, 16),
      endTime: new Date(contest.endTime).toISOString().slice(0, 16),
      featured: contest.featured,
      status: contest.status
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading admin panel</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={fetchData} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage contests and system settings</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Contest
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Contest</DialogTitle>
                <DialogDescription>
                  Create a new trading contest for users to participate in.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Contest Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Daily Tech Titans"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entryFee">Entry Fee (coins)</Label>
                    <Input
                      id="entryFee"
                      type="number"
                      value={formData.entryFee}
                      onChange={(e) => setFormData({...formData, entryFee: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the contest..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prizePool">Prize Pool (coins)</Label>
                    <Input
                      id="prizePool"
                      type="number"
                      value={formData.prizePool}
                      onChange={(e) => setFormData({...formData, prizePool: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value) || 100})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                  />
                  <Label htmlFor="featured">Featured Contest</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContest}>Create Contest</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalContests}</div>
                  <div className="text-sm text-muted-foreground">Total Contests</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.activeContests}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.upcomingContests}</div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalPrizePool}</div>
                  <div className="text-sm text-muted-foreground">Total Prize Pool</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Contests List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">All Contests</h2>
          {contests.map((contest) => (
            <Card key={contest.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{contest.name}</h3>
                    <Badge className={getStatusColor(contest.status)}>
                      {contest.status}
                    </Badge>
                    {contest.featured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {contest.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Entry: {contest.entryFee} coins</span>
                    <span>Prize: {contest.prizePool} coins</span>
                    <span>Max: {contest.maxParticipants} players</span>
                    <span>Start: {new Date(contest.startTime).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={contest.status}
                    onValueChange={(value) => handleUpdateStatus(contest.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {contest.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDistributePrizes(contest.id)}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Distribute Prizes
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(contest)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteContest(contest.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Contest</DialogTitle>
              <DialogDescription>
                Update contest details and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Contest Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-entryFee">Entry Fee (coins)</Label>
                  <Input
                    id="edit-entryFee"
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({...formData, entryFee: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-prizePool">Prize Pool (coins)</Label>
                  <Input
                    id="edit-prizePool"
                    type="number"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({...formData, prizePool: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-maxParticipants">Max Participants</Label>
                  <Input
                    id="edit-maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({...formData, maxParticipants: parseInt(e.target.value) || 100})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({...formData, featured: checked})}
                />
                <Label htmlFor="edit-featured">Featured Contest</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateContest}>Update Contest</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
