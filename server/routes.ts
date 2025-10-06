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

  // User contest creation routes
  app.post("/api/contests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { name, description, entryFee, prizePool, maxParticipants, startTime, endTime, visibility, allowFriends } = req.body;

      // Validate required fields
      if (!name || !entryFee || !prizePool || !maxParticipants || !startTime || !endTime) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate minimum participants
      if (parseInt(maxParticipants) < 2) {
        return res.status(400).json({ error: "Contest must have at least 2 participants" });
      }

      // Validate dates
      const start = new Date(startTime);
      const end = new Date(endTime);
      const now = new Date();

      if (start <= now) {
        return res.status(400).json({ error: "Start time must be in the future" });
      }

      if (end <= start) {
        return res.status(400).json({ error: "End time must be after start time" });
      }

      // Generate invite code for private contests
      let inviteCode = null;
      if (visibility === 'private') {
        inviteCode = Math.random().toString(36).substring(2, 12).toUpperCase();
      }

      const contest = await storage.createUserContest({
        name,
        description,
        entryFee: parseInt(entryFee),
        prizePool: parseInt(prizePool),
        maxParticipants: parseInt(maxParticipants),
        startTime: start,
        endTime: end,
        status: 'upcoming',
        featured: false,
        createdBy: userId,
        visibility: visibility || 'public',
        inviteCode,
        allowFriends: allowFriends !== false
      });

      res.json(contest);
    } catch (error) {
      console.error("Error creating contest:", error);
      res.status(500).json({ error: "Failed to create contest" });
    }
  });

  app.get("/api/users/:userId/contests/created", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;

      // Users can only view their own created contests
      if (userId !== currentUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const contests = await storage.getUserContests(userId);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching user contests:", error);
      res.status(500).json({ error: "Failed to fetch contests" });
    }
  });

  app.put("/api/contests/:contestId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      // Remove fields that shouldn't be updated
      delete updates.id;
      delete updates.createdAt;
      delete updates.createdBy;

      const contest = await storage.updateUserContest(contestId, userId, updates);
      res.json(contest);
    } catch (error) {
      console.error("Error updating contest:", error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to update contest" });
      }
    }
  });

  app.delete("/api/contests/:contestId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const userId = req.user!.id;

      await storage.deleteUserContest(contestId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contest:", error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to delete contest" });
      }
    }
  });

  // Contest invitation routes
  app.post("/api/contests/:contestId/invite", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const { inviteeId, message } = req.body;
      const inviterId = req.user!.id;

      if (!inviteeId) {
        return res.status(400).json({ error: "Invitee ID is required" });
      }

      const invitation = await storage.inviteFriendToContest(contestId, inviterId, inviteeId, message);
      res.json(invitation);
    } catch (error) {
      console.error("Error inviting friend to contest:", error);
      res.status(500).json({ error: "Failed to send invitation" });
    }
  });

  app.get("/api/users/:userId/contest-invitations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;

      if (userId !== currentUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitations = await storage.getContestInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching contest invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.get("/api/users/:userId/sent-contest-invitations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user!.id;

      if (userId !== currentUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const invitations = await storage.getSentContestInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching sent contest invitations:", error);
      res.status(500).json({ error: "Failed to fetch sent invitations" });
    }
  });

  app.post("/api/contest-invitations/:invitationId/accept", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user!.id;

      await storage.acceptContestInvitation(invitationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting contest invitation:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  app.post("/api/contest-invitations/:invitationId/decline", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user!.id;

      await storage.declineContestInvitation(invitationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error declining contest invitation:", error);
      res.status(500).json({ error: "Failed to decline invitation" });
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

  // Profile management API
  app.get("/api/users/:userId/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can access their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return profile data without sensitive information
      const profileData = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        coinsBalance: user.coinsBalance,
        profilePicture: user.profilePicture,
        bio: user.bio,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        location: user.location,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.put("/api/users/:userId/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can update their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { fullName, bio, phoneNumber, dateOfBirth, location } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        bio,
        phoneNumber,
        dateOfBirth,
        location
      });

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        coinsBalance: updatedUser.coinsBalance,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        phoneNumber: updatedUser.phoneNumber,
        dateOfBirth: updatedUser.dateOfBirth,
        location: updatedUser.location,
        updatedAt: updatedUser.updatedAt
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/users/:userId/profile/picture", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { imageUrl } = req.body;
      
      // Verify user can update their own profile
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      await storage.uploadProfilePicture(userId, imageUrl);
      
      res.json({ success: true, message: "Profile picture updated successfully" });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  });

  // Coin management API
  app.get("/api/users/:userId/coins/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can access their own transactions
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getUserCoinTransactions(userId, limit);
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching coin transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/users/:userId/coins/purchase", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can purchase coins
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { amount, paymentMethod, paymentId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const exchangeRate = storage.getCoinExchangeRate();
      const cashAmount = amount / exchangeRate;
      
      const transaction = await storage.purchaseCoins(userId, amount, cashAmount, paymentMethod, paymentId);
      
      res.json({
        success: true,
        transaction,
        message: `Successfully purchased ${amount} coins for $${cashAmount.toFixed(2)}`
      });
    } catch (error) {
      console.error("Error purchasing coins:", error);
      res.status(500).json({ error: "Failed to purchase coins" });
    }
  });

  app.post("/api/users/:userId/coins/exchange", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // Verify user can exchange coins
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { coinsAmount } = req.body;
      
      if (!coinsAmount || coinsAmount <= 0) {
        return res.status(400).json({ error: "Invalid coins amount" });
      }

      const exchangeRate = storage.getCoinExchangeRate();
      const transaction = await storage.exchangeCoinsForCash(userId, coinsAmount, exchangeRate);
      
      res.json({
        success: true,
        transaction,
        message: `Successfully exchanged ${coinsAmount} coins for $${(coinsAmount / exchangeRate).toFixed(2)}`
      });
    } catch (error) {
      console.error("Error exchanging coins:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to exchange coins" });
    }
  });

  app.get("/api/coins/exchange-rate", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const exchangeRate = storage.getCoinExchangeRate();
      res.json({ exchangeRate, rateText: `${exchangeRate} coins = $1 USD` });
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      res.status(500).json({ error: "Failed to fetch exchange rate" });
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
          console.log(`Skipping contest ${contest.id} - no entries found`);
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
        .filter(entry => entry.roi !== null && entry.roi !== undefined)
        .map(entry => parseFloat(entry.roi!));
      const avgROI = rois.length > 0 ? rois.reduce((sum, roi) => sum + roi, 0) / rois.length : 0;
      
      // Get best rank
      const ranks = completedContests
        .filter(entry => entry.rank !== null && entry.rank !== undefined)
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

      // Return statistics even if user has no contests
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

  // ==================== GAMIFICATION API ENDPOINTS ====================

  // Gamification Stats
  app.get("/api/users/:userId/gamification", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const stats = await storage.getGamificationStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching gamification stats:", error);
      res.status(500).json({ error: "Failed to fetch gamification stats" });
    }
  });

  // XP Transactions History
  app.get("/api/users/:userId/xp-transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getXpTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching XP transactions:", error);
      res.status(500).json({ error: "Failed to fetch XP transactions" });
    }
  });

  // Daily Challenges
  app.get("/api/daily-challenges", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const challenges = await storage.getTodaysChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching daily challenges:", error);
      res.status(500).json({ error: "Failed to fetch daily challenges" });
    }
  });

  app.get("/api/users/:userId/daily-challenges", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const progress = await storage.getUserChallengeProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user challenge progress:", error);
      res.status(500).json({ error: "Failed to fetch challenge progress" });
    }
  });

  app.post("/api/users/:userId/daily-challenges/initialize", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.initializeUserChallenges(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error initializing user challenges:", error);
      res.status(500).json({ error: "Failed to initialize challenges" });
    }
  });

  app.post("/api/users/:userId/challenges/:challengeId/progress", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId, challengeId } = req.params;
      const { progress } = req.body;

      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (typeof progress !== 'number' || progress < 0) {
        return res.status(400).json({ error: "Invalid progress value" });
      }

      await storage.updateChallengeProgress(userId, challengeId, progress);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating challenge progress:", error);
      res.status(500).json({ error: "Failed to update challenge progress" });
    }
  });

  // Level Rewards
  app.get("/api/users/:userId/level-rewards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const rewards = await storage.getUnclaimedLevelRewards(userId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching level rewards:", error);
      res.status(500).json({ error: "Failed to fetch level rewards" });
    }
  });

  app.post("/api/users/:userId/level-rewards/:rewardId/claim", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId, rewardId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.claimLevelReward(userId, rewardId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error claiming level reward:", error);
      res.status(500).json({ error: "Failed to claim level reward" });
    }
  });

  // Referral System
  app.get("/api/users/:userId/referral-code", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const referralCode = await storage.generateReferralCode(userId);
      res.json({ referralCode });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ error: "Failed to generate referral code" });
    }
  });

  app.post("/api/users/:userId/process-referral", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const { referralCode } = req.body;

      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!referralCode || typeof referralCode !== 'string') {
        return res.status(400).json({ error: "Invalid referral code" });
      }

      await storage.processReferral(userId, referralCode);
      res.json({ success: true });
    } catch (error) {
      console.error("Error processing referral:", error);
      res.status(500).json({ error: "Failed to process referral" });
    }
  });

  app.get("/api/users/:userId/referral-rewards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const rewards = await storage.getReferralRewards(userId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching referral rewards:", error);
      res.status(500).json({ error: "Failed to fetch referral rewards" });
    }
  });

  // Streak Tracking
  app.post("/api/users/:userId/update-streak", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.updateUserStreak(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user streak:", error);
      res.status(500).json({ error: "Failed to update streak" });
    }
  });

  // ==================== SOCIAL FEATURES API ENDPOINTS ====================

  // Friend System
  app.post("/api/users/:userId/friend-request", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId: recipientId } = req.params;
      const requesterId = req.user!.id;

      if (requesterId === recipientId) {
        return res.status(400).json({ error: "Cannot send friend request to yourself" });
      }

      const request = await storage.sendFriendRequest(requesterId, recipientId);
      res.json(request);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send friend request" });
    }
  });

  app.post("/api/friend-requests/:requestId/accept", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user!.id;

      await storage.acceptFriendRequest(requestId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to accept friend request" });
    }
  });

  app.post("/api/friend-requests/:requestId/decline", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user!.id;

      await storage.declineFriendRequest(requestId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).json({ error: "Failed to decline friend request" });
    }
  });

  app.get("/api/users/:userId/friend-requests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ error: "Failed to fetch friend requests" });
    }
  });

  app.get("/api/users/:userId/sent-friend-requests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const requests = await storage.getSentFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching sent friend requests:", error);
      res.status(500).json({ error: "Failed to fetch sent friend requests" });
    }
  });

  app.get("/api/users/:userId/friends", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  });

  app.delete("/api/users/:userId/friends/:friendId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId, friendId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.removeFriend(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  // Private Leagues
  app.post("/api/private-leagues", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, description, maxMembers, isPublic } = req.body;
      const creatorId = req.user!.id;

      if (!name) {
        return res.status(400).json({ error: "League name is required" });
      }

      const league = await storage.createPrivateLeague({
        name,
        description,
        creatorId,
        maxMembers: maxMembers || 50,
        isPublic: isPublic || false
      });

      res.json(league);
    } catch (error) {
      console.error("Error creating private league:", error);
      res.status(500).json({ error: "Failed to create private league" });
    }
  });

  app.post("/api/private-leagues/join", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { inviteCode } = req.body;
      const userId = req.user!.id;

      if (!inviteCode) {
        return res.status(400).json({ error: "Invite code is required" });
      }

      const league = await storage.joinPrivateLeague(userId, inviteCode);
      res.json(league);
    } catch (error) {
      console.error("Error joining private league:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to join private league" });
    }
  });

  app.post("/api/private-leagues/:leagueId/leave", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { leagueId } = req.params;
      const userId = req.user!.id;

      await storage.leavePrivateLeague(userId, leagueId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving private league:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to leave private league" });
    }
  });

  app.get("/api/users/:userId/private-leagues", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const leagues = await storage.getPrivateLeagues(userId);
      res.json(leagues);
    } catch (error) {
      console.error("Error fetching private leagues:", error);
      res.status(500).json({ error: "Failed to fetch private leagues" });
    }
  });

  app.get("/api/private-leagues/:leagueId/members", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { leagueId } = req.params;
      const userId = req.user!.id;

      // Check if user is a member of the league
      const leagues = await storage.getPrivateLeagues(userId);
      const isMember = leagues.some(league => league.id === leagueId && league.isMember);

      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const members = await storage.getPrivateLeagueMembers(leagueId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching league members:", error);
      res.status(500).json({ error: "Failed to fetch league members" });
    }
  });

  app.post("/api/private-leagues/:leagueId/contests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { leagueId } = req.params;
      const { contestId } = req.body;
      const userId = req.user!.id;

      if (!contestId) {
        return res.status(400).json({ error: "Contest ID is required" });
      }

      const leagueContest = await storage.addContestToLeague(leagueId, contestId, userId);
      res.json(leagueContest);
    } catch (error) {
      console.error("Error adding contest to league:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add contest to league" });
    }
  });

  app.get("/api/private-leagues/:leagueId/contests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { leagueId } = req.params;
      const userId = req.user!.id;

      // Check if user is a member of the league
      const leagues = await storage.getPrivateLeagues(userId);
      const isMember = leagues.some(league => league.id === leagueId && league.isMember);

      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const contests = await storage.getLeagueContests(leagueId);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching league contests:", error);
      res.status(500).json({ error: "Failed to fetch league contests" });
    }
  });

  // Contest Comments
  app.post("/api/contests/:contestId/comments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user!.id;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      const comment = await storage.addContestComment({
        contestId,
        userId,
        parentCommentId: parentCommentId || null,
        content: content.trim()
      });

      res.json(comment);
    } catch (error) {
      console.error("Error adding contest comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.get("/api/contests/:contestId/comments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { contestId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const comments = await storage.getContestComments(contestId, limit);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching contest comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments/:commentId/like", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      await storage.likeComment(commentId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ error: "Failed to like comment" });
    }
  });

  app.delete("/api/comments/:commentId/like", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      await storage.unlikeComment(commentId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking comment:", error);
      res.status(500).json({ error: "Failed to unlike comment" });
    }
  });

  app.put("/api/comments/:commentId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      await storage.editComment(commentId, userId, content.trim());
      res.json({ success: true });
    } catch (error) {
      console.error("Error editing comment:", error);
      res.status(500).json({ error: "Failed to edit comment" });
    }
  });

  app.delete("/api/comments/:commentId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      await storage.deleteComment(commentId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Achievement Sharing
  app.post("/api/achievements/:achievementId/share", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { achievementId } = req.params;
      const { message, platform, contestId } = req.body;
      const userId = req.user!.id;

      const share = await storage.shareAchievement({
        userId,
        achievementId,
        contestId: contestId || null,
        message: message || null,
        platform: platform || 'app'
      });

      res.json(share);
    } catch (error) {
      console.error("Error sharing achievement:", error);
      res.status(500).json({ error: "Failed to share achievement" });
    }
  });

  app.get("/api/users/:userId/achievement-shares", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      if (req.user?.id !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const shares = await storage.getAchievementShares(userId, limit);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching achievement shares:", error);
      res.status(500).json({ error: "Failed to fetch achievement shares" });
    }
  });

  // Chat Messages
  app.post("/api/private-leagues/:leagueId/chat", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { leagueId } = req.params;
      const { content, messageType } = req.body;
      const userId = req.user!.id;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      const message = await storage.sendChatMessage({
        leagueId,
        userId,
        content: content.trim(),
        messageType: messageType || 'text'
      });

      res.json(message);
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send message" });
    }
  });

  app.get("/api/private-leagues/:leagueId/chat", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { leagueId } = req.params;
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 100;

      // Check if user is a member of the league
      const leagues = await storage.getPrivateLeagues(userId);
      const isMember = leagues.some(league => league.id === leagueId && league.isMember);

      if (!isMember) {
        return res.status(403).json({ error: "Access denied" });
      }

      const messages = await storage.getChatMessages(leagueId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.put("/api/chat-messages/:messageId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      await storage.editChatMessage(messageId, userId, content.trim());
      res.json({ success: true });
    } catch (error) {
      console.error("Error editing chat message:", error);
      res.status(500).json({ error: "Failed to edit message" });
    }
  });

  app.delete("/api/chat-messages/:messageId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { messageId } = req.params;
      const userId = req.user!.id;

      await storage.deleteChatMessage(messageId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting chat message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  // Admin endpoints for creating challenges
  app.post("/api/admin/daily-challenges", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { title, description, type, target, rewardXP, rewardCoins } = req.body;

      if (!title || !description || !type || !target || !rewardXP) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const challenge = await storage.createDailyChallenge({
        title,
        description,
        type,
        target,
        rewardXP,
        rewardCoins: rewardCoins || 0
      });

      res.json(challenge);
    } catch (error) {
      console.error("Error creating daily challenge:", error);
      res.status(500).json({ error: "Failed to create daily challenge" });
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
