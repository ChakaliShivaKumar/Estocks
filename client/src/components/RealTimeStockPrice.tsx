import { useStockPrices } from "@/hooks/useStockPrices";
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RealTimeStockPriceProps {
  symbol: string;
  showChange?: boolean;
  showIndicator?: boolean;
  className?: string;
}

export function RealTimeStockPrice({ 
  symbol, 
  showChange = true, 
  showIndicator = true,
  className = "" 
}: RealTimeStockPriceProps) {
  const { getStockPrice, getPriceChangeIndicator, formatPriceChange, isConnected } = useStockPrices();
  
  const priceData = getStockPrice(symbol);
  
  if (!priceData) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <WifiOff className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const indicator = getPriceChangeIndicator(priceData.changePercent);
  
  const getIndicatorIcon = () => {
    switch (indicator) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (indicator) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected && (
        <Wifi className="h-3 w-3 text-green-500" />
      )}
      
      <span className="font-semibold">
        ${priceData.price.toFixed(2)}
      </span>
      
      {showChange && (
        <span className={`text-sm ${getChangeColor()}`}>
          {formatPriceChange(priceData.change, priceData.changePercent)}
        </span>
      )}
      
      {showIndicator && (
        <div className="flex items-center">
          {getIndicatorIcon()}
        </div>
      )}
    </div>
  );
}

interface StockPriceBadgeProps {
  symbol: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function StockPriceBadge({ symbol, variant = 'default' }: StockPriceBadgeProps) {
  const { getStockPrice, getPriceChangeIndicator } = useStockPrices();
  
  const priceData = getStockPrice(symbol);
  
  if (!priceData) {
    return <Badge variant="outline">Loading...</Badge>;
  }

  const indicator = getPriceChangeIndicator(priceData.changePercent);
  
  const getBadgeVariant = () => {
    switch (indicator) {
      case 'up':
        return 'default' as const;
      case 'down':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <Badge variant={getBadgeVariant()}>
      {symbol}: ${priceData.price.toFixed(2)}
    </Badge>
  );
}

interface LivePriceIndicatorProps {
  className?: string;
}

export function LivePriceIndicator({ className = "" }: LivePriceIndicatorProps) {
  const { isConnected } = useStockPrices();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600 font-medium">Live Prices</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600 font-medium">Offline</span>
        </>
      )}
    </div>
  );
}
