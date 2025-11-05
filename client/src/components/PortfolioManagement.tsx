import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, 
  Edit, 
  Trash2, 
  Copy, 
  Plus,
  CheckCircle2,
  X,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocation } from "wouter";

interface SavedPortfolio {
  id: string;
  name: string;
  description: string | null;
  holdings: Array<{ stockSymbol: string; coinsInvested: number }>;
  totalCoins: number;
  createdAt: string;
  updatedAt: string;
}

export function PortfolioManagement() {
  const { user } = useAuth();
  const { setSelectedPortfolio } = useContest();
  const [, setLocation] = useLocation();
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<SavedPortfolio | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (user) {
      fetchPortfolios();
      
      // Refresh portfolios every 10 seconds
      const interval = setInterval(fetchPortfolios, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPortfolios = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/portfolios', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolios');
      }
      const data = await response.json();
      setPortfolios(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }

      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete portfolio');
    }
  };

  const handleEdit = (portfolio: SavedPortfolio) => {
    setEditingPortfolio(portfolio);
    setEditName(portfolio.name);
    setEditDescription(portfolio.description || "");
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPortfolio || !editName.trim()) return;

    try {
      const response = await fetch(`/api/portfolios/${editingPortfolio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update portfolio');
      }

      await fetchPortfolios();
      setShowEditDialog(false);
      setEditingPortfolio(null);
      setEditName("");
      setEditDescription("");
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update portfolio');
    }
  };

  const handleUsePortfolio = (portfolio: SavedPortfolio) => {
    setSelectedPortfolio(portfolio.holdings.map(h => ({
      stockSymbol: h.stockSymbol,
      coinsInvested: h.coinsInvested
    })));
    setLocation('/contests');
  };

  const handleClone = async (portfolio: SavedPortfolio) => {
    try {
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `${portfolio.name} (Copy)`,
          description: portfolio.description,
          portfolio: portfolio.holdings,
          totalCoins: portfolio.totalCoins,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to clone portfolio');
      }

      await fetchPortfolios();
      alert('Portfolio cloned successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clone portfolio');
    }
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Please log in to manage your portfolios</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Portfolios</h2>
          <p className="text-sm text-muted-foreground">
            Manage your saved portfolios
          </p>
        </div>
        <Button onClick={() => setLocation('/market')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {portfolios.length === 0 ? (
        <Card className="p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-1">No Saved Portfolios</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create and save portfolios from the Market page to reuse them in contests
          </p>
          <Button onClick={() => setLocation('/market')}>
            Go to Market
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{portfolio.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {portfolio.holdings.length} stocks
                    </Badge>
                  </div>
                  {portfolio.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {portfolio.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{portfolio.totalCoins} coins</span>
                    <span>•</span>
                    <span>Updated {new Date(portfolio.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUsePortfolio(portfolio)}
                    className="h-8 w-8"
                    title="Use this portfolio"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(portfolio)}
                    className="h-8 w-8"
                    title="Edit portfolio"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClone(portfolio)}
                    className="h-8 w-8"
                    title="Clone portfolio"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(portfolio.id)}
                    className="h-8 w-8 text-destructive"
                    title="Delete portfolio"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Portfolio Holdings Preview */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {portfolio.holdings.slice(0, 5).map((holding) => (
                    <Badge key={holding.stockSymbol} variant="secondary" className="text-xs">
                      {holding.stockSymbol}: {holding.coinsInvested} coins
                    </Badge>
                  ))}
                  {portfolio.holdings.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{portfolio.holdings.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
            <DialogDescription>
              Update the name and description of your portfolio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Portfolio Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Portfolio name"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe your portfolio strategy..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingPortfolio(null);
                setEditName("");
                setEditDescription("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editName.trim()}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

