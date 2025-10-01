require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function setupDatabase() {
  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔄 Starting database setup...');
    
    // Create clients table
    console.log('📝 Creating clients table...');
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT,
        lead_dpr TEXT,
        boilerplate TEXT,
        press_contacts TEXT,
        url TEXT,
        tone_of_voice TEXT,
        spheres TEXT,
        status TEXT DEFAULT 'active',
        outreach_locations TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Clients table created successfully');

    // Create client_activity table
    console.log('📝 Creating client_activity table...');
    await sql`
      CREATE TABLE IF NOT EXISTS client_activity (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        title TEXT,
        content JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Client activity table created successfully');

    // Create indexes for better performance
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_activity_client_id ON client_activity(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_activity_type ON client_activity(activity_type)`;
    console.log('✅ Indexes created successfully');

    console.log('🎉 Database setup completed successfully!');
    
    // Test the connection by counting existing records
    const clientCount = await sql`SELECT COUNT(*) as count FROM clients`;
    const activityCount = await sql`SELECT COUNT(*) as count FROM client_activity`;
    
    console.log(`📊 Current database status:`);
    console.log(`   - Clients: ${clientCount[0].count} records`);
    console.log(`   - Activities: ${activityCount[0].count} records`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();