import { storage } from "./storage";

export class ContestScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

  start() {
    if (this.intervalId) {
      console.log("Contest scheduler already running");
      return;
    }

    console.log("Starting contest scheduler...");
    
    // Run immediately on start
    this.checkAbandonedContests();
    
    // Then run every 5 minutes
    this.intervalId = setInterval(() => {
      this.checkAbandonedContests();
    }, this.CHECK_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Contest scheduler stopped");
    }
  }

  private async checkAbandonedContests() {
    try {
      await storage.checkAndHandleAbandonedContests();
    } catch (error) {
      console.error("Error checking abandoned contests:", error);
    }
  }
}

// Export singleton instance
export const contestScheduler = new ContestScheduler();
