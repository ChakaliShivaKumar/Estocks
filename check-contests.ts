import { config } from "dotenv";
import { storage } from "./server/storage";

// Load environment variables
config();

async function checkAllContests() {
  try {
    console.log("🔍 Checking all contests in the database...\n");

    // Get all contests
    const allContests = await storage.getAllContests();
    
    console.log(`📊 Total Contests Found: ${allContests.length}\n`);

    if (allContests.length === 0) {
      console.log("⚠️  No contests found in the database!");
      console.log("💡 Run 'npm run db:seed' to create default contests.\n");
      return;
    }

    // Group by status
    const byStatus = {
      active: allContests.filter(c => c.status === 'active'),
      upcoming: allContests.filter(c => c.status === 'upcoming'),
      completed: allContests.filter(c => c.status === 'completed'),
      cancelled: allContests.filter(c => c.status === 'cancelled'),
    };

    console.log("📈 Contest Status Breakdown:");
    console.log(`   Active: ${byStatus.active.length}`);
    console.log(`   Upcoming: ${byStatus.upcoming.length}`);
    console.log(`   Completed: ${byStatus.completed.length}`);
    console.log(`   Cancelled: ${byStatus.cancelled.length}\n`);

    // Display all contests with participant counts
    console.log("🏆 All Contests:\n");
    for (const contest of allContests) {
      const startTime = new Date(contest.startTime);
      const endTime = new Date(contest.endTime);
      const now = new Date();
      
      const isActive = contest.status === 'active';
      const isUpcoming = contest.status === 'upcoming';
      const isPast = endTime < now;
      
      // Get participant count
      let participantCount = 0;
      try {
        participantCount = await storage.getContestParticipantCount(contest.id);
      } catch (error) {
        console.error(`   Error getting participant count: ${error}`);
      }
      
      console.log(`${allContests.indexOf(contest) + 1}. ${contest.name}`);
      console.log(`   ID: ${contest.id}`);
      console.log(`   Status: ${contest.status} ${contest.featured ? '⭐ FEATURED' : ''}`);
      if (contest.description) {
        console.log(`   Description: ${contest.description}`);
      }
      console.log(`   Entry Fee: ${contest.entryFee} coins`);
      console.log(`   Prize Pool: ${contest.prizePool} coins`);
      console.log(`   Participants: ${participantCount}/${contest.maxParticipants}`);
      console.log(`   Start Time: ${startTime.toLocaleString()}`);
      console.log(`   End Time: ${endTime.toLocaleString()}`);
      
      if (isActive) {
        const timeLeft = endTime.getTime() - now.getTime();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        console.log(`   ⏱️  Time Remaining: ${hoursLeft}h ${minutesLeft}m`);
      } else if (isUpcoming) {
        const timeUntilStart = startTime.getTime() - now.getTime();
        const hoursUntil = Math.floor(timeUntilStart / (1000 * 60 * 60));
        console.log(`   ⏱️  Starts in: ${hoursUntil}h`);
      } else if (isPast) {
        console.log(`   ⏱️  Ended ${Math.floor((now.getTime() - endTime.getTime()) / (1000 * 60 * 60))}h ago`);
      }
      
      console.log(`   Visibility: ${contest.visibility}`);
      if (contest.createdBy) {
        console.log(`   Created By: ${contest.createdBy}`);
      }
      if (contest.inviteCode) {
        console.log(`   Invite Code: ${contest.inviteCode}`);
      }
      
      console.log("");
    }

    // Check active contests specifically
    const activeContests = await storage.getActiveContests();
    console.log(`\n✅ Active Contests (API will return): ${activeContests.length}`);
    activeContests.forEach((contest, index) => {
      console.log(`   ${index + 1}. ${contest.name} (ends ${new Date(contest.endTime).toLocaleString()})`);
    });

    console.log("\n✅ Check complete!");
  } catch (error) {
    console.error("❌ Error checking contests:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('check-contests') || process.argv[1]?.endsWith('check-contests.ts')) {
  checkAllContests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { checkAllContests };

