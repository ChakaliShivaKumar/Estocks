import { storage } from "./storage";
import { populateDailyChallenges } from "./populateDailyChallenges";

export class GamificationScheduler {
  private dailyChallengeInterval: NodeJS.Timeout | null = null;

  start() {
    console.log("🎮 Starting gamification scheduler...");

    // Schedule daily challenge generation at midnight
    this.scheduleDailyChallenges();

    // Schedule daily challenge generation every 24 hours
    this.dailyChallengeInterval = setInterval(() => {
      this.generateDailyChallenges();
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log("✅ Gamification scheduler started");
  }

  stop() {
    console.log("🛑 Stopping gamification scheduler...");
    
    if (this.dailyChallengeInterval) {
      clearInterval(this.dailyChallengeInterval);
      this.dailyChallengeInterval = null;
    }

    console.log("✅ Gamification scheduler stopped");
  }

  private scheduleDailyChallenges() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Next midnight
    
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    console.log(`⏰ Next daily challenges will be generated in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
    
    setTimeout(() => {
      this.generateDailyChallenges();
    }, msUntilMidnight);
  }

  private async generateDailyChallenges() {
    try {
      console.log("🎯 Generating daily challenges...");
      await populateDailyChallenges();
    } catch (error) {
      console.error("❌ Error generating daily challenges:", error);
    }
  }

  // Method to manually trigger daily challenge generation (for testing)
  async generateDailyChallengesNow() {
    await this.generateDailyChallenges();
  }
}

// Export singleton instance
export const gamificationScheduler = new GamificationScheduler();
