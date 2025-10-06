import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql_ = neon(connectionString);
const db = drizzle(sql_);

async function createGamificationTables() {
  try {
    console.log("🔄 Creating gamification tables...");

    // Add gamification columns to users table
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1`;
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_points INTEGER NOT NULL DEFAULT 0`;
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0`;
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0`;
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_date DATE`;
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) UNIQUE`;
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID`;
    await sql_`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_referrals INTEGER NOT NULL DEFAULT 0`;

    // Create daily challenges table
    await sql_`CREATE TABLE IF NOT EXISTS daily_challenges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      target INTEGER NOT NULL,
      reward_xp INTEGER NOT NULL,
      reward_coins INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;

    // Create user daily challenge progress table
    await sql_`CREATE TABLE IF NOT EXISTS user_daily_challenge_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
      progress INTEGER NOT NULL DEFAULT 0,
      completed BOOLEAN NOT NULL DEFAULT false,
      completed_at TIMESTAMP,
      claimed_reward BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, challenge_id)
    )`;

    // Create XP transactions table
    await sql_`CREATE TABLE IF NOT EXISTS xp_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      source VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;

    // Create referral rewards table
    await sql_`CREATE TABLE IF NOT EXISTS referral_rewards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reward_type VARCHAR(20) NOT NULL,
      reward_amount INTEGER NOT NULL,
      claimed BOOLEAN NOT NULL DEFAULT false,
      claimed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;

    // Create level rewards table
    await sql_`CREATE TABLE IF NOT EXISTS level_rewards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      level INTEGER NOT NULL,
      reward_type VARCHAR(20) NOT NULL,
      reward_amount INTEGER NOT NULL,
      claimed BOOLEAN NOT NULL DEFAULT false,
      claimed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`;

    console.log("✅ Gamification tables created successfully!");

    // Create indexes for better performance
    console.log("🔄 Creating indexes...");
    
    await sql_`CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code)`;
    await sql_`CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date)`;
    await sql_`CREATE INDEX IF NOT EXISTS idx_user_challenge_progress_user_id ON user_daily_challenge_progress(user_id)`;
    await sql_`CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id)`;
    await sql_`CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id)`;
    await sql_`CREATE INDEX IF NOT EXISTS idx_level_rewards_user_id ON level_rewards(user_id)`;

    console.log("✅ Indexes created successfully!");

  } catch (error) {
    console.error("❌ Error creating gamification tables:", error);
    throw error;
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  createGamificationTables()
    .then(() => {
      console.log("🎉 Gamification tables migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { createGamificationTables };
