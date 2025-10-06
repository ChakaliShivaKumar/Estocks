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
  type CoinTransaction,
  type DailyChallenge,
  type UserDailyChallengeProgress,
  type XpTransaction,
  type ReferralReward,
  type LevelReward,
  type FriendRequest,
  type PrivateLeague,
  type PrivateLeagueMember,
  type PrivateLeagueContest,
  type ContestComment,
  type CommentLike,
  type AchievementShare,
  type ChatMessage,
  type ContestInvitation,
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
  userStats,
  coinTransactions,
  dailyChallenges,
  userDailyChallengeProgress,
  xpTransactions,
  referralRewards,
  levelRewards,
  friendRequests,
  privateLeagues,
  privateLeagueMembers,
  privateLeagueContests,
  contestComments,
  commentLikes,
  achievementShares,
  chatMessages,
  contestInvitations
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, asc, and, sql } from "drizzle-orm";
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
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserCoinsBalance(userId: string, newBalance: number): Promise<void>;
  uploadProfilePicture(userId: string, imageUrl: string): Promise<void>;

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

  // Coin transaction methods
  createCoinTransaction(transaction: Omit<CoinTransaction, 'id' | 'createdAt'>): Promise<CoinTransaction>;
  getUserCoinTransactions(userId: string, limit?: number): Promise<CoinTransaction[]>;
  purchaseCoins(userId: string, amount: number, cashAmount: number, paymentMethod: string, paymentId?: string): Promise<CoinTransaction>;
  exchangeCoinsForCash(userId: string, coinsAmount: number, exchangeRate: number): Promise<CoinTransaction>;
  getCoinExchangeRate(): number; // returns coins per dollar

  // Friend system methods
  sendFriendRequest(requesterId: string, recipientId: string): Promise<FriendRequest>;
  acceptFriendRequest(requestId: string, userId: string): Promise<void>;
  declineFriendRequest(requestId: string, userId: string): Promise<void>;
  getFriendRequests(userId: string): Promise<Array<FriendRequest & { requester: User }>>;
  getSentFriendRequests(userId: string): Promise<Array<FriendRequest & { recipient: User }>>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  getFriends(userId: string): Promise<Array<User & { friendshipDate: Date }>>;

  // Private league methods
  createPrivateLeague(league: Omit<PrivateLeague, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrivateLeague>;
  joinPrivateLeague(userId: string, inviteCode: string): Promise<PrivateLeague>;
  leavePrivateLeague(userId: string, leagueId: string): Promise<void>;
  getPrivateLeagues(userId: string): Promise<Array<PrivateLeague & { memberCount: number; isMember: boolean }>>;
  getPrivateLeagueMembers(leagueId: string): Promise<Array<User & { role: string; joinedAt: Date }>>;
  addContestToLeague(leagueId: string, contestId: string, userId: string): Promise<PrivateLeagueContest>;
  getLeagueContests(leagueId: string): Promise<Array<Contest & { addedBy: User; addedAt: Date }>>;

  // Contest comments methods
  addContestComment(comment: Omit<ContestComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContestComment>;
  getContestComments(contestId: string, limit?: number): Promise<Array<ContestComment & { user: User; replies: Array<ContestComment & { user: User }> }>>;
  likeComment(commentId: string, userId: string): Promise<void>;
  unlikeComment(commentId: string, userId: string): Promise<void>;
  editComment(commentId: string, userId: string, content: string): Promise<void>;
  deleteComment(commentId: string, userId: string): Promise<void>;

  // Achievement sharing methods
  shareAchievement(share: Omit<AchievementShare, 'id' | 'createdAt'>): Promise<AchievementShare>;
  getAchievementShares(userId: string, limit?: number): Promise<Array<AchievementShare & { achievement: Achievement; contest?: Contest }>>;

  // Chat methods
  sendChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage>;
  getChatMessages(leagueId: string, limit?: number): Promise<Array<ChatMessage & { user: User }>>;
  editChatMessage(messageId: string, userId: string, content: string): Promise<void>;
  deleteChatMessage(messageId: string, userId: string): Promise<void>;

  // User contest creation methods
  createUserContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest>;
  getUserContests(userId: string): Promise<Contest[]>;
  updateUserContest(contestId: string, userId: string, updates: Partial<Contest>): Promise<Contest>;
  deleteUserContest(contestId: string, userId: string): Promise<void>;
  
  // Contest validation and abandonment methods
  checkAndHandleAbandonedContests(): Promise<void>;
  getContestParticipantCount(contestId: string): Promise<number>;
  
  // Contest invitation methods
  inviteFriendToContest(contestId: string, inviterId: string, inviteeId: string, message?: string): Promise<ContestInvitation>;
  getContestInvitations(userId: string): Promise<Array<ContestInvitation & { contest: Contest; inviter: User }>>;
  getSentContestInvitations(userId: string): Promise<Array<ContestInvitation & { contest: Contest; invitee: User }>>;
  acceptContestInvitation(invitationId: string, userId: string): Promise<void>;
  declineContestInvitation(invitationId: string, userId: string): Promise<void>;
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

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async uploadProfilePicture(userId: string, imageUrl: string): Promise<void> {
    await db.update(users)
      .set({ profilePicture: imageUrl, updatedAt: new Date() })
      .where(eq(users.id, userId));
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

  // Coin transaction methods
  async createCoinTransaction(transaction: Omit<CoinTransaction, 'id' | 'createdAt'>): Promise<CoinTransaction> {
    const result = await db.insert(coinTransactions).values(transaction).returning();
    return result[0];
  }

  async getUserCoinTransactions(userId: string, limit: number = 50): Promise<CoinTransaction[]> {
    return await db.select().from(coinTransactions)
      .where(eq(coinTransactions.userId, userId))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(limit);
  }

  async purchaseCoins(userId: string, amount: number, cashAmount: number, paymentMethod: string, paymentId?: string): Promise<CoinTransaction> {
    // Get current balance
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const currentBalance = user.coinsBalance;
    const newBalance = currentBalance + amount;
    
    // Update user's coin balance
    await this.updateUserCoinsBalance(userId, newBalance);
    
    // Create transaction record
    return await this.createCoinTransaction({
      userId,
      type: 'purchase',
      amount,
      coinsBefore: currentBalance,
      coinsAfter: newBalance,
      cashAmount: cashAmount.toString(),
      exchangeRate: (amount / cashAmount).toString(),
      paymentMethod,
      paymentId,
      status: 'completed',
      description: `Purchased ${amount} coins for $${cashAmount}`
    });
  }

  async exchangeCoinsForCash(userId: string, coinsAmount: number, exchangeRate: number): Promise<CoinTransaction> {
    // Get current balance
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    if (user.coinsBalance < coinsAmount) {
      throw new Error('Insufficient coins balance');
    }
    
    const currentBalance = user.coinsBalance;
    const newBalance = currentBalance - coinsAmount;
    const cashAmount = coinsAmount / exchangeRate;
    
    // Update user's coin balance
    await this.updateUserCoinsBalance(userId, newBalance);
    
    // Create transaction record
    return await this.createCoinTransaction({
      userId,
      type: 'exchange',
      amount: -coinsAmount, // negative for debit
      coinsBefore: currentBalance,
      coinsAfter: newBalance,
      cashAmount: cashAmount.toString(),
      exchangeRate: exchangeRate.toString(),
      status: 'completed',
      description: `Exchanged ${coinsAmount} coins for $${cashAmount.toFixed(2)}`
    });
  }

  getCoinExchangeRate(): number {
    // Standard rate: 100 coins = $1 USD
    return 100;
  }

  // ==================== GAMIFICATION METHODS ====================

  // XP and Level System
  async addExperiencePoints(userId: string, amount: number, source: string, description: string, metadata?: any): Promise<void> {
    await this.db.insert(xpTransactions).values({
      userId,
      amount,
      source,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null
    });

    // Update user's XP
    const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) return;

    const currentXP = user[0].experiencePoints + amount;
    const newLevel = this.calculateLevel(currentXP);
    const oldLevel = user[0].level;

    await this.db.update(users)
      .set({ 
        experiencePoints: currentXP,
        level: newLevel,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Check for level up rewards
    if (newLevel > oldLevel) {
      await this.createLevelReward(userId, newLevel);
    }
  }

  calculateLevel(experiencePoints: number): number {
    // Level formula: Level = floor(sqrt(XP / 100)) + 1
    // This means:
    // Level 1: 0-99 XP
    // Level 2: 100-399 XP  
    // Level 3: 400-899 XP
    // Level 4: 900-1599 XP
    // etc.
    return Math.floor(Math.sqrt(experiencePoints / 100)) + 1;
  }

  calculateXPForLevel(level: number): number {
    // Reverse calculation: XP = (level - 1)^2 * 100
    return Math.pow(level - 1, 2) * 100;
  }

  async createLevelReward(userId: string, level: number): Promise<void> {
    const coinReward = level * 100; // 100 coins per level
    const xpReward = level * 50; // 50 bonus XP per level

    await this.db.insert(levelRewards).values([
      {
        userId,
        level,
        rewardType: 'coins',
        rewardAmount: coinReward
      },
      {
        userId,
        level,
        rewardType: 'xp',
        rewardAmount: xpReward
      }
    ]);

    // Add coins to user balance
    await this.db.update(users)
      .set({ 
        coinsBalance: sql`coins_balance + ${coinReward}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async claimLevelReward(userId: string, rewardId: string): Promise<void> {
    await this.db.update(levelRewards)
      .set({ 
        claimed: true,
        claimedAt: new Date()
      })
      .where(and(
        eq(levelRewards.id, rewardId),
        eq(levelRewards.userId, userId)
      ));
  }

  async getUnclaimedLevelRewards(userId: string): Promise<LevelReward[]> {
    return await this.db.select()
      .from(levelRewards)
      .where(and(
        eq(levelRewards.userId, userId),
        eq(levelRewards.claimed, false)
      ))
      .orderBy(asc(levelRewards.level));
  }

  // Daily Challenges
  async createDailyChallenge(challenge: Omit<DailyChallenge, 'id' | 'createdAt'>): Promise<DailyChallenge> {
    const [newChallenge] = await this.db.insert(dailyChallenges).values(challenge).returning();
    return newChallenge;
  }

  async getTodaysChallenges(): Promise<DailyChallenge[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.db.select()
      .from(dailyChallenges)
      .where(and(
        eq(dailyChallenges.date, today),
        eq(dailyChallenges.isActive, true)
      ));
  }

  async getUserChallengeProgress(userId: string, date?: string): Promise<UserDailyChallengeProgress[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    return await this.db.select()
      .from(userDailyChallengeProgress)
      .innerJoin(dailyChallenges, eq(userDailyChallengeProgress.challengeId, dailyChallenges.id))
      .where(and(
        eq(userDailyChallengeProgress.userId, userId),
        eq(dailyChallenges.date, targetDate)
      ))
      .then(results => results.map(r => r.user_daily_challenge_progress));
  }

  async updateChallengeProgress(userId: string, challengeId: string, progress: number): Promise<void> {
    const challenge = await this.db.select().from(dailyChallenges).where(eq(dailyChallenges.id, challengeId)).limit(1);
    if (challenge.length === 0) return;

    const completed = progress >= challenge[0].target;
    
    await this.db.update(userDailyChallengeProgress)
      .set({ 
        progress,
        completed,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date()
      })
      .where(and(
        eq(userDailyChallengeProgress.userId, userId),
        eq(userDailyChallengeProgress.challengeId, challengeId)
      ));

    // Award XP and coins if completed and not yet claimed
    if (completed) {
      const existingProgress = await this.db.select()
        .from(userDailyChallengeProgress)
        .where(and(
          eq(userDailyChallengeProgress.userId, userId),
          eq(userDailyChallengeProgress.challengeId, challengeId)
        ))
        .limit(1);

      if (existingProgress.length > 0 && !existingProgress[0].claimedReward) {
        await this.addExperiencePoints(
          userId, 
          challenge[0].rewardXP, 
          'daily_challenge', 
          `Completed challenge: ${challenge[0].title}`
        );

        if (challenge[0].rewardCoins > 0) {
          await this.db.update(users)
            .set({ 
              coinsBalance: sql`coins_balance + ${challenge[0].rewardCoins}`,
              updatedAt: new Date()
            })
            .where(eq(users.id, userId));
        }

        await this.db.update(userDailyChallengeProgress)
          .set({ claimedReward: true })
          .where(and(
            eq(userDailyChallengeProgress.userId, userId),
            eq(userDailyChallengeProgress.challengeId, challengeId)
          ));
      }
    }
  }

  async initializeUserChallenges(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const todaysChallenges = await this.getTodaysChallenges();

    for (const challenge of todaysChallenges) {
      // Check if user already has progress for this challenge
      const existing = await this.db.select()
        .from(userDailyChallengeProgress)
        .where(and(
          eq(userDailyChallengeProgress.userId, userId),
          eq(userDailyChallengeProgress.challengeId, challenge.id)
        ))
        .limit(1);

      if (existing.length === 0) {
        await this.db.insert(userDailyChallengeProgress).values({
          userId,
          challengeId: challenge.id,
          progress: 0,
          completed: false,
          claimedReward: false
        });
      }
    }
  }

  // Streak Tracking
  async updateUserStreak(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) return;

    const lastActive = user[0].lastActiveDate;
    let newStreak = user[0].currentStreak;

    if (!lastActive) {
      // First time active
      newStreak = 1;
    } else {
      const lastActiveDate = new Date(lastActive);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      }
      // daysDiff === 0 means same day, keep current streak
    }

    const longestStreak = Math.max(user[0].longestStreak, newStreak);

    await this.db.update(users)
      .set({ 
        currentStreak: newStreak,
        longestStreak,
        lastActiveDate: today,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Award streak bonuses
    if (newStreak % 7 === 0) { // Weekly streak bonus
      await this.addExperiencePoints(userId, 100, 'streak_bonus', `7-day streak bonus!`);
    } else if (newStreak % 30 === 0) { // Monthly streak bonus
      await this.addExperiencePoints(userId, 500, 'streak_bonus', `30-day streak bonus!`);
    }
  }

  // Referral System
  async generateReferralCode(userId: string): Promise<string> {
    const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) throw new Error('User not found');

    if (user[0].referralCode) {
      return user[0].referralCode;
    }

    // Generate unique referral code
    const code = this.generateUniqueCode();
    
    await this.db.update(users)
      .set({ referralCode: code })
      .where(eq(users.id, userId));

    return code;
  }

  generateUniqueCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async processReferral(referredUserId: string, referralCode: string): Promise<void> {
    // Find referrer by code
    const referrer = await this.db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1);
    if (referrer.length === 0) return;

    const referrerId = referrer[0].id;

    // Update referred user
    await this.db.update(users)
      .set({ referredBy: referrerId })
      .where(eq(users.id, referredUserId));

    // Update referrer's total referrals
    await this.db.update(users)
      .set({ 
        totalReferrals: sql`total_referrals + 1`,
        updatedAt: new Date()
      })
      .where(eq(users.id, referrerId));

    // Create referral rewards
    await this.db.insert(referralRewards).values([
      {
        referrerId,
        referredId: referredUserId,
        rewardType: 'coins',
        rewardAmount: 1000 // 1000 coins for referrer
      },
      {
        referrerId,
        referredId: referredUserId,
        rewardType: 'xp',
        rewardAmount: 200 // 200 XP for referrer
      }
    ]);

    // Award coins to referrer
    await this.db.update(users)
      .set({ 
        coinsBalance: sql`coins_balance + 1000`,
        updatedAt: new Date()
      })
      .where(eq(users.id, referrerId));

    // Award XP to referrer
    await this.addExperiencePoints(referrerId, 200, 'referral', 'Referral bonus');

    // Award coins to referred user
    await this.db.update(users)
      .set({ 
        coinsBalance: sql`coins_balance + 500`,
        updatedAt: new Date()
      })
      .where(eq(users.id, referredUserId));

    await this.addExperiencePoints(referredUserId, 100, 'referral', 'Welcome bonus');
  }

  async getReferralRewards(userId: string): Promise<ReferralReward[]> {
    return await this.db.select()
      .from(referralRewards)
      .where(eq(referralRewards.referrerId, userId))
      .orderBy(desc(referralRewards.createdAt));
  }

  async claimReferralReward(userId: string, rewardId: string): Promise<void> {
    await this.db.update(referralRewards)
      .set({ 
        claimed: true,
        claimedAt: new Date()
      })
      .where(and(
        eq(referralRewards.id, rewardId),
        eq(referralRewards.referrerId, userId)
      ));
  }

  // XP Transaction History
  async getXpTransactions(userId: string, limit: number = 50): Promise<XpTransaction[]> {
    return await this.db.select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt))
      .limit(limit);
  }

  // Gamification Stats
  async getGamificationStats(userId: string): Promise<{
    level: number;
    experiencePoints: number;
    currentStreak: number;
    longestStreak: number;
    totalReferrals: number;
    unclaimedLevelRewards: number;
    todaysChallengesCompleted: number;
    todaysChallengesTotal: number;
  }> {
    const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) throw new Error('User not found');

    const unclaimedRewards = await this.getUnclaimedLevelRewards(userId);
    const todaysChallenges = await this.getTodaysChallenges();
    const todaysProgress = await this.getUserChallengeProgress(userId);

    return {
      level: user[0].level,
      experiencePoints: user[0].experiencePoints,
      currentStreak: user[0].currentStreak,
      longestStreak: user[0].longestStreak,
      totalReferrals: user[0].totalReferrals,
      unclaimedLevelRewards: unclaimedRewards.length,
      todaysChallengesCompleted: todaysProgress.filter(p => p.completed).length,
      todaysChallengesTotal: todaysChallenges.length
    };
  }

  // ==================== SOCIAL FEATURES METHODS ====================

  // Friend system methods
  async sendFriendRequest(requesterId: string, recipientId: string): Promise<FriendRequest> {
    if (requesterId === recipientId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if already friends or request exists
    const existingConnection = await this.db.select()
      .from(socialConnections)
      .where(and(
        eq(socialConnections.followerId, requesterId),
        eq(socialConnections.followingId, recipientId)
      ))
      .limit(1);

    if (existingConnection.length > 0) {
      throw new Error('Already friends or following this user');
    }

    const existingRequest = await this.db.select()
      .from(friendRequests)
      .where(and(
        eq(friendRequests.requesterId, requesterId),
        eq(friendRequests.recipientId, recipientId),
        eq(friendRequests.status, 'pending')
      ))
      .limit(1);

    if (existingRequest.length > 0) {
      throw new Error('Friend request already sent');
    }

    const [request] = await this.db.insert(friendRequests).values({
      requesterId,
      recipientId,
      status: 'pending'
    }).returning();

    return request;
  }

  async acceptFriendRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.db.select()
      .from(friendRequests)
      .where(and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.recipientId, userId),
        eq(friendRequests.status, 'pending')
      ))
      .limit(1);

    if (request.length === 0) {
      throw new Error('Friend request not found');
    }

    // Update request status
    await this.db.update(friendRequests)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(friendRequests.id, requestId));

    // Create mutual friendship
    await this.db.insert(socialConnections).values([
      {
        followerId: request[0].requesterId,
        followingId: request[0].recipientId,
        createdAt: new Date()
      },
      {
        followerId: request[0].recipientId,
        followingId: request[0].requesterId,
        createdAt: new Date()
      }
    ]);
  }

  async declineFriendRequest(requestId: string, userId: string): Promise<void> {
    await this.db.update(friendRequests)
      .set({ status: 'declined', updatedAt: new Date() })
      .where(and(
        eq(friendRequests.id, requestId),
        eq(friendRequests.recipientId, userId)
      ));
  }

  async getFriendRequests(userId: string): Promise<Array<FriendRequest & { requester: User }>> {
    const result = await this.db.select({
      id: friendRequests.id,
      requesterId: friendRequests.requesterId,
      recipientId: friendRequests.recipientId,
      status: friendRequests.status,
      createdAt: friendRequests.createdAt,
      updatedAt: friendRequests.updatedAt,
      requester: users
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.requesterId, users.id))
    .where(and(
      eq(friendRequests.recipientId, userId),
      eq(friendRequests.status, 'pending')
    ))
    .orderBy(desc(friendRequests.createdAt));

    return result;
  }

  async getSentFriendRequests(userId: string): Promise<Array<FriendRequest & { recipient: User }>> {
    const result = await this.db.select({
      id: friendRequests.id,
      requesterId: friendRequests.requesterId,
      recipientId: friendRequests.recipientId,
      status: friendRequests.status,
      createdAt: friendRequests.createdAt,
      updatedAt: friendRequests.updatedAt,
      recipient: users
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.recipientId, users.id))
    .where(eq(friendRequests.requesterId, userId))
    .orderBy(desc(friendRequests.createdAt));

    return result;
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await this.db.delete(socialConnections)
      .where(and(
        eq(socialConnections.followerId, userId),
        eq(socialConnections.followingId, friendId)
      ));

    await this.db.delete(socialConnections)
      .where(and(
        eq(socialConnections.followerId, friendId),
        eq(socialConnections.followingId, userId)
      ));
  }

  async getFriends(userId: string): Promise<Array<User & { friendshipDate: Date }>> {
    const result = await this.db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      password: users.password,
      coinsBalance: users.coinsBalance,
      profilePicture: users.profilePicture,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      dateOfBirth: users.dateOfBirth,
      location: users.location,
      isAdmin: users.isAdmin,
      level: users.level,
      experiencePoints: users.experiencePoints,
      currentStreak: users.currentStreak,
      longestStreak: users.longestStreak,
      lastActiveDate: users.lastActiveDate,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      totalReferrals: users.totalReferrals,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      friendshipDate: socialConnections.createdAt
    })
    .from(socialConnections)
    .innerJoin(users, eq(socialConnections.followingId, users.id))
    .where(eq(socialConnections.followerId, userId))
    .orderBy(desc(socialConnections.createdAt));

    return result;
  }

  // Private league methods
  async createPrivateLeague(league: Omit<PrivateLeague, 'id' | 'createdAt' | 'updatedAt'>): Promise<PrivateLeague> {
    const inviteCode = this.generateUniqueCode();
    
    const [newLeague] = await this.db.insert(privateLeagues).values({
      ...league,
      inviteCode
    }).returning();

    // Add creator as member
    await this.db.insert(privateLeagueMembers).values({
      leagueId: newLeague.id,
      userId: league.creatorId,
      role: 'creator'
    });

    return newLeague;
  }

  async joinPrivateLeague(userId: string, inviteCode: string): Promise<PrivateLeague> {
    const league = await this.db.select()
      .from(privateLeagues)
      .where(eq(privateLeagues.inviteCode, inviteCode))
      .limit(1);

    if (league.length === 0) {
      throw new Error('Invalid invite code');
    }

    // Check if already a member
    const existingMember = await this.db.select()
      .from(privateLeagueMembers)
      .where(and(
        eq(privateLeagueMembers.leagueId, league[0].id),
        eq(privateLeagueMembers.userId, userId)
      ))
      .limit(1);

    if (existingMember.length > 0) {
      throw new Error('Already a member of this league');
    }

    // Check member limit
    const memberCount = await this.db.select()
      .from(privateLeagueMembers)
      .where(eq(privateLeagueMembers.leagueId, league[0].id));

    if (memberCount.length >= league[0].maxMembers) {
      throw new Error('League is full');
    }

    // Add user as member
    await this.db.insert(privateLeagueMembers).values({
      leagueId: league[0].id,
      userId,
      role: 'member'
    });

    return league[0];
  }

  async leavePrivateLeague(userId: string, leagueId: string): Promise<void> {
    const member = await this.db.select()
      .from(privateLeagueMembers)
      .where(and(
        eq(privateLeagueMembers.leagueId, leagueId),
        eq(privateLeagueMembers.userId, userId)
      ))
      .limit(1);

    if (member.length === 0) {
      throw new Error('Not a member of this league');
    }

    if (member[0].role === 'creator') {
      throw new Error('Creator cannot leave the league');
    }

    await this.db.delete(privateLeagueMembers)
      .where(and(
        eq(privateLeagueMembers.leagueId, leagueId),
        eq(privateLeagueMembers.userId, userId)
      ));
  }

  async getPrivateLeagues(userId: string): Promise<Array<PrivateLeague & { memberCount: number; isMember: boolean }>> {
    const allLeagues = await this.db.select().from(privateLeagues);
    const userMemberships = await this.db.select()
      .from(privateLeagueMembers)
      .where(eq(privateLeagueMembers.userId, userId));

    const userLeagueIds = new Set(userMemberships.map(m => m.leagueId));

    const result = await Promise.all(
      allLeagues.map(async (league) => {
        const memberCount = await this.db.select()
          .from(privateLeagueMembers)
          .where(eq(privateLeagueMembers.leagueId, league.id));

        return {
          ...league,
          memberCount: memberCount.length,
          isMember: userLeagueIds.has(league.id)
        };
      })
    );

    return result;
  }

  async getPrivateLeagueMembers(leagueId: string): Promise<Array<User & { role: string; joinedAt: Date }>> {
    const result = await this.db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      password: users.password,
      coinsBalance: users.coinsBalance,
      profilePicture: users.profilePicture,
      bio: users.bio,
      phoneNumber: users.phoneNumber,
      dateOfBirth: users.dateOfBirth,
      location: users.location,
      isAdmin: users.isAdmin,
      level: users.level,
      experiencePoints: users.experiencePoints,
      currentStreak: users.currentStreak,
      longestStreak: users.longestStreak,
      lastActiveDate: users.lastActiveDate,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      totalReferrals: users.totalReferrals,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      role: privateLeagueMembers.role,
      joinedAt: privateLeagueMembers.joinedAt
    })
    .from(privateLeagueMembers)
    .innerJoin(users, eq(privateLeagueMembers.userId, users.id))
    .where(eq(privateLeagueMembers.leagueId, leagueId))
    .orderBy(asc(privateLeagueMembers.joinedAt));

    return result;
  }

  async addContestToLeague(leagueId: string, contestId: string, userId: string): Promise<PrivateLeagueContest> {
    // Check if user is a member of the league
    const membership = await this.db.select()
      .from(privateLeagueMembers)
      .where(and(
        eq(privateLeagueMembers.leagueId, leagueId),
        eq(privateLeagueMembers.userId, userId)
      ))
      .limit(1);

    if (membership.length === 0) {
      throw new Error('Not a member of this league');
    }

    const [leagueContest] = await this.db.insert(privateLeagueContests).values({
      leagueId,
      contestId,
      createdBy: userId
    }).returning();

    return leagueContest;
  }

  async getLeagueContests(leagueId: string): Promise<Array<Contest & { addedBy: User; addedAt: Date }>> {
    const result = await this.db.select({
      id: contests.id,
      name: contests.name,
      description: contests.description,
      entryFee: contests.entryFee,
      prizePool: contests.prizePool,
      maxParticipants: contests.maxParticipants,
      startTime: contests.startTime,
      endTime: contests.endTime,
      status: contests.status,
      featured: contests.featured,
      createdAt: contests.createdAt,
      addedBy: users,
      addedAt: privateLeagueContests.createdAt
    })
    .from(privateLeagueContests)
    .innerJoin(contests, eq(privateLeagueContests.contestId, contests.id))
    .innerJoin(users, eq(privateLeagueContests.createdBy, users.id))
    .where(eq(privateLeagueContests.leagueId, leagueId))
    .orderBy(desc(privateLeagueContests.createdAt));

    return result;
  }

  // Contest comments methods
  async addContestComment(comment: Omit<ContestComment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContestComment> {
    const [newComment] = await this.db.insert(contestComments).values(comment).returning();
    return newComment;
  }

  async getContestComments(contestId: string, limit: number = 50): Promise<Array<ContestComment & { user: User; replies: Array<ContestComment & { user: User }> }>> {
    // Get top-level comments
    const topLevelComments = await this.db.select({
      id: contestComments.id,
      contestId: contestComments.contestId,
      userId: contestComments.userId,
      parentCommentId: contestComments.parentCommentId,
      content: contestComments.content,
      likes: contestComments.likes,
      isEdited: contestComments.isEdited,
      createdAt: contestComments.createdAt,
      updatedAt: contestComments.updatedAt,
      user: users
    })
    .from(contestComments)
    .innerJoin(users, eq(contestComments.userId, users.id))
    .where(and(
      eq(contestComments.contestId, contestId),
      eq(contestComments.parentCommentId, null)
    ))
    .orderBy(desc(contestComments.createdAt))
    .limit(limit);

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await this.db.select({
          id: contestComments.id,
          contestId: contestComments.contestId,
          userId: contestComments.userId,
          parentCommentId: contestComments.parentCommentId,
          content: contestComments.content,
          likes: contestComments.likes,
          isEdited: contestComments.isEdited,
          createdAt: contestComments.createdAt,
          updatedAt: contestComments.updatedAt,
          user: users
        })
        .from(contestComments)
        .innerJoin(users, eq(contestComments.userId, users.id))
        .where(eq(contestComments.parentCommentId, comment.id))
        .orderBy(asc(contestComments.createdAt));

        return {
          ...comment,
          replies
        };
      })
    );

    return commentsWithReplies;
  }

  async likeComment(commentId: string, userId: string): Promise<void> {
    // Check if already liked
    const existingLike = await this.db.select()
      .from(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      ))
      .limit(1);

    if (existingLike.length > 0) {
      return; // Already liked
    }

    // Add like
    await this.db.insert(commentLikes).values({
      commentId,
      userId
    });

    // Update comment like count
    await this.db.update(contestComments)
      .set({ likes: sql`likes + 1` })
      .where(eq(contestComments.id, commentId));
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    // Remove like
    await this.db.delete(commentLikes)
      .where(and(
        eq(commentLikes.commentId, commentId),
        eq(commentLikes.userId, userId)
      ));

    // Update comment like count
    await this.db.update(contestComments)
      .set({ likes: sql`likes - 1` })
      .where(eq(contestComments.id, commentId));
  }

  async editComment(commentId: string, userId: string, content: string): Promise<void> {
    await this.db.update(contestComments)
      .set({ 
        content,
        isEdited: true,
        updatedAt: new Date()
      })
      .where(and(
        eq(contestComments.id, commentId),
        eq(contestComments.userId, userId)
      ));
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    await this.db.delete(contestComments)
      .where(and(
        eq(contestComments.id, commentId),
        eq(contestComments.userId, userId)
      ));
  }

  // Achievement sharing methods
  async shareAchievement(share: Omit<AchievementShare, 'id' | 'createdAt'>): Promise<AchievementShare> {
    const [newShare] = await this.db.insert(achievementShares).values(share).returning();
    return newShare;
  }

  async getAchievementShares(userId: string, limit: number = 20): Promise<Array<AchievementShare & { achievement: Achievement; contest?: Contest }>> {
    const result = await this.db.select({
      id: achievementShares.id,
      userId: achievementShares.userId,
      achievementId: achievementShares.achievementId,
      contestId: achievementShares.contestId,
      message: achievementShares.message,
      platform: achievementShares.platform,
      createdAt: achievementShares.createdAt,
      achievement: achievements,
      contest: contests
    })
    .from(achievementShares)
    .innerJoin(achievements, eq(achievementShares.achievementId, achievements.id))
    .leftJoin(contests, eq(achievementShares.contestId, contests.id))
    .where(eq(achievementShares.userId, userId))
    .orderBy(desc(achievementShares.createdAt))
    .limit(limit);

    return result;
  }

  // Chat methods
  async sendChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage> {
    // Check if user is a member of the league
    const membership = await this.db.select()
      .from(privateLeagueMembers)
      .where(and(
        eq(privateLeagueMembers.leagueId, message.leagueId),
        eq(privateLeagueMembers.userId, message.userId)
      ))
      .limit(1);

    if (membership.length === 0) {
      throw new Error('Not a member of this league');
    }

    const [newMessage] = await this.db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getChatMessages(leagueId: string, limit: number = 100): Promise<Array<ChatMessage & { user: User }>> {
    const result = await this.db.select({
      id: chatMessages.id,
      leagueId: chatMessages.leagueId,
      userId: chatMessages.userId,
      content: chatMessages.content,
      messageType: chatMessages.messageType,
      isEdited: chatMessages.isEdited,
      createdAt: chatMessages.createdAt,
      updatedAt: chatMessages.updatedAt,
      user: users
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .where(eq(chatMessages.leagueId, leagueId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

    return result.reverse(); // Return in chronological order
  }

  async editChatMessage(messageId: string, userId: string, content: string): Promise<void> {
    await this.db.update(chatMessages)
      .set({ 
        content,
        isEdited: true,
        updatedAt: new Date()
      })
      .where(and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.userId, userId)
      ));
  }

  async deleteChatMessage(messageId: string, userId: string): Promise<void> {
    await this.db.delete(chatMessages)
      .where(and(
        eq(chatMessages.id, messageId),
        eq(chatMessages.userId, userId)
      ));
  }

  // User contest creation methods
  async createUserContest(contest: Omit<Contest, 'id' | 'createdAt'>): Promise<Contest> {
    const [newContest] = await this.db.insert(contests).values(contest).returning();
    return newContest;
  }

  async getUserContests(userId: string): Promise<Contest[]> {
    return await this.db.select()
      .from(contests)
      .where(eq(contests.createdBy, userId))
      .orderBy(desc(contests.createdAt));
  }

  async updateUserContest(contestId: string, userId: string, updates: Partial<Contest>): Promise<Contest> {
    const [updatedContest] = await this.db.update(contests)
      .set(updates)
      .where(and(
        eq(contests.id, contestId),
        eq(contests.createdBy, userId)
      ))
      .returning();
    
    if (!updatedContest) {
      throw new Error('Contest not found or you do not have permission to update it');
    }
    
    return updatedContest;
  }

  async deleteUserContest(contestId: string, userId: string): Promise<void> {
    const result = await this.db.delete(contests)
      .where(and(
        eq(contests.id, contestId),
        eq(contests.createdBy, userId)
      ));
    
    if (result.rowCount === 0) {
      throw new Error('Contest not found or you do not have permission to delete it');
    }
  }

  // Contest invitation methods
  async inviteFriendToContest(contestId: string, inviterId: string, inviteeId: string, message?: string): Promise<ContestInvitation> {
    const [invitation] = await this.db.insert(contestInvitations).values({
      contestId,
      inviterId,
      inviteeId,
      message,
      status: 'pending'
    }).returning();
    
    return invitation;
  }

  async getContestInvitations(userId: string): Promise<Array<ContestInvitation & { contest: Contest; inviter: User }>> {
    return await this.db.select({
      id: contestInvitations.id,
      contestId: contestInvitations.contestId,
      inviterId: contestInvitations.inviterId,
      inviteeId: contestInvitations.inviteeId,
      message: contestInvitations.message,
      status: contestInvitations.status,
      createdAt: contestInvitations.createdAt,
      updatedAt: contestInvitations.updatedAt,
      contest: {
        id: contests.id,
        name: contests.name,
        description: contests.description,
        entryFee: contests.entryFee,
        prizePool: contests.prizePool,
        maxParticipants: contests.maxParticipants,
        startTime: contests.startTime,
        endTime: contests.endTime,
        status: contests.status,
        featured: contests.featured,
        createdBy: contests.createdBy,
        visibility: contests.visibility,
        inviteCode: contests.inviteCode,
        allowFriends: contests.allowFriends,
        createdAt: contests.createdAt
      },
      inviter: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        profilePicture: users.profilePicture,
        coinsBalance: users.coinsBalance,
        xp: users.xp,
        level: users.level,
        createdAt: users.createdAt,
        lastUpdated: users.lastUpdated,
        isActive: users.isActive
      }
    })
    .from(contestInvitations)
    .innerJoin(contests, eq(contestInvitations.contestId, contests.id))
    .innerJoin(users, eq(contestInvitations.inviterId, users.id))
    .where(eq(contestInvitations.inviteeId, userId))
    .orderBy(desc(contestInvitations.createdAt));
  }

  async getSentContestInvitations(userId: string): Promise<Array<ContestInvitation & { contest: Contest; invitee: User }>> {
    return await this.db.select({
      id: contestInvitations.id,
      contestId: contestInvitations.contestId,
      inviterId: contestInvitations.inviterId,
      inviteeId: contestInvitations.inviteeId,
      message: contestInvitations.message,
      status: contestInvitations.status,
      createdAt: contestInvitations.createdAt,
      updatedAt: contestInvitations.updatedAt,
      contest: {
        id: contests.id,
        name: contests.name,
        description: contests.description,
        entryFee: contests.entryFee,
        prizePool: contests.prizePool,
        maxParticipants: contests.maxParticipants,
        startTime: contests.startTime,
        endTime: contests.endTime,
        status: contests.status,
        featured: contests.featured,
        createdBy: contests.createdBy,
        visibility: contests.visibility,
        inviteCode: contests.inviteCode,
        allowFriends: contests.allowFriends,
        createdAt: contests.createdAt
      },
      invitee: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email,
        profilePicture: users.profilePicture,
        coinsBalance: users.coinsBalance,
        xp: users.xp,
        level: users.level,
        createdAt: users.createdAt,
        lastUpdated: users.lastUpdated,
        isActive: users.isActive
      }
    })
    .from(contestInvitations)
    .innerJoin(contests, eq(contestInvitations.contestId, contests.id))
    .innerJoin(users, eq(contestInvitations.inviteeId, users.id))
    .where(eq(contestInvitations.inviterId, userId))
    .orderBy(desc(contestInvitations.createdAt));
  }

  async acceptContestInvitation(invitationId: string, userId: string): Promise<void> {
    await this.db.update(contestInvitations)
      .set({
        status: 'accepted',
        updatedAt: new Date()
      })
      .where(and(
        eq(contestInvitations.id, invitationId),
        eq(contestInvitations.inviteeId, userId)
      ));
  }

  async declineContestInvitation(invitationId: string, userId: string): Promise<void> {
    await this.db.update(contestInvitations)
      .set({
        status: 'declined',
        updatedAt: new Date()
      })
      .where(and(
        eq(contestInvitations.id, invitationId),
        eq(contestInvitations.inviteeId, userId)
      ));
  }

  // Contest validation and abandonment methods
  async getContestParticipantCount(contestId: string): Promise<number> {
    const result = await this.db.select({ count: sql<number>`count(*)` })
      .from(contestEntries)
      .where(eq(contestEntries.contestId, contestId));
    
    return result[0]?.count || 0;
  }

  async checkAndHandleAbandonedContests(): Promise<void> {
    // Get all upcoming contests that should have started but have less than 2 participants
    const now = new Date();
    const abandonedContests = await this.db.select()
      .from(contests)
      .where(and(
        eq(contests.status, 'upcoming'),
        sql`${contests.startTime} <= ${now}`
      ));

    for (const contest of abandonedContests) {
      const participantCount = await this.getContestParticipantCount(contest.id);
      
      if (participantCount < 2) {
        // Mark contest as abandoned
        await this.db.update(contests)
          .set({ status: 'cancelled' })
          .where(eq(contests.id, contest.id));
        
        console.log(`Contest "${contest.name}" (${contest.id}) marked as abandoned - only ${participantCount} participants`);
        
        // Refund entry fees to participants
        const entries = await this.db.select()
          .from(contestEntries)
          .where(eq(contestEntries.contestId, contest.id));
        
        for (const entry of entries) {
          // Refund the entry fee
          await this.updateUserCoinsBalance(entry.userId, contest.entryFee);
          
          // Record the refund transaction
          await this.db.insert(coinTransactions).values({
            userId: entry.userId,
            amount: contest.entryFee,
            type: 'refund',
            description: `Refund for abandoned contest: ${contest.name}`,
            contestId: contest.id
          });
        }
      }
    }
  }
}

// Export singleton instance
export const storage = new DatabaseStorage();
