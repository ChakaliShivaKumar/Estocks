import { SearchBar } from "@/components/SearchBar";
import { StockCard, type Stock } from "@/components/StockCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  Filter, 
  Coins, 
  ArrowRight, 
  ArrowLeft,
  X,
  CheckCircle2,
  BarChart3,
  Sparkles,
  SlidersHorizontal
} from "lucide-react";
import { useContest } from "@/contexts/ContestContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LivePriceIndicator } from "@/components/RealTimeStockPrice";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Market() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<Map<string, number>>(new Map());
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change' | 'changePercent'>('name');
  const [showPortfolioPreview, setShowPortfolioPreview] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  
  const contestBudget = 100; // Fixed budget for all players
  const { selectedContest, setSelectedPortfolio, clearSelection } = useContest();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Calculate total coins allocated
  const totalAllocated = Array.from(selectedStocks.values()).reduce((sum, amount) => sum + amount, 0);
  const remainingBudget = contestBudget - totalAllocated;
  const budgetPercentage = (totalAllocated / contestBudget) * 100;
  const isBudgetComplete = totalAllocated === contestBudget;

  // Fetch stocks from API
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stocks', { credentials: 'include' });
        if (!response.ok) {
          throw new Error('Failed to fetch stocks');
        }
        const stocksData = await response.json();
        
        // Transform database format to frontend format
        const transformedStocks: Stock[] = stocksData.map((stock: any) => ({
          symbol: stock.symbol,
          companyName: stock.companyName,
          currentPrice: typeof stock.currentPrice === 'number' ? stock.currentPrice : parseFloat(stock.currentPrice || '0'),
          priceChange: typeof stock.priceChange === 'number' ? stock.priceChange : parseFloat(stock.priceChange || '0'),
          priceChangePercent: typeof stock.priceChangePercent === 'number' ? stock.priceChangePercent : parseFloat(stock.priceChangePercent || '0'),
          sector: stock.sector || 'Other',
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

  // Get unique sectors
  const sectors = useMemo(() => {
    const uniqueSectors = Array.from(new Set(stocks.map(s => s.sector || 'Other')));
    return uniqueSectors.sort();
  }, [stocks]);

  // Filter and sort stocks
  const filteredStocks = useMemo(() => {
    let filtered = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

    // Filter by sector
    if (selectedSector) {
      filtered = filtered.filter(stock => (stock.sector || 'Other') === selectedSector);
    }

    // Sort stocks
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.symbol.localeCompare(b.symbol);
        case 'price':
          return b.currentPrice - a.currentPrice;
        case 'change':
          return b.priceChange - a.priceChange;
        case 'changePercent':
          return b.priceChangePercent - a.priceChangePercent;
        default:
          return 0;
      }
    });

    return filtered;
  }, [stocks, searchQuery, selectedSector, sortBy]);

  // Top gainers and losers
  const topGainers = useMemo(() => {
    return [...stocks]
      .filter(s => s.priceChangePercent > 0)
      .sort((a, b) => b.priceChangePercent - a.priceChangePercent)
      .slice(0, 5);
  }, [stocks]);

  const topLosers = useMemo(() => {
    return [...stocks]
      .filter(s => s.priceChangePercent < 0)
      .sort((a, b) => a.priceChangePercent - b.priceChangePercent)
      .slice(0, 5);
  }, [stocks]);

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
      return;
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

  const handleSavePortfolio = async () => {
    if (!user || !portfolioName.trim() || totalAllocated !== contestBudget) {
      return;
    }

    try {
      setSavingPortfolio(true);
      
      // Convert selected stocks to portfolio format
      const portfolio = Array.from(selectedStocks.entries()).map(([symbol, coinsInvested]) => ({
        stockSymbol: symbol,
        coinsInvested
      }));

      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: portfolioName.trim(),
          description: portfolioDescription.trim() || null,
          portfolio,
          totalCoins: totalAllocated,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save portfolio');
      }

      // Close dialog and show success
      setShowSaveDialog(false);
      setPortfolioName("");
      setPortfolioDescription("");
      alert(`Portfolio "${portfolioName.trim()}" saved successfully!`);
      
      // Optionally navigate to contests or stay on market
    } catch (error) {
      console.error("Error saving portfolio:", error);
      alert(`Failed to save portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleAllocateEvenly = () => {
    if (selectedStocks.size === 0) return;
    const evenAmount = Math.floor(contestBudget / selectedStocks.size);
    const remainder = contestBudget - (evenAmount * selectedStocks.size);
    
    const newSelected = new Map(selectedStocks);
    let count = 0;
    selectedStocks.forEach((_, symbol) => {
      const amount = count < remainder ? evenAmount + 1 : evenAmount;
      newSelected.set(symbol, amount);
      count++;
    });
    setSelectedStocks(newSelected);
  };

  const handleClearAll = () => {
    setSelectedStocks(new Map());
    if (selectedContest) {
      clearSelection();
    }
  };

  // Portfolio preview data
  const portfolioPreview = useMemo(() => {
    const preview = Array.from(selectedStocks.entries())
      .map(([symbol, coins]) => {
        const stock = stocks.find(s => s.symbol === symbol);
        return {
          symbol,
          companyName: stock?.companyName || symbol,
          coins,
          percentage: (coins / totalAllocated) * 100,
        };
      })
      .sort((a, b) => b.coins - a.coins);
    
    return preview;
  }, [selectedStocks, stocks, totalAllocated]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Enhanced Header - Mobile First */}
      <header className="flex-shrink-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="p-4 space-y-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation('/')}
                className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
              <Logo size="sm" showText={false} />
              <h1 className="text-xl font-bold">Market</h1>
            </div>
            <div className="flex items-center gap-2">
              <LivePriceIndicator />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowFilters(!showFilters)}
                className={`h-9 w-9 ${showFilters ? 'bg-primary/10' : ''}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            placeholder="Search stocks by symbol or name..."
            value={searchQuery}
            onChange={setSearchQuery}
          />

          {/* Budget Indicator with Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
                <span className="font-semibold">Budget</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold tabular-nums ${isBudgetComplete ? 'text-green-500' : 'text-foreground'}`}>
                  {totalAllocated} / {contestBudget}
                </span>
                {isBudgetComplete && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <Progress 
              value={budgetPercentage} 
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedStocks.size} stocks selected</span>
              <span className={remainingBudget > 0 ? '' : 'text-green-500 font-medium'}>
                {remainingBudget > 0 ? `${remainingBudget} coins remaining` : 'Budget allocated!'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-card/50"
            >
              <div className="p-4 space-y-4">
                {/* Sector Filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Sector
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedSector === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSector(null)}
                      className="text-xs h-7"
                    >
                      All
                    </Button>
                    {sectors.map(sector => (
                      <Button
                        key={sector}
                        variant={selectedSector === sector ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSector(sector)}
                        className="text-xs h-7"
                      >
                        {sector}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Sort By
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'name', label: 'Name' },
                      { value: 'price', label: 'Price' },
                      { value: 'change', label: 'Change' },
                      { value: 'changePercent', label: '% Change' },
                    ].map(option => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortBy(option.value as any)}
                        className="text-xs h-7"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content - Mobile First */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Stats Banner */}
        {!searchQuery && !selectedSector && (
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border">
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Top Gainer</span>
                </div>
                {topGainers.length > 0 ? (
                  <div>
                    <p className="font-bold text-sm">{topGainers[0].symbol}</p>
                    <p className="text-xs text-green-500">+{topGainers[0].priceChangePercent.toFixed(2)}%</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </Card>
              <Card className="p-3 bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Top Loser</span>
                </div>
                {topLosers.length > 0 ? (
                  <div>
                    <p className="font-bold text-sm">{topLosers[0].symbol}</p>
                    <p className="text-xs text-red-500">{topLosers[0].priceChangePercent.toFixed(2)}%</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Contest Rules Banner */}
        {totalAllocated === 0 && !loading && (
          <div className="p-4 bg-primary/10 border-b border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-primary mb-1">Contest Rules</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You have <strong className="text-primary">100 coins</strong> to invest across any stocks. 
                  Select stocks and allocate coins to create your portfolio. Ranking will be based on ROI% at contest end.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Modified Warning */}
        {selectedContest && (
          <div className="p-4 bg-orange-500/10 border-b border-orange-500/20">
            <div className="flex items-start gap-3">
              <X className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-orange-600 mb-1">Portfolio Modified</h3>
                <p className="text-xs text-muted-foreground">
              You've modified your portfolio. Complete your allocation to create a new portfolio for contests.
            </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Stocks List */}
        <div className="p-4 pb-24">
        {loading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading stocks...</div>
          </div>
        )}

        {error && (
            <Card className="p-6 text-center">
            <div className="text-red-500 mb-2">Error loading stocks</div>
            <div className="text-sm text-muted-foreground">{error}</div>
            </Card>
        )}

        {!loading && !error && (
          <>
              {filteredStocks.length === 0 ? (
                <Card className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-semibold mb-1">No stocks found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? `No stocks match "${searchQuery}"` : 'Try adjusting your filters'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredStocks.map((stock, index) => (
                    <motion.div
                      key={stock.symbol}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                    >
                <StockCard
                  stock={stock}
                  selected={selectedStocks.has(stock.symbol)}
                  onToggle={handleToggleStock}
                  allocatedAmount={selectedStocks.get(stock.symbol)}
                  onAmountChange={handleAmountChange}
                  maxAmount={remainingBudget + (selectedStocks.get(stock.symbol) || 0)}
                />
                    </motion.div>
              ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Enhanced Bottom Action Bar - Mobile First */}
      {selectedStocks.size > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg z-40"
        >
          <div className="p-4 space-y-3">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAllocateEvenly}
                className="flex-1 text-xs"
                disabled={selectedStocks.size === 0}
              >
                Allocate Evenly
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPortfolioPreview(true)}
                className="flex-1 text-xs"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearAll}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Portfolio Summary */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={isBudgetComplete ? "default" : "outline"} className="text-xs">
                  {selectedStocks.size} stocks
                </Badge>
                <span className="text-muted-foreground">
                {totalAllocated} / {contestBudget} coins
                </span>
              </div>
              {isBudgetComplete && (
                <Badge variant="default" className="bg-green-500 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
              </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {user && (
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!isBudgetComplete}
                  onClick={() => setShowSaveDialog(true)}
                >
                  Save Portfolio
                </Button>
              )}
          <Button 
                className="flex-1 h-11 font-semibold" 
            data-testid="button-create-portfolio"
                disabled={!isBudgetComplete}
            onClick={handleCreatePortfolio}
          >
                {isBudgetComplete ? (
                <>
                    Use & Browse Contests
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
                ) : (
                  `Allocate ${remainingBudget} more`
                )}
          </Button>
            </div>
        </div>
        </motion.div>
      )}

      {/* Portfolio Preview Modal */}
      <AnimatePresence>
        {showPortfolioPreview && selectedStocks.size > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowPortfolioPreview(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full bg-card rounded-t-3xl border-t border-border max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-8 overflow-y-auto max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Portfolio Preview</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedStocks.size} stocks • {totalAllocated} coins
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPortfolioPreview(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Portfolio Allocation */}
                <div className="space-y-3 mb-6">
                  {portfolioPreview.map((item, index) => (
                    <Card key={item.symbol} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{item.symbol}</p>
                          <p className="text-xs text-muted-foreground">{item.companyName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.coins} coins</p>
                          <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </Card>
                  ))}
                </div>

                {/* Summary */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Allocation</span>
                    <span className={`font-bold text-lg ${isBudgetComplete ? 'text-green-500' : 'text-primary'}`}>
                      {totalAllocated} / {contestBudget}
                    </span>
                  </div>
                  {!isBudgetComplete && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Allocate {remainingBudget} more coins to complete your portfolio
                    </p>
                  )}
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6">
                  {user && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={!isBudgetComplete}
                      onClick={() => {
                        setShowPortfolioPreview(false);
                        setShowSaveDialog(true);
                      }}
                    >
                      Save Portfolio
                    </Button>
                  )}
                  <Button
                    className="flex-1 h-11"
                    disabled={!isBudgetComplete}
                    onClick={() => {
                      setShowPortfolioPreview(false);
                      handleCreatePortfolio();
                    }}
                  >
                    {isBudgetComplete ? (
                      <>
                        Use & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Complete First'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Portfolio Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Portfolio</DialogTitle>
            <DialogDescription>
              Save this portfolio to reuse it later when joining contests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-name">Portfolio Name *</Label>
              <Input
                id="portfolio-name"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                placeholder="e.g., Tech Focus, Diversified Mix"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-description">Description (Optional)</Label>
              <Textarea
                id="portfolio-description"
                value={portfolioDescription}
                onChange={(e) => setPortfolioDescription(e.target.value)}
                placeholder="Describe your portfolio strategy..."
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedStocks.size} stocks • {totalAllocated} coins allocated
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setPortfolioName("");
                setPortfolioDescription("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePortfolio}
              disabled={!portfolioName.trim() || savingPortfolio || !isBudgetComplete}
              className="flex-1"
            >
              {savingPortfolio ? "Saving..." : "Save Portfolio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
