import { Client } from 'pg';

// Test database connection
async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.error('Please set DATABASE_URL in your environment');
    process.exit(1);
  }

  console.log('🔗 Testing database connection...');
  console.log('📊 Connection string:', connectionString.replace(/:[^:@]*@/, ':***@')); // Hide password

  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Database time:', result.rows[0].current_time);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Available tables:', tablesResult.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();


