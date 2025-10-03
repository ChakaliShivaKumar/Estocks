import { PortfolioHoldingCard } from "../PortfolioHoldingCard";

export default function PortfolioHoldingCardExample() {
  const holding = {
    symbol: "TCS",
    companyName: "Tata Consultancy Services",
    quantity: 10,
    avgPrice: 3420.00,
    currentPrice: 3567.80,
    currentValue: 35678,
    plAmount: 1478,
    plPercent: 4.32,
  };

  return (
    <div className="p-4 max-w-md">
      <PortfolioHoldingCard holding={holding} />
    </div>
  );
}
