import { Express } from 'express';
import { storage } from './storage.ts';
import { authenticateToken, AuthRequest } from './auth.ts';
import { contestScheduler } from './scheduler.ts';
import { z } from 'zod';

// Admin middleware - check if user is admin
function requireAdmin(req: AuthRequest, res: any, next: any) {
  // For now, we'll use a simple check. In production, you'd have an admin role in the database
  const adminEmails = ['admin@estocks.com', 'capshiv@example.com']; // Add your admin emails here
  
  if (!req.user || !adminEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

// Validation schemas
const createContestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  entryFee: z.number().min(0),
  prizePool: z.number().min(0),
  maxParticipants: z.number().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  featured: z.boolean().optional().default(false),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional().default('upcoming')
});

const updateContestSchema = createContestSchema.partial();

export function setupAdminRoutes(app: Express) {
  // Get all contests (admin view with all statuses)
  app.get('/api/admin/contests', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const contests = await storage.getAllContests();
      res.json(contests);
    } catch (error) {
      console.error('Error fetching contests:', error);
      res.status(500).json({ error: 'Failed to fetch contests' });
    }
  });

  // Create new contest
  app.post('/api/admin/contests', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = createContestSchema.parse(req.body);
      
      // Validate that end time is after start time
      const startTime = new Date(validatedData.startTime);
      const endTime = new Date(validatedData.endTime);
      
      if (endTime <= startTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      // Validate that start time is in the future
      if (startTime <= new Date()) {
        return res.status(400).json({ error: 'Start time must be in the future' });
      }

      const contest = await storage.createContest({
        name: validatedData.name,
        description: validatedData.description || null,
        entryFee: validatedData.entryFee,
        prizePool: validatedData.prizePool,
        maxParticipants: validatedData.maxParticipants,
        startTime,
        endTime,
        status: validatedData.status,
        featured: validatedData.featured
      });

      // Schedule the contest if it's upcoming
      if (validatedData.status === 'upcoming') {
        contestScheduler.scheduleContestStart(contest.id, startTime);
        contestScheduler.scheduleContestEnd(contest.id, endTime);
      }

      res.status(201).json(contest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Error creating contest:', error);
      res.status(500).json({ error: 'Failed to create contest' });
    }
  });

  // Update contest
  app.put('/api/admin/contests/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateContestSchema.parse(req.body);

      // Check if contest exists
      const existingContest = await storage.getContest(id);
      if (!existingContest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      // If updating times, validate them
      if (validatedData.startTime || validatedData.endTime) {
        const startTime = validatedData.startTime ? new Date(validatedData.startTime) : new Date(existingContest.startTime);
        const endTime = validatedData.endTime ? new Date(validatedData.endTime) : new Date(existingContest.endTime);
        
        if (endTime <= startTime) {
          return res.status(400).json({ error: 'End time must be after start time' });
        }
      }

      // Convert string dates to Date objects if provided
      const updates: any = { ...validatedData };
      if (validatedData.startTime) {
        updates.startTime = new Date(validatedData.startTime);
      }
      if (validatedData.endTime) {
        updates.endTime = new Date(validatedData.endTime);
      }

      // Update contest
      const updatedContest = await storage.updateContest(id, updates);
      res.json(updatedContest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors 
        });
      }
      console.error('Error updating contest:', error);
      res.status(500).json({ error: 'Failed to update contest' });
    }
  });

  // Delete contest
  app.delete('/api/admin/contests/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Check if contest exists
      const contest = await storage.getContest(id);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      // Check if contest has participants
      const entries = await storage.getContestEntries(id);
      if (entries.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete contest with participants. Cancel it instead.' 
        });
      }

      await storage.deleteContest(id);
      res.json({ success: true, message: 'Contest deleted successfully' });
    } catch (error) {
      console.error('Error deleting contest:', error);
      res.status(500).json({ error: 'Failed to delete contest' });
    }
  });

  // Get contest participants
  app.get('/api/admin/contests/:id/participants', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const entries = await storage.getContestEntries(id);
      
      // Enrich with user data
      const participants = await Promise.all(
        entries.map(async (entry) => {
          const user = await storage.getUser(entry.userId);
          return {
            ...entry,
            username: user?.username || 'Unknown',
            fullName: user?.fullName || 'Unknown User'
          };
        })
      );

      res.json(participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ error: 'Failed to fetch participants' });
    }
  });

  // Update contest status
  app.patch('/api/admin/contests/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['upcoming', 'active', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      await storage.updateContestStatus(id, status);
      res.json({ success: true, message: `Contest status updated to ${status}` });
    } catch (error) {
      console.error('Error updating contest status:', error);
      res.status(500).json({ error: 'Failed to update contest status' });
    }
  });

  // Calculate and distribute prizes
  app.post('/api/admin/contests/:id/distribute-prizes', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const contest = await storage.getContest(id);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'completed') {
        return res.status(400).json({ error: 'Contest must be completed to distribute prizes' });
      }

      const entries = await storage.getContestEntries(id);
      if (entries.length === 0) {
        return res.status(400).json({ error: 'No participants to distribute prizes to' });
      }

      // Sort by ROI (descending) and assign ranks
      const sortedEntries = entries
        .filter(entry => entry.roi !== null)
        .sort((a, b) => parseFloat(b.roi!) - parseFloat(a.roi!));

      // Calculate prize distribution (top 3 get prizes)
      const prizeDistribution = [
        { rank: 1, percentage: 0.5 }, // 50% to 1st place
        { rank: 2, percentage: 0.3 }, // 30% to 2nd place
        { rank: 3, percentage: 0.2 }  // 20% to 3rd place
      ];

      const results = [];
      for (let i = 0; i < Math.min(3, sortedEntries.length); i++) {
        const entry = sortedEntries[i];
        const prizeAmount = Math.floor(contest.prizePool * prizeDistribution[i].percentage);
        
        // Update user's coin balance
        const user = await storage.getUser(entry.userId);
        if (user) {
          await storage.updateUserCoinsBalance(entry.userId, user.coinsBalance + prizeAmount);
        }

        // Update entry with rank and prize
        await storage.updateContestEntryResults(
          entry.id, 
          parseFloat(entry.finalPortfolioValue!), 
          parseFloat(entry.roi!), 
          i + 1
        );

        results.push({
          rank: i + 1,
          userId: entry.userId,
          username: user?.username,
          roi: parseFloat(entry.roi!),
          prizeAmount
        });
      }

      res.json({
        success: true,
        message: 'Prizes distributed successfully',
        results
      });
    } catch (error) {
      console.error('Error distributing prizes:', error);
      res.status(500).json({ error: 'Failed to distribute prizes' });
    }
  });

  // Get admin dashboard stats
  app.get('/api/admin/dashboard', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const contests = await storage.getAllContests();
      const stocks = await storage.getAllStocks();
      
      const stats = {
        totalContests: contests.length,
        activeContests: contests.filter(c => c.status === 'active').length,
        upcomingContests: contests.filter(c => c.status === 'upcoming').length,
        completedContests: contests.filter(c => c.status === 'completed').length,
        totalStocks: stocks.length,
        totalPrizePool: contests.reduce((sum, c) => sum + c.prizePool, 0),
        recentContests: contests.slice(-5).reverse()
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Manual contest control
  app.post('/api/admin/contests/:id/start', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const contest = await storage.getContest(id);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'upcoming') {
        return res.status(400).json({ error: 'Contest must be upcoming to start manually' });
      }

      await contestScheduler.startContestManually(id);
      res.json({ success: true, message: 'Contest started successfully' });
    } catch (error) {
      console.error('Error starting contest:', error);
      res.status(500).json({ error: 'Failed to start contest' });
    }
  });

  app.post('/api/admin/contests/:id/end', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const contest = await storage.getContest(id);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      if (contest.status !== 'active') {
        return res.status(400).json({ error: 'Contest must be active to end manually' });
      }

      await contestScheduler.endContestManually(id);
      res.json({ success: true, message: 'Contest ended successfully' });
    } catch (error) {
      console.error('Error ending contest:', error);
      res.status(500).json({ error: 'Failed to end contest' });
    }
  });

  app.post('/api/admin/contests/:id/calculate-results', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      const contest = await storage.getContest(id);
      if (!contest) {
        return res.status(404).json({ error: 'Contest not found' });
      }

      await contestScheduler.calculateResultsManually(id);
      res.json({ success: true, message: 'Results calculated successfully' });
    } catch (error) {
      console.error('Error calculating results:', error);
      res.status(500).json({ error: 'Failed to calculate results' });
    }
  });

  // Get scheduled contests
  app.get('/api/admin/scheduled-contests', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const scheduled = contestScheduler.getScheduledContests();
      res.json({ scheduledContests: scheduled });
    } catch (error) {
      console.error('Error fetching scheduled contests:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled contests' });
    }
  });
}
