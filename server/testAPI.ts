import { config } from "dotenv";

// Load environment variables
config();

const BASE_URL = "http://localhost:3000/api";

async function testAPI() {
  console.log("🧪 Testing API Endpoints...\n");

  const tests = [
    { name: "Health Check", url: `${BASE_URL}/health` },
    { name: "Get All Stocks", url: `${BASE_URL}/stocks` },
    { name: "Get Specific Stock", url: `${BASE_URL}/stocks/RELIANCE` },
    { name: "Get Active Contests", url: `${BASE_URL}/contests` },
  ];

  for (const test of tests) {
    try {
      console.log(`📡 ${test.name}:`);
      const response = await fetch(test.url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        
        if (Array.isArray(data)) {
          console.log(`   📊 Records: ${data.length}`);
          if (data.length > 0) {
            console.log(`   🔍 Sample: ${JSON.stringify(data[0], null, 2).substring(0, 100)}...`);
          }
        } else {
          console.log(`   📋 Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        }
      } else {
        console.log(`   ❌ Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();
  }

  console.log("🎉 API testing completed!");
}

// Run tests
testAPI();