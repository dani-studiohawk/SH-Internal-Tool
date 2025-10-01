require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('💡 Make sure to copy .env.example to .env.local and add your Neon database URL');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    const testQuery = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful');
    console.log(`📅 Current time: ${testQuery[0].current_time}`);

    // Test table existence
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('clients', 'client_activity')
      ORDER BY table_name
    `;
    
    console.log('\n📋 Database tables status:');
    const existingTables = tablesCheck.map(row => row.table_name);
    
    if (existingTables.includes('clients')) {
      console.log('✅ clients table exists');
    } else {
      console.log('❌ clients table missing - run setup script');
    }
    
    if (existingTables.includes('client_activity')) {
      console.log('✅ client_activity table exists');
    } else {
      console.log('❌ client_activity table missing - run setup script');
    }

    // If tables exist, show record counts
    if (existingTables.length === 2) {
      const clientCount = await sql`SELECT COUNT(*) as count FROM clients`;
      const activityCount = await sql`SELECT COUNT(*) as count FROM client_activity`;
      
      console.log('\n📊 Current record counts:');
      console.log(`   - Clients: ${clientCount[0].count}`);
      console.log(`   - Activities: ${activityCount[0].count}`);
    }

    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('💡 Run the setup script first: node scripts/setup-database.js');
    }
    process.exit(1);
  }
}

// Run the test
testDatabase();