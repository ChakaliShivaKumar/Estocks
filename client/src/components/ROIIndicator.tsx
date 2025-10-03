import { TrendingUp, TrendingDown } from "lucide-react";

interface ROIIndicatorProps {
  roi: number;
  size?: "sm" | "md" | "lg";
}

export function ROIIndicator({ roi, size = "md" }: ROIIndicatorProps) {
  const isPositive = roi >= 0;
  
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={`flex items-center gap-2 ${
        isPositive ? "text-primary" : "text-destructive"
      }`}
    >
      {isPositive ? (
        <TrendingUp className={iconSizes[size]} />
      ) : (
        <TrendingDown className={iconSizes[size]} />
      )}
      <span className={`font-bold tabular-nums ${sizeClasses[size]}`} data-testid="text-roi">
        {isPositive ? "+" : ""}
        {roi.toFixed(2)}%
      </span>
    </div>
  );
}
