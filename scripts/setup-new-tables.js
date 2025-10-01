require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function addNewTables() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔄 Adding new tables for saved ideas and trends...');
    
    // Create saved_ideas table
    console.log('📝 Creating saved_ideas table...');
    await sql`
      CREATE TABLE IF NOT EXISTS saved_ideas (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        headline TEXT NOT NULL,
        summary TEXT NOT NULL,
        sources JSONB DEFAULT '[]',
        campaign_type TEXT,
        context TEXT,
        client_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Saved ideas table created successfully');

    // Create trend_analyses table
    console.log('📝 Creating trend_analyses table...');
    await sql`
      CREATE TABLE IF NOT EXISTS trend_analyses (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        keyword TEXT NOT NULL,
        trends JSONB NOT NULL DEFAULT '[]',
        articles JSONB NOT NULL DEFAULT '[]',
        analysis_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Trend analyses table created successfully');

    // Create saved_trends table for individual trend items
    console.log('📝 Creating saved_trends table...');
    await sql`
      CREATE TABLE IF NOT EXISTS saved_trends (
        id SERIAL PRIMARY KEY,
        trend_analysis_id INTEGER REFERENCES trend_analyses(id) ON DELETE CASCADE,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT,
        trend_data JSONB NOT NULL,
        articles JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Saved trends table created successfully');

    // Create indexes for better performance
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_ideas_client_id ON saved_ideas(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_ideas_created_at ON saved_ideas(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trend_analyses_client_id ON trend_analyses(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trend_analyses_keyword ON trend_analyses(keyword)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_trends_client_id ON saved_trends(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_saved_trends_analysis_id ON saved_trends(trend_analysis_id)`;
    console.log('✅ Indexes created successfully');

    console.log('🎉 New tables setup completed successfully!');
    
    // Test the connection by counting existing records
    const ideasCount = await sql`SELECT COUNT(*) as count FROM saved_ideas`;
    const trendsCount = await sql`SELECT COUNT(*) as count FROM trend_analyses`;
    const savedTrendsCount = await sql`SELECT COUNT(*) as count FROM saved_trends`;
    
    console.log(`📊 New table status:`);
    console.log(`   - Saved Ideas: ${ideasCount[0].count} records`);
    console.log(`   - Trend Analyses: ${trendsCount[0].count} records`);
    console.log(`   - Saved Trends: ${savedTrendsCount[0].count} records`);
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

// Run the setup
addNewTables();