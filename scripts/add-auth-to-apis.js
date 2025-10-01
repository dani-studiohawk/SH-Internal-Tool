/**
 * Script to automatically add authentication to all API routes
 * This script will update all API files to include authentication middleware
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'pages', 'api');

// List of files to skip (already have auth or are auth-related)
const SKIP_FILES = [
  '[...nextauth].js', // NextAuth route
  'auth'              // Auth directory
];

/**
 * Add authentication to a single API file
 * @param {string} filePath - Path to the API file
 */
function addAuthToFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip certain files
  if (SKIP_FILES.some(skip => fileName.includes(skip))) {
    console.log(`⏭️  Skipping ${fileName} (auth-related file)`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has authentication
    if (content.includes('withAuth') || content.includes('requireAuth')) {
      console.log(`⏭️  Skipping ${fileName} (already has auth)`);
      return;
    }
    
    // Check if it's an API handler
    if (!content.includes('export default async function handler') && 
        !content.includes('export default function handler')) {
      console.log(`⏭️  Skipping ${fileName} (not a standard API handler)`);
      return;
    }
    
    console.log(`🔒 Adding authentication to ${fileName}...`);
    
    let newContent = content;
    
    // Add import for auth middleware at the top (after other imports)
    const importRegex = /(const.*require.*\n|import.*\n)*/;
    const importMatch = newContent.match(importRegex);
    
    if (importMatch) {
      const importSection = importMatch[0];
      const authImport = "const { withAuth } = require('../../lib/auth-middleware');\n";
      
      // Only add if not already present
      if (!importSection.includes('auth-middleware')) {
        newContent = newContent.replace(importSection, importSection + authImport);
      }
    }
    
    // Replace export default async function handler with async function handler
    newContent = newContent.replace(
      /export default async function handler/g,
      'async function handler'
    );
    
    // Replace export default function handler with function handler
    newContent = newContent.replace(
      /export default function handler/g,
      'function handler'
    );
    
    // Add export with authentication at the end
    if (!newContent.includes('export default withAuth(handler)')) {
      newContent += '\n\n// Export the handler wrapped with authentication\nexport default withAuth(handler);';
    }
    
    // Add logging for user access
    const sessionLogRegex = /(async function handler\(req, res\) \{)/;
    if (sessionLogRegex.test(newContent)) {
      newContent = newContent.replace(
        sessionLogRegex,
        '$1\n  // User session is available in req.session (provided by withAuth)\n  console.log(`API accessed by user: ${req.session.user.email}`);\n'
      );
    }
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Successfully added authentication to ${fileName}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
  }
}

/**
 * Recursively process all API files
 * @param {string} dir - Directory to process
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      addAuthToFile(fullPath);
    }
  });
}

/**
 * Main function to add authentication to all API routes
 */
function main() {
  console.log('🚀 Starting API authentication migration...');
  console.log(`Processing API directory: ${API_DIR}`);
  
  if (!fs.existsSync(API_DIR)) {
    console.error('❌ API directory not found');
    process.exit(1);
  }
  
  processDirectory(API_DIR);
  
  console.log('✅ API authentication migration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the modified files');
  console.log('2. Test each API endpoint');
  console.log('3. Update your frontend to use authenticated requests');
  console.log('4. Add environment variables for OAuth providers');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { addAuthToFile, processDirectory };