import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { stockPriceService } from "./stockPriceService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Stocks API
  app.get("/api/stocks", async (req, res) => {
    try {
      const stocks = await storage.getAllStocks();
      res.json(stocks);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      res.status(500).json({ error: "Failed to fetch stocks" });
    }
  });

  app.get("/api/stocks/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const stock = await storage.getStock(symbol);
      if (!stock) {
        return res.status(404).json({ error: "Stock not found" });
      }
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ error: "Failed to fetch stock" });
    }
  });

  // Contests API
  app.get("/api/contests", async (req, res) => {
    try {
      const contests = await storage.getActiveContests();
      res.json(contests);
    } catch (error) {
      console.error("Error fetching contests:", error);
      res.status(500).json({ error: "Failed to fetch contests" });
    }
  });

  app.get("/api/contests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const contest = await storage.getContest(id);
      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }
      res.json(contest);
    } catch (error) {
      console.error("Error fetching contest:", error);
      res.status(500).json({ error: "Failed to fetch contest" });
    }
  });

  // Contest entries and leaderboard
  app.get("/api/contests/:id/leaderboard", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;
      const enhanced = req.query.enhanced === 'true';
      
      if (enhanced) {
        const result = await storage.getEnhancedLeaderboard(id, userId);
        res.json(result);
      } else {
        const entries = await storage.getContestEntries(id);
        
        // Transform entries to leaderboard format
        const leaderboard = entries.map((entry, index) => ({
          rank: entry.rank || index + 1,
          userId: entry.userId,
          username: `User${entry.userId.slice(-4)}`, // Temporary until we have real users
          portfolioValue: parseFloat(entry.finalPortfolioValue || "100"),
          roi: parseFloat(entry.roi || "0")
        }));

        res.json(leaderboard);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Leaderboard history
  app.get("/api/contests/:id/leaderboard/history", async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const history = await storage.getLeaderboardHistory(id, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching leaderboard history:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard history" });
    }
  });

  // Portfolio creation (join contest) - requires authentication
  app.post("/api/contests/:id/join", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id: contestId } = req.params;
      const { portfolio } = req.body;
      const userId = req.user!.id; // Get user ID from authenticated session

      // Validate portfolio (should total 100 coins)
      const totalCoins = portfolio.reduce((sum: number, holding: any) => sum + holding.coinsInvested, 0);
      if (totalCoins !== 100) {
        return res.status(400).json({ error: "Portfolio must total exactly 100 coins" });
      }

      // Check if contest exists
      const contest = await storage.getContest(contestId);
      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      // Check if user already joined this contest
      const existingEntry = await storage.getContestEntry(userId, contestId);
      if (existingEntry) {
        return res.status(400).json({ error: "Already joined this contest" });
      }

      // Create contest entry
      const entry = await storage.createContestEntry({
        userId,
        contestId,
        totalCoinsInvested: 100,
        finalPortfolioValue: null,
        roi: null,
        rank: null
      });

      // Create portfolio holdings
      for (const holding of portfolio) {
        const stock = await storage.getStock(holding.stockSymbol);
        if (!stock) {
          return res.status(400).json({ error: `Invalid stock: ${holding.stockSymbol}` });
        }

        const shares = holding.coinsInvested / parseFloat(stock.currentPrice);
        await storage.createPortfolioHolding({
          entryId: entry.id,
          stockSymbol: holding.stockSymbol,
          coinsInvested: holding.coinsInvested,
          sharesQuantity: shares.toString(),
          purchasePrice: stock.currentPrice
        });
      }

      res.json({ success: true, entryId: entry.id });
    } catch (error) {
      console.error("Error joining contest:", error);
      res.status(500).json({ error: "Failed to join contest" });
    }
  });

  // User portfolio for a specific contest - requires authentication
  app.get("/api/users/:userId/contests/:contestId/portfolio", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const userId = req.user!.id; // Get user ID from authenticated session
      
      const entry = await storage.getContestEntry(userId, contestId);
      if (!entry) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      const holdings = await storage.getPortfolioHoldings(entry.id);
      
      // Enrich holdings with current stock data
      const enrichedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          const stock = await storage.getStock(holding.stockSymbol);
          const currentValue = parseFloat(holding.sharesQuantity) * parseFloat(stock!.currentPrice);
          const plAmount = currentValue - holding.coinsInvested;
          const plPercent = (plAmount / holding.coinsInvested) * 100;

          return {
            symbol: holding.stockSymbol,
            companyName: stock!.companyName,
            quantity: parseFloat(holding.sharesQuantity),
            avgPrice: parseFloat(holding.purchasePrice),
            currentPrice: parseFloat(stock!.currentPrice),
            currentValue,
            plAmount,
            plPercent,
            coinsInvested: holding.coinsInvested
          };
        })
      );

      res.json({
        contestId,
        totalInvested: 100,
        currentValue: enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0),
        holdings: enrichedHoldings
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ error: "Failed to fetch portfolio" });
    }
  });

  // Portfolio analytics - requires authentication
  app.get("/api/users/:userId/contests/:contestId/portfolio/analytics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const userId = req.user!.id; // Get user ID from authenticated session
      
      const entry = await storage.getContestEntry(userId, contestId);
      if (!entry) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      const analytics = await storage.getPortfolioAnalytics(entry.id);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching portfolio analytics:", error);
      res.status(500).json({ error: "Failed to fetch portfolio analytics" });
    }
  });

  // Portfolio performance history - requires authentication
  app.get("/api/users/:userId/contests/:contestId/portfolio/performance", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const userId = req.user!.id; // Get user ID from authenticated session
      
      const entry = await storage.getContestEntry(userId, contestId);
      if (!entry) {
        return res.status(404).json({ error: "Portfolio not found" });
      }

      const performanceHistory = await storage.getPortfolioPerformanceHistory(entry.id);
      
      res.json(performanceHistory);
    } catch (error) {
      console.error("Error fetching portfolio performance:", error);
      res.status(500).json({ error: "Failed to fetch portfolio performance" });
    }
  });

  // User's contests - requires authentication
  app.get("/api/users/:userId/contests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can access their own contests
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const userContests = await storage.getUserContestEntries(userId);
      
      // Transform to include additional information
      const enrichedContests = userContests.map(entry => ({
        id: entry.contest.id,
        name: entry.contest.name,
        description: entry.contest.description,
        entryFee: entry.contest.entryFee,
        prizePool: entry.contest.prizePool,
        maxParticipants: entry.contest.maxParticipants,
        startTime: entry.contest.startTime,
        endTime: entry.contest.endTime,
        status: entry.contest.status,
        featured: entry.contest.featured,
        // Entry-specific data
        entryId: entry.id,
        totalCoinsInvested: entry.totalCoinsInvested,
        finalPortfolioValue: entry.finalPortfolioValue,
        roi: entry.roi,
        rank: entry.rank,
        joinedAt: entry.createdAt
      }));

      res.json(enrichedContests);
    } catch (error) {
      console.error("Error fetching user contests:", error);
      res.status(500).json({ error: "Failed to fetch user contests" });
    }
  });

  // User statistics API
  app.get("/api/users/:userId/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can access their own stats
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get user's contest entries
      const allContests = await storage.getAllContests();
      const userEntries = [];
      
      for (const contest of allContests) {
        try {
          const entries = await storage.getContestEntries(contest.id);
          const userEntry = entries.find(entry => entry.userId === userId);
          if (userEntry) {
            userEntries.push({
              ...userEntry,
              contestName: contest.name,
              contestStatus: contest.status
            });
          }
        } catch (error) {
          // Skip contests with no entries
        }
      }

      // Calculate statistics
      const totalContests = userEntries.length;
      const completedContests = userEntries.filter(entry => entry.contestStatus === 'completed');
      const wins = completedContests.filter(entry => entry.rank && entry.rank <= 3).length;
      const winRate = completedContests.length > 0 ? (wins / completedContests.length) * 100 : 0;
      
      // Calculate average ROI
      const rois = completedContests
        .filter(entry => entry.roi !== null)
        .map(entry => parseFloat(entry.roi!));
      const avgROI = rois.length > 0 ? rois.reduce((sum, roi) => sum + roi, 0) / rois.length : 0;
      
      // Get best rank
      const ranks = completedContests
        .filter(entry => entry.rank !== null)
        .map(entry => entry.rank!);
      const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;

      // Get recent performance (last 5 contests)
      const recentPerformance = completedContests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(entry => ({
          rank: entry.rank || 0,
          userId: entry.userId,
          username: req.user?.username || 'User',
          portfolioValue: parseFloat(entry.finalPortfolioValue || '0'),
          roi: parseFloat(entry.roi || '0'),
          contestName: entry.contestName
        }));

      res.json({
        totalContests,
        winRate: Math.round(winRate * 10) / 10,
        avgROI: Math.round(avgROI * 10) / 10,
        bestRank,
        recentPerformance
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });

  // Real-time stock price API
  app.get("/api/stocks/prices", async (req, res) => {
    try {
      const prices = stockPriceService.getAllStockPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching stock prices:", error);
      res.status(500).json({ error: "Failed to fetch stock prices" });
    }
  });

  app.get("/api/stocks/:symbol/price", async (req, res) => {
    try {
      const { symbol } = req.params;
      const price = stockPriceService.getStockPrice(symbol);
      
      if (!price) {
        return res.status(404).json({ error: "Stock price not found" });
      }
      
      res.json(price);
    } catch (error) {
      console.error("Error fetching stock price:", error);
      res.status(500).json({ error: "Failed to fetch stock price" });
    }
  });

  app.post("/api/stocks/:symbol/refresh", async (req, res) => {
    try {
      const { symbol } = req.params;
      const price = await stockPriceService.refreshStockPrice(symbol);
      
      if (!price) {
        return res.status(404).json({ error: "Stock not found" });
      }
      
      res.json(price);
    } catch (error) {
      console.error("Error refreshing stock price:", error);
      res.status(500).json({ error: "Failed to refresh stock price" });
    }
  });

  // Social features - requires authentication
  app.post("/api/users/:userId/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId: followingId } = req.params;
      const followerId = req.user!.id;

      if (followerId === followingId) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      const connection = await storage.followUser(followerId, followingId);
      res.json(connection);
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ error: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:userId/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId: followingId } = req.params;
      const followerId = req.user!.id;

      await storage.unfollowUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ error: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/:userId/followers", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ error: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:userId/following", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const following = await storage.getFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ error: "Failed to fetch following" });
    }
  });

  // Achievements - requires authentication
  app.get("/api/achievements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const achievements = await storage.getAllAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/users/:userId/achievements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/users/:userId/achievements/check", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { contestId } = req.body;
      
      const newAchievements = await storage.checkAndAwardAchievements(userId, contestId);
      res.json(newAchievements);
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ error: "Failed to check achievements" });
    }
  });

  // User stats
  app.get("/api/users/:userId/stats/detailed", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const stats = await storage.getUserStats(userId);
      res.json(stats || {
        totalContests: 0,
        totalWins: 0,
        totalTopThree: 0,
        bestRank: null,
        bestROI: null,
        totalCoinsEarned: 0,
        longestWinStreak: 0,
        currentWinStreak: 0
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const stocks = await storage.getAllStocks();
      res.json({ 
        status: "healthy", 
        database: "connected",
        stocksCount: stocks.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({ 
        status: "unhealthy", 
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
