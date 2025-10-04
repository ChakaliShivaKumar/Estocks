import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  fullName: text("full_name").notNull(),
  password: text("password").notNull(),
  coinsBalance: integer("coins_balance").notNull().default(15000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Stocks table for available stocks
export const stocks = pgTable("stocks", {
  symbol: varchar("symbol", { length: 20 }).primaryKey(),
  companyName: text("company_name").notNull(),
  sector: varchar("sector", { length: 50 }),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  priceChange: decimal("price_change", { precision: 10, scale: 2 }).notNull().default("0"),
  priceChangePercent: decimal("price_change_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Contests table
export const contests = pgTable("contests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  entryFee: integer("entry_fee").notNull(),
  prizePool: integer("prize_pool").notNull(),
  maxParticipants: integer("max_participants").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("upcoming"), // upcoming, active, completed, cancelled
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Contest entries (user participation in contests)
export const contestEntries = pgTable("contest_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  totalCoinsInvested: integer("total_coins_invested").notNull().default(100),
  finalPortfolioValue: decimal("final_portfolio_value", { precision: 10, scale: 2 }),
  roi: decimal("roi", { precision: 5, scale: 2 }),
  rank: integer("rank"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userContestUnique: unique().on(table.userId, table.contestId),
}));

// Portfolio holdings for each contest entry
export const portfolioHoldings = pgTable("portfolio_holdings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: uuid("entry_id").notNull().references(() => contestEntries.id, { onDelete: "cascade" }),
  stockSymbol: varchar("stock_symbol", { length: 20 }).notNull().references(() => stocks.symbol),
  coinsInvested: integer("coins_invested").notNull(),
  sharesQuantity: decimal("shares_quantity", { precision: 15, scale: 8 }).notNull(),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Price history for stocks (optional - for charts later)
export const priceHistory = pgTable("price_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  stockSymbol: varchar("stock_symbol", { length: 20 }).notNull().references(() => stocks.symbol),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Portfolio performance history for tracking over time
export const portfolioPerformance = pgTable("portfolio_performance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entryId: uuid("entry_id").notNull().references(() => contestEntries.id, { onDelete: "cascade" }),
  portfolioValue: decimal("portfolio_value", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Historical leaderboard rankings
export const leaderboardHistory = pgTable("leaderboard_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  portfolioValue: decimal("portfolio_value", { precision: 10, scale: 2 }).notNull(),
  roi: decimal("roi", { precision: 5, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Achievement badges
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }),
  category: varchar("category", { length: 50 }).notNull(), // performance, social, milestone
  requirement: text("requirement").notNull(), // JSON string with requirements
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"), // common, rare, epic, legendary
});

// User achievements
export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  contestId: uuid("contest_id").references(() => contests.id, { onDelete: "cascade" }),
}, (table) => ({
  userAchievementUnique: unique().on(table.userId, table.achievementId),
}));

// Social connections (friends/following)
export const socialConnections = pgTable("social_connections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: uuid("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  connectionUnique: unique().on(table.followerId, table.followingId),
}));

// User statistics for achievements
export const userStats = pgTable("user_stats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalContests: integer("total_contests").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalTopThree: integer("total_top_three").notNull().default(0),
  bestRank: integer("best_rank"),
  bestROI: decimal("best_roi", { precision: 5, scale: 2 }),
  totalCoinsEarned: integer("total_coins_earned").notNull().default(0),
  longestWinStreak: integer("longest_win_streak").notNull().default(0),
  currentWinStreak: integer("current_win_streak").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  userStatsUnique: unique().on(table.userId),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  fullName: true,
  password: true,
});

export const insertStockSchema = createInsertSchema(stocks);
export const insertContestSchema = createInsertSchema(contests);
export const insertContestEntrySchema = createInsertSchema(contestEntries);
export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings);
export const insertPortfolioPerformanceSchema = createInsertSchema(portfolioPerformance);
export const insertLeaderboardHistorySchema = createInsertSchema(leaderboardHistory);
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const insertSocialConnectionSchema = createInsertSchema(socialConnections);
export const insertUserStatsSchema = createInsertSchema(userStats);

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Stock = typeof stocks.$inferSelect;
export type Contest = typeof contests.$inferSelect;
export type ContestEntry = typeof contestEntries.$inferSelect;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type PortfolioPerformance = typeof portfolioPerformance.$inferSelect;
export type LeaderboardHistory = typeof leaderboardHistory.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type SocialConnection = typeof socialConnections.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
