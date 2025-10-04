import { storage } from './storage.ts';
import { hashPassword } from './auth.ts';

async function addAdminData() {
  try {
    console.log('🔧 Adding admin data...');

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const adminUser = await storage.createUser({
      username: 'admin',
      email: 'admin@estocks.com',
      fullName: 'System Administrator',
      password: adminPassword
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create some sample contests
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const contests = [
      {
        name: 'Daily Tech Titans',
        description: 'Compete with the best tech stocks in a daily trading contest',
        entryFee: 50,
        prizePool: 500,
        maxParticipants: 100,
        startTime: tomorrow,
        endTime: dayAfterTomorrow,
        status: 'upcoming' as const,
        featured: true
      },
      {
        name: 'Flash Trading Challenge',
        description: 'Quick 2-hour trading session with high volatility stocks',
        entryFee: 25,
        prizePool: 250,
        maxParticipants: 50,
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        status: 'upcoming' as const,
        featured: false
      },
      {
        name: 'Weekly Market Masters',
        description: 'Weekly contest featuring diverse market sectors',
        entryFee: 100,
        prizePool: 1000,
        maxParticipants: 200,
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'upcoming' as const,
        featured: true
      },
      {
        name: 'Crypto Kings',
        description: 'Special contest for cryptocurrency enthusiasts',
        entryFee: 75,
        prizePool: 750,
        maxParticipants: 150,
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'upcoming' as const,
        featured: false
      },
      {
        name: 'Beginner Friendly',
        description: 'Perfect for new traders to learn the ropes',
        entryFee: 10,
        prizePool: 100,
        maxParticipants: 50,
        startTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        endTime: new Date(now.getTime() + 30 * 60 * 60 * 1000), // 30 hours from now
        status: 'upcoming' as const,
        featured: false
      }
    ];

    for (const contestData of contests) {
      const contest = await storage.createContest(contestData);
      console.log('✅ Contest created:', contest.name);
    }

    // Add some sample stocks if they don't exist
    const sampleStocks = [
      {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology',
        currentPrice: '175.50',
        priceChange: '2.30',
        priceChangePercent: '1.33',
        isActive: true
      },
      {
        symbol: 'GOOGL',
        companyName: 'Alphabet Inc.',
        sector: 'Technology',
        currentPrice: '142.80',
        priceChange: '-1.20',
        priceChangePercent: '-0.83',
        isActive: true
      },
      {
        symbol: 'MSFT',
        companyName: 'Microsoft Corporation',
        sector: 'Technology',
        currentPrice: '378.90',
        priceChange: '4.50',
        priceChangePercent: '1.20',
        isActive: true
      },
      {
        symbol: 'TSLA',
        companyName: 'Tesla, Inc.',
        sector: 'Automotive',
        currentPrice: '245.20',
        priceChange: '-3.80',
        priceChangePercent: '-1.53',
        isActive: true
      },
      {
        symbol: 'AMZN',
        companyName: 'Amazon.com, Inc.',
        sector: 'E-commerce',
        currentPrice: '155.30',
        priceChange: '1.90',
        priceChangePercent: '1.24',
        isActive: true
      },
      {
        symbol: 'META',
        companyName: 'Meta Platforms, Inc.',
        sector: 'Social Media',
        currentPrice: '485.60',
        priceChange: '8.20',
        priceChangePercent: '1.72',
        isActive: true
      },
      {
        symbol: 'NVDA',
        companyName: 'NVIDIA Corporation',
        sector: 'Semiconductors',
        currentPrice: '875.40',
        priceChange: '15.60',
        priceChangePercent: '1.82',
        isActive: true
      },
      {
        symbol: 'NFLX',
        companyName: 'Netflix, Inc.',
        sector: 'Streaming',
        currentPrice: '485.20',
        priceChange: '-2.10',
        priceChangePercent: '-0.43',
        isActive: true
      }
    ];

    for (const stockData of sampleStocks) {
      try {
        const existingStock = await storage.getStock(stockData.symbol);
        if (!existingStock) {
          await storage.createStock(stockData);
          console.log('✅ Stock created:', stockData.symbol);
        } else {
          console.log('ℹ️ Stock already exists:', stockData.symbol);
        }
      } catch (error) {
        console.log('ℹ️ Stock already exists:', stockData.symbol);
      }
    }

    console.log('\n🎉 Admin data setup complete!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Email: admin@estocks.com');
    console.log('   Password: admin123');
    console.log('\n🏆 Sample Contests Created:');
    contests.forEach(contest => {
      console.log(`   - ${contest.name} (${contest.status})`);
    });
    console.log('\n📈 Sample Stocks Added:');
    sampleStocks.forEach(stock => {
      console.log(`   - ${stock.symbol} (${stock.companyName})`);
    });

  } catch (error) {
    console.error('❌ Error adding admin data:', error);
  }
}

// Run the script
addAdminData().then(() => {
  console.log('\n✅ Admin data setup finished');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Failed to setup admin data:', error);
  process.exit(1);
});
