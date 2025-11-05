import { PortfolioHoldingCard, type PortfolioHolding } from "@/components/PortfolioHoldingCard";
import { ROIIndicator } from "@/components/ROIIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PortfolioAnalyticsDashboard } from "@/components/PortfolioAnalyticsDashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, ArrowLeft, BarChart3, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { useLocation } from "wouter";
import { useStockPrices } from "@/hooks/useStockPrices";
import { LivePriceIndicator } from "@/components/RealTimeStockPrice";
import { Badge } from "@/components/ui/badge";

interface ContestEntry {
  id: string;
  contest: {
    id: string;
    name: string;
    description: string | null;
    entryFee: number;
    prizePool: number;
    maxParticipants: number;
    startTime: string;
    endTime: string;
    status: string;
    featured: boolean;
  };
  totalCoinsInvested: number;
  finalPortfolioValue: string | null;
  roi: string | null;
  rank: number | null;
  createdAt: string;
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<{
    totalInvested: number;
    currentValue: number;
  } | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [contestEntries, setContestEntries] = useState<ContestEntry[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedContestEntry, setSelectedContestEntry] = useState<ContestEntry | null>(null);
  const { calculatePortfolioValue } = useStockPrices();

  const { user } = useAuth();
  const { selectedContest, setSelectedContest } = useContest();
  const [, setLocation] = useLocation();

  // Fetch all user's contest entries
  useEffect(() => {
    const fetchContestEntries = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/users/${user.id}/contests`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contest entries');
        }
        
        const data = await response.json();
        
        // Validate data structure
        if (!Array.isArray(data)) {
          console.error('Invalid data format:', data);
          setContestEntries([]);
          return;
        }
        
        // Transform API response to ContestEntry format
        // API returns: { id, name, ..., entryId, ... }
        // We need: { id: entryId, contest: { id, name, ... }, ... }
        const transformedEntries: ContestEntry[] = data
          .filter((e: any) => 
            e && 
            e.id && // contest id
            e.entryId && // entry id
            e.status !== undefined
          )
          .map((e: any) => ({
            id: e.entryId,
            contest: {
              id: e.id,
              name: e.name,
              description: e.description,
              entryFee: e.entryFee,
              prizePool: e.prizePool,
              maxParticipants: e.maxParticipants,
              startTime: e.startTime,
              endTime: e.endTime,
              status: e.status,
              featured: e.featured || false,
            },
            totalCoinsInvested: e.totalCoinsInvested,
            finalPortfolioValue: e.finalPortfolioValue,
            roi: e.roi,
            rank: e.rank,
            createdAt: e.joinedAt || e.createdAt || new Date().toISOString(),
          }));
        
        setContestEntries(transformedEntries);
        
        // If we have a selected contest from context, use it
        // Otherwise, use the first active contest entry
        if (selectedContest && selectedContest.id && transformedEntries.length > 0) {
          const entry = transformedEntries.find((e: ContestEntry) => e.contest.id === selectedContest.id);
          if (entry && entry.contest) {
            setSelectedContestId(entry.contest.id);
            setSelectedContestEntry(entry);
            return;
          }
        }
        
        if (transformedEntries.length > 0) {
          // Default to first active contest, or first contest if none active
          const activeEntry = transformedEntries.find((e: ContestEntry) => e.contest && e.contest.status === 'active');
          const entryToUse = activeEntry || transformedEntries[0];
          
          if (entryToUse && entryToUse.contest && entryToUse.contest.id) {
            setSelectedContestId(entryToUse.contest.id);
            setSelectedContestEntry(entryToUse);
          }
        }
      } catch (err) {
        console.error('Error fetching contest entries:', err);
        setContestEntries([]);
      }
    };

    fetchContestEntries();
  }, [user, selectedContest]);

  // Fetch portfolio for selected contest
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user || !selectedContestId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${user.id}/contests/${selectedContestId}/portfolio`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio');
        }
        const data = await response.json();
        
        // Transform API data to match component expectations
        const transformedHoldings: PortfolioHolding[] = data.holdings.map((holding: any) => ({
          symbol: holding.symbol,
          companyName: holding.companyName,
          quantity: holding.quantity,
          avgPrice: holding.avgPrice,
          currentPrice: holding.currentPrice,
          currentValue: holding.currentValue,
          plAmount: holding.plAmount,
          plPercent: holding.plPercent,
          coinsInvested: holding.coinsInvested
        }));

        setHoldings(transformedHoldings);
        setPortfolioData({
          totalInvested: data.totalInvested,
          currentValue: data.currentValue
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user, selectedContestId]);

  // Real-time portfolio value calculation
  useEffect(() => {
    const updatePortfolioValue = async () => {
      if (holdings.length === 0) return;

      try {
        const holdingsForCalculation = holdings.map(holding => ({
          symbol: holding.symbol,
          shares: holding.quantity
        }));

        const realTimeValue = await calculatePortfolioValue(holdingsForCalculation);
        
        setPortfolioData(prev => ({
          totalInvested: prev?.totalInvested || 0,
          currentValue: realTimeValue.totalValue
        }));
      } catch (error) {
        console.error('Error calculating real-time portfolio value:', error);
      }
    };

    updatePortfolioValue();
  }, [holdings, calculatePortfolioValue]);

  const hasHoldings = holdings.length > 0;
  const contestBudget = 100;
  const totalInvested = portfolioData?.totalInvested || 0;
  const totalCurrent = portfolioData?.currentValue || 0;
  const totalPL = totalCurrent - totalInvested;
  const totalROI = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const handleContestChange = (contestId: string) => {
    const entry = contestEntries.find(e => e.contest.id === contestId);
    if (entry) {
      setSelectedContestId(contestId);
      setSelectedContestEntry(entry);
      // Update context
      setSelectedContest({
        id: entry.contest.id,
        name: entry.contest.name,
        description: entry.contest.description || undefined,
        entryFee: entry.contest.entryFee,
        prizePool: entry.contest.prizePool,
        participants: 0,
        maxParticipants: entry.contest.maxParticipants,
        timeRemaining: "",
        featured: entry.contest.featured,
      });
    }
  };

  // Show empty state if no contest entries
  if (contestEntries.length === 0 && !loading) {
    return (
      <div className="flex flex-col h-full justify-center">
        <EmptyState
          icon={Briefcase}
          title="No Contest Entries"
          description="Join a contest first to view your portfolio."
          actionLabel="Browse Contests"
          onAction={() => setLocation('/contests')}
        />
      </div>
    );
  }

  // Show loading while fetching contest entries
  if (contestEntries.length === 0 && loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground">Loading portfolios...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-muted-foreground">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="text-red-500 mb-2">Error loading portfolio</div>
        <div className="text-sm text-muted-foreground">{error}</div>
      </div>
    );
  }

  if (!hasHoldings) {
    return (
      <div className="flex flex-col h-full justify-center">
        <EmptyState
          icon={Briefcase}
          title="No Portfolio Yet"
          description="Create your first portfolio by selecting stocks from the market to start competing in contests."
          actionLabel="Browse Stocks"
          onAction={() => setLocation('/market')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/contests')}
              className="h-8 w-8 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">My Portfolio</h1>
              {/* Contest Selector */}
              {contestEntries.length > 1 && (
                <Select
                  value={selectedContestId || ""}
                  onValueChange={handleContestChange}
                >
                  <SelectTrigger className="w-full mt-1 h-8 text-sm">
                    <SelectValue>
                      {selectedContestEntry ? (
                        <div className="flex items-center gap-2">
                          <Trophy className="h-3 w-3" />
                          <span className="truncate">{selectedContestEntry.contest.name}</span>
                          {selectedContestEntry.contest.status === 'active' && (
                            <Badge variant="default" className="text-xs ml-1">Active</Badge>
                          )}
                        </div>
                      ) : (
                        "Select Contest"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {contestEntries.map((entry) => (
                      <SelectItem key={entry.contest.id} value={entry.contest.id}>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-3 w-3" />
                          <span>{entry.contest.name}</span>
                          {entry.contest.status === 'active' && (
                            <Badge variant="default" className="text-xs ml-1">Active</Badge>
                          )}
                          {entry.rank && (
                            <Badge variant="outline" className="text-xs ml-1">Rank #{entry.rank}</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {contestEntries.length === 1 && selectedContestEntry && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedContestEntry.contest.name}
                  {selectedContestEntry.rank && ` • Rank #${selectedContestEntry.rank}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LivePriceIndicator />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showAnalytics ? "Hide" : "Analytics"}
            </Button>
          </div>
        </div>

        {/* Contest Info Banner */}
        {selectedContestEntry && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={selectedContestEntry.contest.status === 'active' ? 'default' : 'secondary'}>
                  {selectedContestEntry.contest.status}
                </Badge>
                {selectedContestEntry.rank && (
                  <Badge variant="outline">
                    Rank #{selectedContestEntry.rank}
                  </Badge>
                )}
                {selectedContestEntry.roi && (
                  <Badge variant={parseFloat(selectedContestEntry.roi) >= 0 ? 'default' : 'destructive'}>
                    ROI: {parseFloat(selectedContestEntry.roi) >= 0 ? '+' : ''}{parseFloat(selectedContestEntry.roi).toFixed(2)}%
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/contests/${selectedContestEntry.contest.id}`)}
                className="text-xs"
              >
                View Contest
              </Button>
            </div>
            {selectedContestEntry.contest.description && (
              <p className="text-xs text-muted-foreground">
                {selectedContestEntry.contest.description}
              </p>
            )}
          </div>
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Portfolio Value</div>
              <div className="text-2xl font-bold tabular-nums" data-testid="text-portfolio-value">
                {totalCurrent.toFixed(2)} coins
              </div>
            </div>
            <ROIIndicator roi={totalROI} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <div className="text-xs text-muted-foreground">Invested</div>
              <div className="text-sm font-semibold tabular-nums">
                {totalInvested} coins
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">P&L</div>
              <div className={`text-sm font-semibold tabular-nums ${
                totalPL >= 0 ? "text-primary" : "text-destructive"
              }`}>
                {totalPL >= 0 ? "+" : ""}{totalPL.toFixed(2)} coins
              </div>
            </div>
          </div>
        </Card>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {showAnalytics ? (
          <PortfolioAnalyticsDashboard />
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">Holdings</h2>
            <div className="flex flex-col gap-3">
              {holdings.map((holding) => (
                <PortfolioHoldingCard key={holding.symbol} holding={holding} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
