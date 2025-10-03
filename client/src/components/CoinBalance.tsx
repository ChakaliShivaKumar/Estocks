import { Coins } from "lucide-react";

interface CoinBalanceProps {
  balance: number;
}

export function CoinBalance({ balance }: CoinBalanceProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
      <Coins className="h-4 w-4 text-primary" />
      <span className="text-sm font-bold tabular-nums text-foreground" data-testid="text-coin-balance">
        {balance.toLocaleString()}
      </span>
    </div>
  );
}
