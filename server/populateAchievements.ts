import { storage } from './storage.ts';

async function populateAchievements() {
  try {
    console.log('🏆 Populating achievement system...');

    const achievements = [
      // Performance Achievements
      {
        name: "First Victory",
        description: "Win your first contest",
        icon: "trophy",
        category: "performance",
        requirement: JSON.stringify({ type: "total_wins", value: 1 }),
        rarity: "common"
      },
      {
        name: "Three in a Row",
        description: "Win 3 contests in a row",
        icon: "trophy",
        category: "performance", 
        requirement: JSON.stringify({ type: "win_streak", value: 3 }),
        rarity: "rare"
      },
      {
        name: "Top Performer",
        description: "Achieve a top 3 rank",
        icon: "medal",
        category: "performance",
        requirement: JSON.stringify({ type: "best_rank", value: 3 }),
        rarity: "rare"
      },
      {
        name: "Champion",
        description: "Win 10 contests",
        icon: "crown",
        category: "performance",
        requirement: JSON.stringify({ type: "total_wins", value: 10 }),
        rarity: "epic"
      },
      {
        name: "Unstoppable",
        description: "Win 10 contests in a row",
        icon: "zap",
        category: "performance",
        requirement: JSON.stringify({ type: "win_streak", value: 10 }),
        rarity: "legendary"
      },

      // Milestone Achievements
      {
        name: "Getting Started",
        description: "Participate in your first contest",
        icon: "star",
        category: "milestone",
        requirement: JSON.stringify({ type: "contests_participated", value: 1 }),
        rarity: "common"
      },
      {
        name: "Regular Trader",
        description: "Participate in 5 contests",
        icon: "star",
        category: "milestone",
        requirement: JSON.stringify({ type: "contests_participated", value: 5 }),
        rarity: "common"
      },
      {
        name: "Veteran Trader",
        description: "Participate in 25 contests",
        icon: "star",
        category: "milestone",
        requirement: JSON.stringify({ type: "contests_participated", value: 25 }),
        rarity: "rare"
      },
      {
        name: "Master Trader",
        description: "Participate in 100 contests",
        icon: "star",
        category: "milestone",
        requirement: JSON.stringify({ type: "contests_participated", value: 100 }),
        rarity: "epic"
      },

      // Social Achievements
      {
        name: "Popular",
        description: "Get 5 followers",
        icon: "users",
        category: "social",
        requirement: JSON.stringify({ type: "followers", value: 5 }),
        rarity: "common"
      },
      {
        name: "Influencer",
        description: "Get 25 followers",
        icon: "users",
        category: "social",
        requirement: JSON.stringify({ type: "followers", value: 25 }),
        rarity: "rare"
      },
      {
        name: "Trading Celebrity",
        description: "Get 100 followers",
        icon: "users",
        category: "social",
        requirement: JSON.stringify({ type: "followers", value: 100 }),
        rarity: "legendary"
      }
    ];

    for (const achievement of achievements) {
      await storage.createAchievement(achievement);
      console.log(`✅ Created achievement: ${achievement.name}`);
    }

    console.log('🎉 Achievement system populated successfully!');
  } catch (error) {
    console.error('❌ Error populating achievements:', error);
  }
}

// Run the script
populateAchievements().then(() => {
  console.log('Achievement population complete');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
