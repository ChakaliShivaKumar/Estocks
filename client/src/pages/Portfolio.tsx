import { PortfolioHoldingCard, type PortfolioHolding } from "@/components/PortfolioHoldingCard";
import { ROIIndicator } from "@/components/ROIIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Briefcase, Plus } from "lucide-react";

const mockHoldings: PortfolioHolding[] = [
  {
    symbol: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    quantity: 5,
    avgPrice: 2400.00,
    currentPrice: 2456.75,
    currentValue: 12283.75,
    plAmount: 283.75,
    plPercent: 2.36,
  },
  {
    symbol: "TCS",
    companyName: "Tata Consultancy Services",
    quantity: 10,
    avgPrice: 3420.00,
    currentPrice: 3567.80,
    currentValue: 35678,
    plAmount: 1478,
    plPercent: 4.32,
  },
  {
    symbol: "INFY",
    companyName: "Infosys Limited",
    quantity: 15,
    avgPrice: 1450.00,
    currentPrice: 1432.60,
    currentValue: 21489,
    plAmount: -261,
    plPercent: -1.20,
  },
];

export default function Portfolio() {
  const hasHoldings = mockHoldings.length > 0;
  const totalInvested = mockHoldings.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
  const totalCurrent = mockHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalROI = (totalPL / totalInvested) * 100;

  if (!hasHoldings) {
    return (
      <div className="flex flex-col h-full justify-center">
        <EmptyState
          icon={Briefcase}
          title="No Portfolio Yet"
          description="Create your first portfolio by selecting stocks from the market to start competing in contests."
          actionLabel="Browse Stocks"
          onAction={() => console.log("Navigate to market")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">My Portfolio</h1>
          <Button size="icon" data-testid="button-add-portfolio">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-2xl font-bold tabular-nums" data-testid="text-portfolio-value">
                ₹{totalCurrent.toLocaleString()}
              </div>
            </div>
            <ROIIndicator roi={totalROI} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <div className="text-xs text-muted-foreground">Invested</div>
              <div className="text-sm font-semibold tabular-nums">
                ₹{totalInvested.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">P/L</div>
              <div className={`text-sm font-semibold tabular-nums ${totalPL >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {totalPL >= 0 ? '+' : ''}₹{totalPL.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <h2 className="text-lg font-semibold mb-4">Holdings</h2>
        <div className="flex flex-col gap-3">
          {mockHoldings.map((holding) => (
            <PortfolioHoldingCard key={holding.symbol} holding={holding} />
          ))}
        </div>
      </div>
    </div>
  );
}
