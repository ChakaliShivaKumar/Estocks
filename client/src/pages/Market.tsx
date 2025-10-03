import { SearchBar } from "@/components/SearchBar";
import { StockCard, type Stock } from "@/components/StockCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TrendingUp, Filter } from "lucide-react";

const mockStocks: Stock[] = [
  { symbol: "RELIANCE", companyName: "Reliance Industries Ltd", currentPrice: 2456.75, priceChange: 34.25, priceChangePercent: 1.42 },
  { symbol: "TCS", companyName: "Tata Consultancy Services", currentPrice: 3567.80, priceChange: -12.50, priceChangePercent: -0.35 },
  { symbol: "INFY", companyName: "Infosys Limited", currentPrice: 1432.60, priceChange: 18.90, priceChangePercent: 1.34 },
  { symbol: "HDFCBANK", companyName: "HDFC Bank Limited", currentPrice: 1678.45, priceChange: 23.10, priceChangePercent: 1.39 },
  { symbol: "WIPRO", companyName: "Wipro Limited", currentPrice: 456.30, priceChange: -5.20, priceChangePercent: -1.13 },
  { symbol: "TATAMOTORS", companyName: "Tata Motors Limited", currentPrice: 789.50, priceChange: 12.75, priceChangePercent: 1.64 },
];

export default function Market() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());

  const filteredStocks = mockStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStock = (symbol: string) => {
    const newSelected = new Set(selectedStocks);
    if (newSelected.has(symbol)) {
      newSelected.delete(symbol);
    } else {
      newSelected.add(symbol);
    }
    setSelectedStocks(newSelected);
    console.log("Selected stocks:", Array.from(newSelected));
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Stock Market</h1>
          <Button variant="ghost" size="icon" data-testid="button-filter">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
        <SearchBar
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            {searchQuery ? "Search Results" : "Trending Stocks"}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {filteredStocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              selected={selectedStocks.has(stock.symbol)}
              onToggle={handleToggleStock}
            />
          ))}
        </div>

        {filteredStocks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No stocks found matching "{searchQuery}"
          </div>
        )}
      </div>

      {selectedStocks.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-card border-t border-border">
          <Button className="w-full" data-testid="button-create-portfolio">
            Create Portfolio ({selectedStocks.size} stocks)
          </Button>
        </div>
      )}
    </div>
  );
}
