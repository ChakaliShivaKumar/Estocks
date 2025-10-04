import { storage } from './storage.ts';
import { contestScheduler } from './scheduler.ts';

async function populateDemoPerformanceData() {
  try {
    console.log('🎯 Populating demo portfolio performance data...');

    // Get all contests
    const contests = await storage.getAllContests();
    console.log(`Found ${contests.length} contests`);

    for (const contest of contests) {
      console.log(`Processing contest: ${contest.name}`);
      
      // Get all entries for this contest
      const entries = await storage.getContestEntries(contest.id);
      console.log(`Found ${entries.length} entries`);

      for (const entry of entries) {
        console.log(`Processing entry: ${entry.id}`);
        
        // Generate historical performance data for the last 7 days
        const now = new Date();
        const days = 7;
        const hoursPerDay = 24;
        const pointsPerDay = 4; // Every 6 hours
        
        for (let day = days; day >= 0; day--) {
          for (let hour = 0; hour < hoursPerDay; hour += 6) {
            const timestamp = new Date(now);
            timestamp.setDate(timestamp.getDate() - day);
            timestamp.setHours(timestamp.getHours() - hour);
            
            // Skip future timestamps
            if (timestamp > now) continue;
            
            // Skip timestamps before contest start
            if (timestamp < new Date(contest.startTime)) continue;
            
            // Skip timestamps after contest end (if contest has ended)
            if (contest.status === 'completed' && timestamp > new Date(contest.endTime)) continue;
            
            // Generate realistic portfolio value with some volatility
            const baseValue = 100; // Starting value
            const timeProgress = (timestamp.getTime() - new Date(contest.startTime).getTime()) / 
                               (new Date(contest.endTime).getTime() - new Date(contest.startTime).getTime());
            
            // Add some random volatility (-5% to +5%)
            const volatility = (Math.random() - 0.5) * 0.1;
            const trend = Math.sin(timeProgress * Math.PI) * 0.1; // Slight upward trend
            
            const portfolioValue = baseValue * (1 + trend + volatility);
            
            // Record the performance data
            await storage.createPortfolioPerformance({
              entryId: entry.id,
              portfolioValue: portfolioValue.toString(),
              timestamp: timestamp
            });
          }
        }
        
        console.log(`✅ Generated performance data for entry: ${entry.id}`);
      }
    }

    console.log('🎉 Demo portfolio performance data populated successfully!');
  } catch (error) {
    console.error('❌ Error populating demo data:', error);
  }
}

// Run the script
populateDemoPerformanceData().then(() => {
  console.log('Demo data population complete');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
