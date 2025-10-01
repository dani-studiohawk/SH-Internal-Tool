/**
 * Database migration script to create users table
 * Run this script to add authentication support to the database
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createUsersTable() {
  try {
    console.log('Creating users table...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        image TEXT,
        provider VARCHAR(50) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;
    
    // Create index on provider and provider_id
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)
    `;
    
    // Add trigger to update updated_at timestamp
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users
    `;
    
    await sql`
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;
    
    console.log('✅ Users table created successfully');
    
    // Add some sample admin users (optional)
    console.log('Adding sample admin user...');
    await sql`
      INSERT INTO users (email, name, provider, provider_id, role, created_at)
      VALUES 
        ('admin@studiohawk.com.au', 'System Admin', 'google', 'sample-admin', 'admin', CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO NOTHING
    `;
    
    console.log('✅ Sample admin user added');
    
  } catch (error) {
    console.error('❌ Error creating users table:', error);
    throw error;
  }
}

async function verifyUsersTable() {
  try {
    console.log('Verifying users table structure...');
    
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    console.log('Users table structure:');
    console.table(result);
    
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`Total users in table: ${userCount[0].count}`);
    
    console.log('✅ Users table verification complete');
    
  } catch (error) {
    console.error('❌ Error verifying users table:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting users table migration...');
    
    await createUsersTable();
    await verifyUsersTable();
    
    console.log('✅ Users table migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { createUsersTable, verifyUsersTable };