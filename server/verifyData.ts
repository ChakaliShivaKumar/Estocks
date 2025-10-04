import { config } from "dotenv";
import { storage } from "./storage";

// Load environment variables
config();

async function verifyData() {
  try {
    console.log("🔍 Checking database data...");

    // Check stocks
    console.log("\n📈 Stocks in database:");
    const stocks = await storage.getAllStocks();
    console.log(`Found ${stocks.length} stocks:`);
    stocks.forEach(stock => {
      console.log(`  - ${stock.symbol}: ${stock.companyName} (₹${stock.currentPrice})`);
    });

    // Check contests
    console.log("\n🏆 Contests in database:");
    const contests = await storage.getAllContests();
    console.log(`Found ${contests.length} contests:`);
    contests.forEach(contest => {
      console.log(`  - ${contest.name}: ${contest.description}`);
      console.log(`    Entry: ${contest.entryFee} coins, Prize: ${contest.prizePool} coins`);
      console.log(`    Status: ${contest.status}, Participants: 0/${contest.maxParticipants}`);
    });

    console.log("\n✅ Database verification complete!");
  } catch (error) {
    console.error("❌ Error verifying data:", error);
  }
}

// Run verification
verifyData().then(() => process.exit(0));