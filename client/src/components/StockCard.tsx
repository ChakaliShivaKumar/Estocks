import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RealTimeStockPrice } from "./RealTimeStockPrice";

export interface Stock {
  symbol: string;
  companyName: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

interface StockCardProps {
  stock: Stock;
  selected?: boolean;
  onToggle?: (symbol: string, amount?: number) => void;
  allocatedAmount?: number;
  onAmountChange?: (symbol: string, amount: number) => void;
  maxAmount?: number;
}

export function StockCard({ 
  stock, 
  selected = false, 
  onToggle, 
  allocatedAmount = 0, 
  onAmountChange, 
  maxAmount = 100 
}: StockCardProps) {
  const isPositive = stock.priceChange >= 0;

  const handleAmountChange = (newAmount: number) => {
    const clampedAmount = Math.max(0, Math.min(newAmount, maxAmount));
    onAmountChange?.(stock.symbol, clampedAmount);
  };

  const handleInputChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    onAmountChange?.(stock.symbol, Math.max(0, Math.min(numValue, maxAmount)));
  };

  return (
    <Card
      className={`p-4 hover-elevate active-elevate-2 ${
        selected ? "border-primary" : ""
      }`}
      data-testid={`card-stock-${stock.symbol}`}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle?.(stock.symbol)}
          data-testid={`checkbox-stock-${stock.symbol}`}
        />

        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-foreground font-bold text-sm flex-shrink-0">
          {stock.symbol.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground">{stock.symbol}</div>
          <div className="text-xs text-muted-foreground truncate">
            {stock.companyName}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <RealTimeStockPrice 
            symbol={stock.symbol}
            showChange={true}
            showIndicator={true}
            className="flex-col items-end"
          />
        </div>
      </div>

      {selected && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Coins:
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAmountChange(allocatedAmount - 5)}
                disabled={allocatedAmount <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                value={allocatedAmount.toString()}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-16 h-8 text-center"
                min="0"
                max={maxAmount}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleAmountChange(allocatedAmount + 5)}
                disabled={allocatedAmount >= maxAmount}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground ml-auto">
              Max: {maxAmount}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
