import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
  onToggle?: (symbol: string) => void;
}

export function StockCard({ stock, selected = false, onToggle }: StockCardProps) {
  const isPositive = stock.priceChange >= 0;

  return (
    <Card
      className={`p-4 cursor-pointer hover-elevate active-elevate-2 ${
        selected ? "border-primary" : ""
      }`}
      onClick={() => onToggle?.(stock.symbol)}
      data-testid={`card-stock-${stock.symbol}`}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle?.(stock.symbol)}
          onClick={(e) => e.stopPropagation()}
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
          <div className="font-bold tabular-nums" data-testid={`text-price-${stock.symbol}`}>
            ₹{stock.currentPrice.toFixed(2)}
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-medium tabular-nums ${
              isPositive ? "text-primary" : "text-destructive"
            }`}
            data-testid={`text-change-${stock.symbol}`}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? "+" : ""}
            {stock.priceChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </Card>
  );
}
