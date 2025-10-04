import { config } from "dotenv";
import { storage } from "./storage";

// Load environment variables
config();

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Initial stock data for Indian market
const initialStocks = [
  {
    symbol: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    sector: "Energy",
    currentPrice: "2456.75",
    priceChange: "34.25",
    priceChangePercent: "1.42",
    isActive: true,
  },
  {
    symbol: "TCS",
    companyName: "Tata Consultancy Services",
    sector: "IT",
    currentPrice: "3567.80",
    priceChange: "-12.50",
    priceChangePercent: "-0.35",
    isActive: true,
  },
  {
    symbol: "INFY",
    companyName: "Infosys Limited",
    sector: "IT",
    currentPrice: "1432.60",
    priceChange: "18.90",
    priceChangePercent: "1.34",
    isActive: true,
  },
  {
    symbol: "HDFCBANK",
    companyName: "HDFC Bank Limited",
    sector: "Banking",
    currentPrice: "1678.45",
    priceChange: "23.10",
    priceChangePercent: "1.39",
    isActive: true,
  },
  {
    symbol: "WIPRO",
    companyName: "Wipro Limited",
    sector: "IT",
    currentPrice: "456.30",
    priceChange: "-5.20",
    priceChangePercent: "-1.13",
    isActive: true,
  },
  {
    symbol: "TATAMOTORS",
    companyName: "Tata Motors Limited",
    sector: "Auto",
    currentPrice: "789.50",
    priceChange: "12.75",
    priceChangePercent: "1.64",
    isActive: true,
  },
];

// Initial contest data
const initialContests = [
  {
    name: "Daily Tech Titans",
    description: "Focus on IT & Technology stocks. 100 coins budget.",
    entryFee: 500,
    prizePool: 50000,
    maxParticipants: 1000,
    startTime: new Date(),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    status: "active" as const,
    featured: true,
  },
  {
    name: "Banking Bonanza",
    description: "Bank & Financial sector stocks only. 100 coins budget.",
    entryFee: 1000,
    prizePool: 100000,
    maxParticipants: 500,
    startTime: new Date(),
    endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    status: "active" as const,
    featured: false,
  },
  {
    name: "Weekly Winners",
    description: "All NSE stocks allowed. 100 coins budget.",
    entryFee: 2000,
    prizePool: 500000,
    maxParticipants: 2000,
    startTime: new Date(),
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: "active" as const,
    featured: false,
  },
  {
    name: "Beginner's Luck",
    description: "New players only. 100 coins budget.",
    entryFee: 100,
    prizePool: 10000,
    maxParticipants: 1000,
    startTime: new Date(),
    endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    status: "active" as const,
    featured: false,
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database...");

    // Create stocks
    console.log("📈 Creating stocks...");
    for (const stock of initialStocks) {
      try {
        await storage.createStock(stock);
        console.log(`✅ Created stock: ${stock.symbol}`);
      } catch (error) {
        console.log(`⚠️  Stock ${stock.symbol} might already exist`);
      }
    }

    // Create contests
    console.log("🏆 Creating contests...");
    for (const contest of initialContests) {
      try {
        const created = await storage.createContest(contest);
        console.log(`✅ Created contest: ${created.name}`);
      } catch (error) {
        console.log(`⚠️  Contest ${contest.name} creation failed:`, error);
      }
    }

    console.log("🎉 Database seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

// Run if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  seedDatabase().then(() => process.exit(0));
}

export { seedDatabase };