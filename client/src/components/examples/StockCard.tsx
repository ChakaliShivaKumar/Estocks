import { StockCard } from "../StockCard";
import { useState } from "react";

export default function StockCardExample() {
  const [selected, setSelected] = useState(false);

  const stock = {
    symbol: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    currentPrice: 2456.75,
    priceChange: 34.25,
    priceChangePercent: 1.42,
  };

  return (
    <div className="p-4 max-w-md">
      <StockCard
        stock={stock}
        selected={selected}
        onToggle={() => setSelected(!selected)}
      />
    </div>
  );
}
