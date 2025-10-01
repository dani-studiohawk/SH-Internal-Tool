require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function setupUserManagement() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    console.log('🔄 Setting up user management system...');
    
    // First, add role column to existing users table
    console.log('📝 Adding role column to users table...');
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'assistant',
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS department TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
    `;
    console.log('✅ Users table updated with role and status columns');

    // Create client_assignments table
    console.log('📝 Creating client_assignments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS client_assignments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id),
        assigned_at TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'active',
        UNIQUE(client_id, user_id)
      )
    `;
    console.log('✅ Client assignments table created successfully');

    // Create assignment_history table for tracking changes
    console.log('📝 Creating assignment_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS assignment_history (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id),
        action TEXT NOT NULL, -- 'assigned' or 'unassigned'
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Assignment history table created successfully');

    // Create indexes for better performance
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_client_assignments_client_id ON client_assignments(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_client_assignments_user_id ON client_assignments(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_assignment_history_client_id ON assignment_history(client_id)`;
    console.log('✅ Indexes created successfully');

    // Set up initial admin user (you) if exists
    console.log('📝 Setting up initial admin user...');
    const adminEmails = ['dani@studiohawk.com.au']; // Add your email here
    
    for (const email of adminEmails) {
      await sql`
        UPDATE users 
        SET role = 'admin', department = 'Management', updated_at = NOW()
        WHERE email = ${email}
      `;
    }
    console.log('✅ Admin users configured');

    console.log('🎉 User management system setup completed successfully!');
    
    // Display current users
    const users = await sql`SELECT email, role, status FROM users ORDER BY created_at`;
    console.log('\n👥 Current users in system:');
    console.table(users);

  } catch (error) {
    console.error('❌ Error setting up user management system:', error);
    process.exit(1);
  }
}

setupUserManagement();