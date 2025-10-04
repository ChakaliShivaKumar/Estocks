import { SearchBar } from "@/components/SearchBar";
import { StockCard, type Stock } from "@/components/StockCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { TrendingUp, Filter, Coins, ArrowRight, ArrowLeft } from "lucide-react";
import { useContest } from "@/contexts/ContestContext";
import { useLocation } from "wouter";
import { LivePriceIndicator } from "@/components/RealTimeStockPrice";

export default function Market() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<Map<string, number>>(new Map());
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contestBudget = 100; // Fixed budget for all players
  const { selectedContest, setSelectedPortfolio, clearSelection } = useContest();
  const [, setLocation] = useLocation();
  
  // Calculate total coins allocated
  const totalAllocated = Array.from(selectedStocks.values()).reduce((sum, amount) => sum + amount, 0);
  const remainingBudget = contestBudget - totalAllocated;

  // Fetch stocks from API
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stocks');
        if (!response.ok) {
          throw new Error('Failed to fetch stocks');
        }
        const stocksData = await response.json();
        
        // Transform database format to frontend format
        const transformedStocks: Stock[] = stocksData.map((stock: any) => ({
          symbol: stock.symbol,
          companyName: stock.companyName,
          currentPrice: parseFloat(stock.currentPrice),
          priceChange: parseFloat(stock.priceChange),
          priceChangePercent: parseFloat(stock.priceChangePercent)
        }));
        
        setStocks(transformedStocks);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stocks');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStock = (symbol: string, amount?: number) => {
    const newSelected = new Map(selectedStocks);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      // Default allocation of 10 coins when first selected
      newSelected.set(symbol, amount || 10);
    }
    setSelectedStocks(newSelected);
    
    // Clear any existing contest selection when user modifies portfolio
    if (selectedContest) {
      clearSelection();
    }
    
    console.log("Selected stocks:", Array.from(newSelected.entries()));
  };

  const handleAmountChange = (symbol: string, amount: number) => {
    const newSelected = new Map(selectedStocks);
    if (amount <= 0) {
      newSelected.delete(symbol);
    } else {
      newSelected.set(symbol, Math.min(amount, remainingBudget + (selectedStocks.get(symbol) || 0)));
    }
    setSelectedStocks(newSelected);
    
    // Clear any existing contest selection when user modifies portfolio
    if (selectedContest) {
      clearSelection();
    }
  };

  const handleCreatePortfolio = () => {
    if (totalAllocated !== contestBudget) {
      return; // Button should be disabled if not fully allocated
    }

    // Convert selected stocks to portfolio format
    const portfolio = Array.from(selectedStocks.entries()).map(([symbol, coinsInvested]) => ({
      stockSymbol: symbol,
      coinsInvested
    }));

    // Save portfolio to context
    setSelectedPortfolio(portfolio);
    
    // Navigate to contests page
    setLocation('/contests');
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Stock Market</h1>
          </div>
          <div className="flex items-center gap-3">
            <LivePriceIndicator />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <Coins className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {remainingBudget} / {contestBudget}
              </span>
            </div>
            <Button variant="ghost" size="icon" data-testid="button-filter">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <SearchBar
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {totalAllocated === 0 && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h3 className="font-semibold text-primary mb-1">Contest Rules</h3>
            <p className="text-sm text-muted-foreground">
              You have <strong>100 coins</strong> to invest across any stocks. Select stocks and allocate coins to create your portfolio. Ranking will be based on ROI% at contest end.
            </p>
          </div>
        )}

        {selectedContest && (
          <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <h3 className="font-semibold text-orange-600 mb-1">Portfolio Modified</h3>
            <p className="text-sm text-muted-foreground">
              You've modified your portfolio. Complete your allocation to create a new portfolio for contests.
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {searchQuery ? "Search Results" : "Available Stocks"}
          </h2>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading stocks...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-2">Error loading stocks</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="flex flex-col gap-3">
              {filteredStocks.map((stock) => (
                <StockCard
                  key={stock.symbol}
                  stock={stock}
                  selected={selectedStocks.has(stock.symbol)}
                  onToggle={handleToggleStock}
                  allocatedAmount={selectedStocks.get(stock.symbol)}
                  onAmountChange={handleAmountChange}
                  maxAmount={remainingBudget + (selectedStocks.get(stock.symbol) || 0)}
                />
              ))}
            </div>

            {filteredStocks.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                No stocks found matching "{searchQuery}"
              </div>
            )}
          </>
        )}
      </div>

      {selectedStocks.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              {selectedStocks.size} stocks selected
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={totalAllocated === contestBudget ? "default" : "outline"}>
                {totalAllocated} / {contestBudget} coins
              </Badge>
            </div>
          </div>
          <Button 
            className="w-full" 
            data-testid="button-create-portfolio"
            disabled={totalAllocated !== contestBudget}
            onClick={handleCreatePortfolio}
          >
            {totalAllocated === contestBudget 
              ? (
                <>
                  Create Portfolio & Browse Contests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )
              : `Allocate ${contestBudget - totalAllocated} more coins`
            }
          </Button>
        </div>
      )}
    </div>
  );
}
