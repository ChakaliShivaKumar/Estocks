// Mock data for quick API setup
export const mockStocks = [
  { symbol: "RELIANCE", companyName: "Reliance Industries Ltd", currentPrice: 2456.75, priceChange: 34.25, priceChangePercent: 1.42, sector: "Energy" },
  { symbol: "TCS", companyName: "Tata Consultancy Services", currentPrice: 3567.80, priceChange: -12.50, priceChangePercent: -0.35, sector: "IT" },
  { symbol: "INFY", companyName: "Infosys Limited", currentPrice: 1432.60, priceChange: 18.90, priceChangePercent: 1.34, sector: "IT" },
  { symbol: "HDFCBANK", companyName: "HDFC Bank Limited", currentPrice: 1678.45, priceChange: 23.10, priceChangePercent: 1.39, sector: "Banking" },
  { symbol: "WIPRO", companyName: "Wipro Limited", currentPrice: 456.30, priceChange: -5.20, priceChangePercent: -1.13, sector: "IT" },
  { symbol: "TATAMOTORS", companyName: "Tata Motors Limited", currentPrice: 789.50, priceChange: 12.75, priceChangePercent: 1.64, sector: "Auto" },
];

export const mockContests = [
  {
    id: "1",
    name: "Daily Tech Titans",
    entryFee: 500,
    prizePool: 50000,
    participants: 847,
    maxParticipants: 1000,
    startTime: new Date(),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    status: "active",
    description: "Focus on IT & Technology stocks. 100 coins budget."
  }
];

export const mockUsers = [
  { id: "1", username: "TraderPro", email: "trader@example.com", coinsBalance: 15000 }
];