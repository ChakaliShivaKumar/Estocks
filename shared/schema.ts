import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, uuid, unique, date } from "drizzle-orm/pg-core";
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
  profilePicture: text("profile_picture"),
  bio: text("bio"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  location: varchar("location", { length: 100 }),
  isAdmin: boolean("is_admin").notNull().default(false),
  // Gamification fields
  level: integer("level").notNull().default(1),
  experiencePoints: integer("experience_points").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  referralCode: varchar("referral_code", { length: 10 }).unique(),
  referredBy: uuid("referred_by"),
  totalReferrals: integer("total_referrals").notNull().default(0),
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
  // User-created contest fields
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }), // null for admin-created contests
  visibility: varchar("visibility", { length: 20 }).notNull().default("public"), // public, private, friends
  inviteCode: varchar("invite_code", { length: 10 }).unique(), // for private contests
  allowFriends: boolean("allow_friends").notNull().default(true), // allow friends to join
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

// Coin transactions table
export const coinTransactions = pgTable("coin_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'purchase', 'exchange', 'contest_entry', 'prize', 'refund'
  amount: integer("amount").notNull(), // positive for credit, negative for debit
  coinsBefore: integer("coins_before").notNull(),
  coinsAfter: integer("coins_after").notNull(),
  cashAmount: decimal("cash_amount", { precision: 10, scale: 2 }), // for purchase/exchange
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }), // coins per dollar
  paymentMethod: varchar("payment_method", { length: 50 }), // 'credit_card', 'paypal', 'bank_transfer'
  paymentId: text("payment_id"), // external payment processor ID
  status: varchar("status", { length: 20 }).notNull().default("completed"), // 'pending', 'completed', 'failed', 'refunded'
  description: text("description"),
  contestId: uuid("contest_id").references(() => contests.id), // if related to contest
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
export const insertCoinTransactionSchema = createInsertSchema(coinTransactions);

// TypeScript types
// Daily Challenges table
export const dailyChallenges = pgTable("daily_challenges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // trading, social, achievement
  target: integer("target").notNull(), // target value to complete
  rewardXP: integer("reward_xp").notNull(),
  rewardCoins: integer("reward_coins").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  date: date("date").notNull().default(sql`CURRENT_DATE`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User Daily Challenge Progress table
export const userDailyChallengeProgress = pgTable("user_daily_challenge_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: uuid("challenge_id").notNull().references(() => dailyChallenges.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  claimedReward: boolean("claimed_reward").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userChallengeUnique: unique().on(table.userId, table.challengeId),
}));

// XP Transactions table for tracking XP gains
export const xpTransactions = pgTable("xp_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive for gains, negative for losses
  source: varchar("source", { length: 50 }).notNull(), // trading, challenge, referral, etc.
  description: text("description").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Referral Rewards table
export const referralRewards = pgTable("referral_rewards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: uuid("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredId: uuid("referred_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardType: varchar("reward_type", { length: 20 }).notNull(), // coins, xp
  rewardAmount: integer("reward_amount").notNull(),
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Level Rewards table for level-up rewards
export const levelRewards = pgTable("level_rewards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  rewardType: varchar("reward_type", { length: 20 }).notNull(), // coins, xp, achievement
  rewardAmount: integer("reward_amount").notNull(),
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Friend Requests table
export const friendRequests = pgTable("friend_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: uuid("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  friendRequestUnique: unique().on(table.requesterId, table.recipientId),
}));

// Private Leagues table
export const privateLeagues = pgTable("private_leagues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  creatorId: uuid("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inviteCode: varchar("invite_code", { length: 10 }).unique().notNull(),
  maxMembers: integer("max_members").notNull().default(50),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Private League Members table
export const privateLeagueMembers = pgTable("private_league_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: uuid("league_id").notNull().references(() => privateLeagues.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull().default("member"), // creator, admin, member
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => ({
  leagueMemberUnique: unique().on(table.leagueId, table.userId),
}));

// Private League Contests table
export const privateLeagueContests = pgTable("private_league_contests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: uuid("league_id").notNull().references(() => privateLeagues.id, { onDelete: "cascade" }),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  leagueContestUnique: unique().on(table.leagueId, table.contestId),
}));

// Contest Comments table
export const contestComments = pgTable("contest_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: uuid("parent_comment_id").references(() => contestComments.id, { onDelete: "cascade" }), // for replies
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Comment Likes table
export const commentLikes = pgTable("comment_likes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: uuid("comment_id").notNull().references(() => contestComments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  commentLikeUnique: unique().on(table.commentId, table.userId),
}));

// Achievement Shares table
export const achievementShares = pgTable("achievement_shares", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  contestId: uuid("contest_id").references(() => contests.id, { onDelete: "cascade" }),
  message: text("message"), // optional custom message
  platform: varchar("platform", { length: 20 }).notNull().default("app"), // app, twitter, facebook, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat Messages table (for private league chats)
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueId: uuid("league_id").notNull().references(() => privateLeagues.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull().default("text"), // text, image, system
  isEdited: boolean("is_edited").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Contest Invitations table for inviting friends to contests
export const contestInvitations = pgTable("contest_invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  contestId: uuid("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  inviterId: uuid("inviter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inviteeId: uuid("invitee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message"), // optional custom invitation message
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  contestInvitationUnique: unique().on(table.contestId, table.inviteeId),
}));

// Zod schemas for gamification tables
export const insertDailyChallengeSchema = createInsertSchema(dailyChallenges);
export const selectDailyChallengeSchema = createSelectSchema(dailyChallenges);
export const insertUserDailyChallengeProgressSchema = createInsertSchema(userDailyChallengeProgress);
export const selectUserDailyChallengeProgressSchema = createSelectSchema(userDailyChallengeProgress);
export const insertXpTransactionSchema = createInsertSchema(xpTransactions);
export const selectXpTransactionSchema = createSelectSchema(xpTransactions);
export const insertReferralRewardSchema = createInsertSchema(referralRewards);
export const selectReferralRewardSchema = createSelectSchema(referralRewards);
export const insertLevelRewardSchema = createInsertSchema(levelRewards);
export const selectLevelRewardSchema = createSelectSchema(levelRewards);

// Zod schemas for social features
export const insertFriendRequestSchema = createInsertSchema(friendRequests);
export const selectFriendRequestSchema = createSelectSchema(friendRequests);
export const insertPrivateLeagueSchema = createInsertSchema(privateLeagues);
export const selectPrivateLeagueSchema = createSelectSchema(privateLeagues);
export const insertPrivateLeagueMemberSchema = createInsertSchema(privateLeagueMembers);
export const selectPrivateLeagueMemberSchema = createSelectSchema(privateLeagueMembers);
export const insertPrivateLeagueContestSchema = createInsertSchema(privateLeagueContests);
export const selectPrivateLeagueContestSchema = createSelectSchema(privateLeagueContests);
export const insertContestCommentSchema = createInsertSchema(contestComments);
export const selectContestCommentSchema = createSelectSchema(contestComments);
export const insertCommentLikeSchema = createInsertSchema(commentLikes);
export const selectCommentLikeSchema = createSelectSchema(commentLikes);
export const insertAchievementShareSchema = createInsertSchema(achievementShares);
export const selectAchievementShareSchema = createSelectSchema(achievementShares);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const selectChatMessageSchema = createSelectSchema(chatMessages);
export const insertContestInvitationSchema = createInsertSchema(contestInvitations);
export const selectContestInvitationSchema = createSelectSchema(contestInvitations);

// Type exports
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
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type UserDailyChallengeProgress = typeof userDailyChallengeProgress.$inferSelect;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type ReferralReward = typeof referralRewards.$inferSelect;
export type LevelReward = typeof levelRewards.$inferSelect;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type PrivateLeague = typeof privateLeagues.$inferSelect;
export type PrivateLeagueMember = typeof privateLeagueMembers.$inferSelect;
export type PrivateLeagueContest = typeof privateLeagueContests.$inferSelect;
export type ContestComment = typeof contestComments.$inferSelect;
export type CommentLike = typeof commentLikes.$inferSelect;
export type AchievementShare = typeof achievementShares.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ContestInvitation = typeof contestInvitations.$inferSelect;
