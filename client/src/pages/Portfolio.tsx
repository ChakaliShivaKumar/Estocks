import { PortfolioHoldingCard, type PortfolioHolding } from "@/components/PortfolioHoldingCard";
import { ROIIndicator } from "@/components/ROIIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { PortfolioAnalyticsDashboard } from "@/components/PortfolioAnalyticsDashboard";
import { Briefcase, Plus, ArrowLeft, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useContest } from "@/contexts/ContestContext";
import { useLocation } from "wouter";
import { useStockPrices } from "@/hooks/useStockPrices";
import { LivePriceIndicator } from "@/components/RealTimeStockPrice";

export default function Portfolio() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<{
    totalInvested: number;
    currentValue: number;
  } | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { calculatePortfolioValue } = useStockPrices();

  const { user } = useAuth();
  const { selectedContest } = useContest();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user || !selectedContest) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${user.id}/contests/${selectedContest.id}/portfolio`, {
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
  }, [user, selectedContest]);

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

  if (!selectedContest) {
    return (
      <div className="flex flex-col h-full justify-center">
        <EmptyState
          icon={Briefcase}
          title="No Contest Selected"
          description="Please join a contest first to view your portfolio."
          actionLabel="Browse Contests"
          onAction={() => setLocation('/contests')}
        />
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
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/contests')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">My Portfolio</h1>
              <p className="text-sm text-muted-foreground">Contest: {selectedContest.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LivePriceIndicator />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            <Button size="icon" data-testid="button-add-portfolio">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

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
