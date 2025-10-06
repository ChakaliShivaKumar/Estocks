import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { dailyChallenges } from "@shared/schema";
import { config } from "dotenv";

config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(connectionString);
const db = drizzle(sql);

const sampleChallenges = [
  // Trading challenges
  {
    title: "Stock Market Explorer",
    description: "Buy 5 different stocks today",
    type: "trading",
    target: 5,
    rewardXP: 100,
    rewardCoins: 50
  },
  {
    title: "Portfolio Builder",
    description: "Make 10 stock transactions",
    type: "trading",
    target: 10,
    rewardXP: 150,
    rewardCoins: 75
  },
  {
    title: "Risk Taker",
    description: "Invest in 3 different sectors",
    type: "trading",
    target: 3,
    rewardXP: 80,
    rewardCoins: 40
  },
  {
    title: "Quick Trader",
    description: "Complete 20 buy/sell operations",
    type: "trading",
    target: 20,
    rewardXP: 200,
    rewardCoins: 100
  },

  // Social challenges
  {
    title: "Social Butterfly",
    description: "Follow 5 other users",
    type: "social",
    target: 5,
    rewardXP: 60,
    rewardCoins: 30
  },
  {
    title: "Community Builder",
    description: "Share your portfolio performance",
    type: "social",
    target: 1,
    rewardXP: 40,
    rewardCoins: 20
  },
  {
    title: "Networker",
    description: "Get 3 new followers",
    type: "social",
    target: 3,
    rewardXP: 120,
    rewardCoins: 60
  },

  // Achievement challenges
  {
    title: "Achievement Hunter",
    description: "Unlock 3 new achievements",
    type: "achievement",
    target: 3,
    rewardXP: 180,
    rewardCoins: 90
  },
  {
    title: "Level Up",
    description: "Gain 200 experience points",
    type: "achievement",
    target: 200,
    rewardXP: 100,
    rewardCoins: 50
  },
  {
    title: "Coin Collector",
    description: "Earn 500 coins through activities",
    type: "achievement",
    target: 500,
    rewardXP: 80,
    rewardCoins: 40
  },

  // Contest challenges
  {
    title: "Contest Competitor",
    description: "Join 3 contests",
    type: "contest",
    target: 3,
    rewardXP: 120,
    rewardCoins: 60
  },
  {
    title: "Leaderboard Climber",
    description: "Achieve top 10 in any contest",
    type: "contest",
    target: 1,
    rewardXP: 250,
    rewardCoins: 125
  },
  {
    title: "Consistent Performer",
    description: "Maintain positive ROI in 2 contests",
    type: "contest",
    target: 2,
    rewardXP: 150,
    rewardCoins: 75
  },

  // Profile challenges
  {
    title: "Profile Perfect",
    description: "Complete your profile (add bio, location, etc.)",
    type: "profile",
    target: 1,
    rewardXP: 50,
    rewardCoins: 25
  },
  {
    title: "Photo Finish",
    description: "Upload a profile picture",
    type: "profile",
    target: 1,
    rewardXP: 30,
    rewardCoins: 15
  },

  // Engagement challenges
  {
    title: "Daily Active",
    description: "Log in for 3 consecutive days",
    type: "engagement",
    target: 3,
    rewardXP: 100,
    rewardCoins: 50
  },
  {
    title: "Market Watcher",
    description: "Check stock prices 10 times",
    type: "engagement",
    target: 10,
    rewardXP: 60,
    rewardCoins: 30
  },
  {
    title: "Portfolio Analyzer",
    description: "View your portfolio 5 times",
    type: "engagement",
    target: 5,
    rewardXP: 40,
    rewardCoins: 20
  }
];

async function populateDailyChallenges() {
  try {
    console.log("🔄 Populating daily challenges...");

    const today = new Date().toISOString().split('T')[0];

    // Check if challenges already exist for today
    const existingChallenges = await db.select()
      .from(dailyChallenges)
      .where(eq(dailyChallenges.date, today));

    if (existingChallenges.length > 0) {
      console.log("📅 Daily challenges already exist for today, skipping...");
      return;
    }

    // Insert 5 random challenges for today
    const selectedChallenges = sampleChallenges
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);

    for (const challenge of selectedChallenges) {
      await db.insert(dailyChallenges).values({
        ...challenge,
        date: today
      });
    }

    console.log(`✅ Created ${selectedChallenges.length} daily challenges for ${today}`);
    console.log("📋 Today's challenges:");
    selectedChallenges.forEach((challenge, index) => {
      console.log(`   ${index + 1}. ${challenge.title} - ${challenge.description} (${challenge.rewardXP} XP, ${challenge.rewardCoins} coins)`);
    });

  } catch (error) {
    console.error("❌ Error populating daily challenges:", error);
    throw error;
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDailyChallenges()
    .then(() => {
      console.log("🎉 Daily challenges populated successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Failed to populate daily challenges:", error);
      process.exit(1);
    });
}

export { populateDailyChallenges };
