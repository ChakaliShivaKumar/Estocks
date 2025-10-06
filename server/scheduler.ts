import { storage } from './storage.ts';

export class ContestScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.startScheduler();
  }

  private startScheduler() {
    // Check for contests to start/end every minute
    setInterval(() => {
      this.checkContestLifecycle();
    }, 60000); // 1 minute

    // Record portfolio performance every 5 minutes
    setInterval(() => {
      this.recordPortfolioPerformance();
    }, 300000); // 5 minutes

    // Record leaderboard snapshots every 10 minutes
    setInterval(() => {
      this.recordLeaderboardSnapshots();
    }, 600000); // 10 minutes

    console.log('🏁 Contest Scheduler started');
  }

  private async checkContestLifecycle() {
    try {
      const contests = await storage.getAllContests();
      const now = new Date();

      for (const contest of contests) {
        const startTime = new Date(contest.startTime);
        const endTime = new Date(contest.endTime);

        // Check if contest should start
        if (contest.status === 'upcoming' && startTime <= now) {
          // Check if contest has enough participants before starting
          const participantCount = await storage.getContestParticipantCount(contest.id);
          
          if (participantCount < 2) {
            // Mark contest as abandoned and refund participants
            await this.handleAbandonedContest(contest);
          } else {
            await this.startContest(contest.id);
          }
        }

        // Check if contest should end
        if (contest.status === 'active' && endTime <= now) {
          await this.endContest(contest.id);
        }
      }
    } catch (error) {
      console.error('Error in contest lifecycle check:', error);
    }
  }

  private async handleAbandonedContest(contest: any) {
    try {
      console.log(`❌ Contest "${contest.name}" (${contest.id}) is abandoned - insufficient participants`);
      
      // Mark contest as cancelled
      await storage.updateContestStatus(contest.id, 'cancelled');
      
      // Get all participants and refund their entry fees
      const entries = await storage.getContestEntries(contest.id);
      
      for (const entry of entries) {
        // Refund the entry fee
        await storage.updateUserCoinsBalance(entry.userId, contest.entryFee);
        
        // Record the refund transaction
        await storage.createCoinTransaction({
          userId: entry.userId,
          amount: contest.entryFee,
          type: 'refund',
          description: `Refund for abandoned contest: ${contest.name}`,
          contestId: contest.id
        });
        
        console.log(`💰 Refunded ${contest.entryFee} coins to user ${entry.userId} for abandoned contest`);
      }
    } catch (error) {
      console.error(`Error handling abandoned contest ${contest.id}:`, error);
    }
  }

  private async startContest(contestId: string) {
    try {
      console.log(`🚀 Starting contest: ${contestId}`);
      await storage.updateContestStatus(contestId, 'active');
      
      // You could add additional logic here like:
      // - Send notifications to participants
      // - Start real-time price tracking
      // - Initialize leaderboard
    } catch (error) {
      console.error(`Error starting contest ${contestId}:`, error);
    }
  }

  private async endContest(contestId: string) {
    try {
      console.log(`🏁 Ending contest: ${contestId}`);
      
      // Calculate final portfolio values and ROI
      await this.calculateFinalResults(contestId);
      
      // Update contest status
      await storage.updateContestStatus(contestId, 'completed');
      
      // You could add additional logic here like:
      // - Send notifications to participants
      // - Prepare prize distribution
      // - Generate contest summary
    } catch (error) {
      console.error(`Error ending contest ${contestId}:`, error);
    }
  }

  private async calculateFinalResults(contestId: string) {
    try {
      const entries = await storage.getContestEntries(contestId);
      
      for (const entry of entries) {
        const holdings = await storage.getPortfolioHoldings(entry.id);
        
        // Calculate final portfolio value based on current stock prices
        let finalValue = 0;
        for (const holding of holdings) {
          const stock = await storage.getStock(holding.stockSymbol);
          if (stock) {
            const currentValue = parseFloat(holding.sharesQuantity) * parseFloat(stock.currentPrice);
            finalValue += currentValue;
          }
        }

        // Calculate ROI
        const roi = ((finalValue - entry.totalCoinsInvested) / entry.totalCoinsInvested) * 100;

        // Update entry with final results
        await storage.updateContestEntryResults(
          entry.id,
          finalValue,
          roi,
          0 // Rank will be calculated later
        );
      }

      // Calculate and assign ranks
      await this.calculateRanks(contestId);
    } catch (error) {
      console.error(`Error calculating final results for contest ${contestId}:`, error);
    }
  }

  private async calculateRanks(contestId: string) {
    try {
      const entries = await storage.getContestEntries(contestId);
      
      // Sort by ROI (descending)
      const sortedEntries = entries
        .filter(entry => entry.roi !== null)
        .sort((a, b) => parseFloat(b.roi!) - parseFloat(a.roi!));

      // Assign ranks
      for (let i = 0; i < sortedEntries.length; i++) {
        const entry = sortedEntries[i];
        await storage.updateContestEntryResults(
          entry.id,
          parseFloat(entry.finalPortfolioValue!),
          parseFloat(entry.roi!),
          i + 1
        );
      }
    } catch (error) {
      console.error(`Error calculating ranks for contest ${contestId}:`, error);
    }
  }

  // Manual methods for admin use
  public async startContestManually(contestId: string) {
    await this.startContest(contestId);
  }

  public async endContestManually(contestId: string) {
    await this.endContest(contestId);
  }

  public async calculateResultsManually(contestId: string) {
    await this.calculateFinalResults(contestId);
  }

  // Schedule a contest to start at a specific time
  public scheduleContestStart(contestId: string, startTime: Date) {
    const now = new Date();
    const delay = startTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.startContest(contestId);
        this.intervals.delete(contestId);
      }, delay);

      this.intervals.set(contestId, timeout);
      console.log(`📅 Scheduled contest ${contestId} to start at ${startTime.toISOString()}`);
    }
  }

  // Schedule a contest to end at a specific time
  public scheduleContestEnd(contestId: string, endTime: Date) {
    const now = new Date();
    const delay = endTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.endContest(contestId);
        this.intervals.delete(contestId);
      }, delay);

      this.intervals.set(`${contestId}-end`, timeout);
      console.log(`📅 Scheduled contest ${contestId} to end at ${endTime.toISOString()}`);
    }
  }

  // Cancel scheduled contest
  public cancelScheduledContest(contestId: string) {
    const startTimeout = this.intervals.get(contestId);
    const endTimeout = this.intervals.get(`${contestId}-end`);

    if (startTimeout) {
      clearTimeout(startTimeout);
      this.intervals.delete(contestId);
    }

    if (endTimeout) {
      clearTimeout(endTimeout);
      this.intervals.delete(`${contestId}-end`);
    }

    console.log(`❌ Cancelled scheduled contest ${contestId}`);
  }

  // Get all scheduled contests
  public getScheduledContests(): string[] {
    return Array.from(this.intervals.keys());
  }

  // Record portfolio performance for all active contests
  private async recordPortfolioPerformance() {
    try {
      const contests = await storage.getAllContests();
      const activeContests = contests.filter(contest => contest.status === 'active');

      for (const contest of activeContests) {
        const entries = await storage.getContestEntries(contest.id);
        
        for (const entry of entries) {
          const holdings = await storage.getPortfolioHoldings(entry.id);
          
          // Calculate current portfolio value
          let currentValue = 0;
          for (const holding of holdings) {
            const stock = await storage.getStock(holding.stockSymbol);
            if (stock) {
              const holdingValue = parseFloat(holding.sharesQuantity) * parseFloat(stock.currentPrice);
              currentValue += holdingValue;
            }
          }

          // Record performance data
          await storage.createPortfolioPerformance({
            entryId: entry.id,
            portfolioValue: currentValue.toString()
          });
        }
      }

      console.log(`📊 Recorded portfolio performance for ${activeContests.length} active contests`);
    } catch (error) {
      console.error('Error recording portfolio performance:', error);
    }
  }

  // Record leaderboard snapshots for active contests
  private async recordLeaderboardSnapshots() {
    try {
      const contests = await storage.getAllContests();
      const activeContests = contests.filter(contest => contest.status === 'active');

      for (const contest of activeContests) {
        await storage.recordLeaderboardSnapshot(contest.id);
      }

      console.log(`📸 Recorded leaderboard snapshots for ${activeContests.length} active contests`);
    } catch (error) {
      console.error('Error recording leaderboard snapshots:', error);
    }
  }
}

// Create singleton instance
export const contestScheduler = new ContestScheduler();
