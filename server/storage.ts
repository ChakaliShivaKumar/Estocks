import { 
  type User, 
  type InsertUser, 
  type Stock, 
  type Contest, 
  type ContestEntry,
  type PortfolioHolding,
  type PortfolioPerformance,
  type LeaderboardHistory,
  type Achievement,
  type UserAchievement,
  type SocialConnection,
  type UserStats,
  users,
  stocks,
  contests,
  contestEntries,
  portfolioHoldings,
  portfolioPerformance,
  leaderboardHistory,
  achievements,
  userAchievements,
  socialConnections,
  userStats
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, asc, and } from "drizzle-orm";
import { config } from "dotenv";

// Load environment variables
config();

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCoinsBalance(userId: string, newBalance: number): Promise<void>;

  // Stock methods
  getAllStocks(): Promise<Stock[]>;
  getStock(symbol: string): Promise<Stock | undefined>;
  updateStockPrice(symbol: string, price: number, change: number, changePercent: number): Promise<void>;
  createStock(stock: Omit<Stock, 'lastUpdated'>): Promise<Stock>;

  // Contest methods
  getAllContests(): Promise<Contest[]>;
  getActiveContests(): Promise<Contest[]>;
  getContest(id: string): Promise<Contest | undefined>;
  createContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest>;
  updateContest(id: string, updates: Partial<Contest>): Promise<Contest>;
  updateContestStatus(id: string, status: string): Promise<void>;
  deleteContest(id: string): Promise<void>;

  // Contest entry methods
  createContestEntry(entry: Omit<ContestEntry, 'id' | 'createdAt'>): Promise<ContestEntry>;
  getContestEntry(userId: string, contestId: string): Promise<ContestEntry | undefined>;
  getContestEntries(contestId: string): Promise<ContestEntry[]>;
  getUserContestEntries(userId: string): Promise<Array<ContestEntry & { contest: Contest }>>;
  updateContestEntryResults(entryId: string, finalValue: number, roi: number, rank: number): Promise<void>;

  // Portfolio holding methods
  createPortfolioHolding(holding: Omit<PortfolioHolding, 'id' | 'createdAt'>): Promise<PortfolioHolding>;
  getPortfolioHoldings(entryId: string): Promise<PortfolioHolding[]>;

  // Portfolio performance methods
  createPortfolioPerformance(performance: Omit<PortfolioPerformance, 'id' | 'timestamp'>): Promise<PortfolioPerformance>;
  getPortfolioPerformanceHistory(entryId: string): Promise<PortfolioPerformance[]>;
  getPortfolioAnalytics(entryId: string): Promise<{
    performanceHistory: PortfolioPerformance[];
    sectorAllocation: { sector: string; value: number; percentage: number }[];
    bestPerformers: { symbol: string; roi: number }[];
    worstPerformers: { symbol: string; roi: number }[];
  }>;

  // Leaderboard and social methods
  recordLeaderboardSnapshot(contestId: string): Promise<void>;
  getLeaderboardHistory(contestId: string, limit?: number): Promise<LeaderboardHistory[]>;
  getEnhancedLeaderboard(contestId: string, userId?: string): Promise<{
    leaderboard: Array<{
      rank: number;
      userId: string;
      username: string;
      portfolioValue: number;
      roi: number;
      rankChange?: number;
      isFollowing?: boolean;
      achievements?: Achievement[];
    }>;
    userRank?: number;
    totalParticipants: number;
  }>;

  // Achievement methods
  createAchievement(achievement: Omit<Achievement, 'id'>): Promise<Achievement>;
  getAllAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<Array<UserAchievement & { achievement: Achievement }>>;
  checkAndAwardAchievements(userId: string, contestId?: string): Promise<Achievement[]>;

  // Social methods
  followUser(followerId: string, followingId: string): Promise<SocialConnection>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<Array<User & { followedAt: Date }>>;
  getFollowing(userId: string): Promise<Array<User & { followedAt: Date }>>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  // User stats methods
  getUserStats(userId: string): Promise<UserStats | undefined>;
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserCoinsBalance(userId: string, newBalance: number): Promise<void> {
    await db.update(users).set({ coinsBalance: newBalance }).where(eq(users.id, userId));
  }

  // Stock methods
  async getAllStocks(): Promise<Stock[]> {
    return await db.select().from(stocks).where(eq(stocks.isActive, true)).orderBy(asc(stocks.symbol));
  }

  async getStock(symbol: string): Promise<Stock | undefined> {
    const result = await db.select().from(stocks).where(eq(stocks.symbol, symbol)).limit(1);
    return result[0];
  }

  async updateStockPrice(symbol: string, price: number, change: number, changePercent: number): Promise<void> {
    await db.update(stocks).set({
      currentPrice: price.toString(),
      priceChange: change.toString(),
      priceChangePercent: changePercent.toString(),
      lastUpdated: new Date()
    }).where(eq(stocks.symbol, symbol));
  }

  async createStock(stock: Omit<Stock, 'lastUpdated'>): Promise<Stock> {
    const result = await db.insert(stocks).values({
      ...stock,
      lastUpdated: new Date()
    }).returning();
    return result[0];
  }

  // Contest methods
  async getAllContests(): Promise<Contest[]> {
    return await db.select().from(contests).orderBy(desc(contests.createdAt));
  }

  async getActiveContests(): Promise<Contest[]> {
    return await db.select().from(contests)
      .where(eq(contests.status, "active"))
      .orderBy(asc(contests.endTime));
  }

  async getContest(id: string): Promise<Contest | undefined> {
    const result = await db.select().from(contests).where(eq(contests.id, id)).limit(1);
    return result[0];
  }

  async createContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest> {
    const result = await db.insert(contests).values(contest).returning();
    return result[0];
  }

  async updateContest(id: string, updates: Partial<Contest>): Promise<Contest> {
    const result = await db.update(contests).set(updates).where(eq(contests.id, id)).returning();
    return result[0];
  }

  async updateContestStatus(id: string, status: string): Promise<void> {
    await db.update(contests).set({ status }).where(eq(contests.id, id));
  }

  async deleteContest(id: string): Promise<void> {
    await db.delete(contests).where(eq(contests.id, id));
  }

  // Contest entry methods
  async createContestEntry(entry: Omit<ContestEntry, 'id' | 'createdAt'>): Promise<ContestEntry> {
    const result = await db.insert(contestEntries).values(entry).returning();
    return result[0];
  }

  async getContestEntry(userId: string, contestId: string): Promise<ContestEntry | undefined> {
    const result = await db.select().from(contestEntries)
      .where(and(eq(contestEntries.userId, userId), eq(contestEntries.contestId, contestId)))
      .limit(1);
    return result[0];
  }

  async getContestEntries(contestId: string): Promise<ContestEntry[]> {
    return await db.select().from(contestEntries)
      .where(eq(contestEntries.contestId, contestId))
      .orderBy(asc(contestEntries.rank));
  }

  async getUserContestEntries(userId: string): Promise<Array<ContestEntry & { contest: Contest }>> {
    const result = await db.select({
      id: contestEntries.id,
      userId: contestEntries.userId,
      contestId: contestEntries.contestId,
      totalCoinsInvested: contestEntries.totalCoinsInvested,
      finalPortfolioValue: contestEntries.finalPortfolioValue,
      roi: contestEntries.roi,
      rank: contestEntries.rank,
      createdAt: contestEntries.createdAt,
      contest: contests
    })
    .from(contestEntries)
    .innerJoin(contests, eq(contestEntries.contestId, contests.id))
    .where(eq(contestEntries.userId, userId))
    .orderBy(desc(contestEntries.createdAt));

    return result;
  }

  async updateContestEntryResults(entryId: string, finalValue: number, roi: number, rank: number): Promise<void> {
    await db.update(contestEntries).set({
      finalPortfolioValue: finalValue.toString(),
      roi: roi.toString(),
      rank
    }).where(eq(contestEntries.id, entryId));
  }

  // Portfolio holding methods
  async createPortfolioHolding(holding: Omit<PortfolioHolding, 'id' | 'createdAt'>): Promise<PortfolioHolding> {
    const result = await db.insert(portfolioHoldings).values(holding).returning();
    return result[0];
  }

  async getPortfolioHoldings(entryId: string): Promise<PortfolioHolding[]> {
    return await db.select().from(portfolioHoldings)
      .where(eq(portfolioHoldings.entryId, entryId));
  }

  // Portfolio performance methods
  async createPortfolioPerformance(performance: Omit<PortfolioPerformance, 'id' | 'timestamp'>): Promise<PortfolioPerformance> {
    const result = await db.insert(portfolioPerformance).values({
      ...performance,
      timestamp: new Date()
    }).returning();
    return result[0];
  }

  async getPortfolioPerformanceHistory(entryId: string): Promise<PortfolioPerformance[]> {
    return await db.select().from(portfolioPerformance)
      .where(eq(portfolioPerformance.entryId, entryId))
      .orderBy(asc(portfolioPerformance.timestamp));
  }

  async getPortfolioAnalytics(entryId: string): Promise<{
    performanceHistory: PortfolioPerformance[];
    sectorAllocation: { sector: string; value: number; percentage: number }[];
    bestPerformers: { symbol: string; roi: number }[];
    worstPerformers: { symbol: string; roi: number }[];
  }> {
    // Get performance history
    const performanceHistory = await this.getPortfolioPerformanceHistory(entryId);

    // Get portfolio holdings with current stock data
    const holdings = await this.getPortfolioHoldings(entryId);
    const enrichedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        const stock = await this.getStock(holding.stockSymbol);
        const currentValue = parseFloat(holding.sharesQuantity) * parseFloat(stock!.currentPrice);
        const roi = ((currentValue - holding.coinsInvested) / holding.coinsInvested) * 100;

        return {
          ...holding,
          stock,
          currentValue,
          roi
        };
      })
    );

    // Calculate sector allocation
    const sectorMap = new Map<string, number>();
    let totalValue = 0;

    enrichedHoldings.forEach(holding => {
      if (holding.stock?.sector) {
        const current = sectorMap.get(holding.stock.sector) || 0;
        sectorMap.set(holding.stock.sector, current + holding.currentValue);
        totalValue += holding.currentValue;
      }
    });

    const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value,
      percentage: (value / totalValue) * 100
    }));

    // Calculate best and worst performers
    const performers = enrichedHoldings
      .map(holding => ({
        symbol: holding.stockSymbol,
        roi: holding.roi
      }))
      .sort((a, b) => b.roi - a.roi);

    const bestPerformers = performers.slice(0, 3);
    const worstPerformers = performers.slice(-3).reverse();

    return {
      performanceHistory,
      sectorAllocation,
      bestPerformers,
      worstPerformers
    };
  }

  // Leaderboard and social methods
  async recordLeaderboardSnapshot(contestId: string): Promise<void> {
    try {
      const entries = await this.getContestEntries(contestId);
      const now = new Date();

      for (const entry of entries) {
        if (entry.roi !== null && entry.finalPortfolioValue !== null) {
          await db.insert(leaderboardHistory).values({
            contestId,
            userId: entry.userId,
            rank: entry.rank || 0,
            portfolioValue: entry.finalPortfolioValue,
            roi: entry.roi,
            timestamp: now
          });
        }
      }
    } catch (error) {
      console.error('Error recording leaderboard snapshot:', error);
      throw error;
    }
  }

  async getLeaderboardHistory(contestId: string, limit: number = 100): Promise<LeaderboardHistory[]> {
    return await db.select().from(leaderboardHistory)
      .where(eq(leaderboardHistory.contestId, contestId))
      .orderBy(desc(leaderboardHistory.timestamp))
      .limit(limit);
  }

  async getEnhancedLeaderboard(contestId: string, userId?: string): Promise<{
    leaderboard: Array<{
      rank: number;
      userId: string;
      username: string;
      portfolioValue: number;
      roi: number;
      rankChange?: number;
      isFollowing?: boolean;
      achievements?: Achievement[];
    }>;
    userRank?: number;
    totalParticipants: number;
  }> {
    const entries = await this.getContestEntries(contestId);
    
    // Get current leaderboard
    const leaderboard = entries.map((entry, index) => ({
      rank: entry.rank || index + 1,
      userId: entry.userId,
      username: `User${entry.userId.slice(-4)}`,
      portfolioValue: parseFloat(entry.finalPortfolioValue || "100"),
      roi: parseFloat(entry.roi || "0")
    }));

    // Get rank changes from history
    const history = await this.getLeaderboardHistory(contestId, 50);
    const previousRanks = new Map<string, number>();
    
    // Get the most recent previous snapshot
    const latestTimestamp = history[0]?.timestamp;
    if (latestTimestamp) {
      const previousSnapshot = history.filter(h => 
        h.timestamp.getTime() === latestTimestamp.getTime() && h.contestId === contestId
      );
      
      previousSnapshot.forEach(h => {
        previousRanks.set(h.userId, h.rank);
      });
    }

    // Add rank changes
    const enhancedLeaderboard = await Promise.all(
      leaderboard.map(async (entry) => {
        const previousRank = previousRanks.get(entry.userId);
        const rankChange = previousRank ? previousRank - entry.rank : undefined;
        
        // Check if current user is following this user
        let isFollowing = false;
        if (userId && userId !== entry.userId) {
          try {
            isFollowing = await this.isFollowing(userId, entry.userId);
          } catch (error) {
            console.error(`Error checking follow status for user ${entry.userId}:`, error);
            isFollowing = false;
          }
        }

        // Get user's recent achievements
        let achievements: Achievement[] = [];
        try {
          const userAchievements = await this.getUserAchievements(entry.userId);
          achievements = userAchievements.slice(0, 3).map(ua => ua.achievement);
        } catch (error) {
          console.error(`Error fetching achievements for user ${entry.userId}:`, error);
          achievements = [];
        }

        return {
          ...entry,
          rankChange,
          isFollowing,
          achievements
        };
      })
    );

    // Find user's rank
    const userIndex = userId ? leaderboard.findIndex(entry => entry.userId === userId) : -1;
    const userRank = userIndex >= 0 ? userIndex + 1 : undefined;

    return {
      leaderboard: enhancedLeaderboard,
      userRank,
      totalParticipants: leaderboard.length
    };
  }

  // Achievement methods
  async createAchievement(achievement: Omit<Achievement, 'id'>): Promise<Achievement> {
    const result = await db.insert(achievements).values(achievement).returning();
    return result[0];
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).orderBy(asc(achievements.category), asc(achievements.name));
  }

  async getUserAchievements(userId: string): Promise<Array<UserAchievement & { achievement: Achievement }>> {
    const result = await db.select({
      id: userAchievements.id,
      userId: userAchievements.userId,
      achievementId: userAchievements.achievementId,
      earnedAt: userAchievements.earnedAt,
      contestId: userAchievements.contestId,
      achievement: achievements
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, userId))
    .orderBy(desc(userAchievements.earnedAt));

    return result;
  }

  async checkAndAwardAchievements(userId: string, contestId?: string): Promise<Achievement[]> {
    const userStats = await this.getUserStats(userId);
    const userAchievements = await this.getUserAchievements(userId);
    const allAchievements = await this.getAllAchievements();
    
    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
    const newlyEarned: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      let earned = false;
      const requirements = JSON.parse(achievement.requirement);

      switch (achievement.category) {
        case 'performance':
          earned = this.checkPerformanceAchievement(requirements, userStats);
          break;
        case 'social':
          earned = this.checkSocialAchievement(requirements, userId);
          break;
        case 'milestone':
          earned = this.checkMilestoneAchievement(requirements, userStats);
          break;
      }

      if (earned) {
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          contestId,
          earnedAt: new Date()
        });
        newlyEarned.push(achievement);
      }
    }

    return newlyEarned;
  }

  private checkPerformanceAchievement(requirements: any, userStats?: UserStats): boolean {
    if (!userStats) return false;
    
    if (requirements.type === 'win_streak' && requirements.value <= userStats.currentWinStreak) {
      return true;
    }
    if (requirements.type === 'total_wins' && requirements.value <= userStats.totalWins) {
      return true;
    }
    if (requirements.type === 'best_rank' && requirements.value >= (userStats.bestRank || 999)) {
      return true;
    }
    return false;
  }

  private async checkSocialAchievement(requirements: any, userId: string): Promise<boolean> {
    if (requirements.type === 'followers' && requirements.value <= (await this.getFollowers(userId)).length) {
      return true;
    }
    return false;
  }

  private checkMilestoneAchievement(requirements: any, userStats?: UserStats): boolean {
    if (!userStats) return false;
    
    if (requirements.type === 'contests_participated' && requirements.value <= userStats.totalContests) {
      return true;
    }
    return false;
  }

  // Social methods
  async followUser(followerId: string, followingId: string): Promise<SocialConnection> {
    const result = await db.insert(socialConnections).values({
      followerId,
      followingId,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.delete(socialConnections)
      .where(and(
        eq(socialConnections.followerId, followerId),
        eq(socialConnections.followingId, followingId)
      ));
  }

  async getFollowers(userId: string): Promise<Array<User & { followedAt: Date }>> {
    const result = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      password: users.password,
      coinsBalance: users.coinsBalance,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      followedAt: socialConnections.createdAt
    })
    .from(socialConnections)
    .innerJoin(users, eq(socialConnections.followerId, users.id))
    .where(eq(socialConnections.followingId, userId))
    .orderBy(desc(socialConnections.createdAt));

    return result;
  }

  async getFollowing(userId: string): Promise<Array<User & { followedAt: Date }>> {
    const result = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      password: users.password,
      coinsBalance: users.coinsBalance,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      followedAt: socialConnections.createdAt
    })
    .from(socialConnections)
    .innerJoin(users, eq(socialConnections.followingId, users.id))
    .where(eq(socialConnections.followerId, userId))
    .orderBy(desc(socialConnections.createdAt));

    return result;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.select().from(socialConnections)
      .where(and(
        eq(socialConnections.followerId, followerId),
        eq(socialConnections.followingId, followingId)
      ))
      .limit(1);
    
    return result.length > 0;
  }

  // User stats methods
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const result = await db.select().from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);
    return result[0];
  }

  async updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats> {
    const existing = await this.getUserStats(userId);
    
    if (existing) {
      const result = await db.update(userStats)
        .set({ ...stats, updatedAt: new Date() })
        .where(eq(userStats.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(userStats)
        .values({ userId, ...stats, updatedAt: new Date() })
        .returning();
      return result[0];
    }
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
