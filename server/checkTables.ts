import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkAllTables() {
  try {
    console.log("🔍 Checking all database tables...\n");

    // Check what tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log("📋 Tables in database:");
    tablesResult.forEach((table: any) => {
      console.log(`  ✅ ${table.table_name}`);
    });

    // Count records in each table
    console.log("\n📊 Record counts:");
    
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM stocks) as stocks_count,
        (SELECT COUNT(*) FROM contests) as contests_count,
        (SELECT COUNT(*) FROM contest_entries) as contest_entries_count,
        (SELECT COUNT(*) FROM portfolio_holdings) as portfolio_holdings_count,
        (SELECT COUNT(*) FROM price_history) as price_history_count;
    `;

    const count = counts[0];
    console.log(`  📊 users: ${count.users_count}`);
    console.log(`  📊 stocks: ${count.stocks_count}`);
    console.log(`  📊 contests: ${count.contests_count}`);
    console.log(`  📊 contest_entries: ${count.contest_entries_count}`);
    console.log(`  📊 portfolio_holdings: ${count.portfolio_holdings_count}`);
    console.log(`  📊 price_history: ${count.price_history_count}`);

    // Check database connection info
    console.log("\n🔗 Connection Info:");
    const dbInfo = await sql`SELECT current_database(), current_user, version();`;
    console.log(`  Database: ${dbInfo[0].current_database}`);
    console.log(`  User: ${dbInfo[0].current_user}`);
    console.log(`  PostgreSQL: ${dbInfo[0].version.split(' ')[0]} ${dbInfo[0].version.split(' ')[1]}`);

    console.log("\n✅ All checks completed successfully!");

  } catch (error) {
    console.error("❌ Error checking database:", error);
  }
}

checkAllTables().then(() => process.exit(0));