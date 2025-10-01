#!/usr/bin/env node

/**
 * Post-Implementation Test Script
 * Validates that authentication has been properly implemented
 */

const fs = require('fs')
const path = require('path')

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green')
    return true
  } else {
    log(`❌ ${description}`, 'red')
    return false
  }
}

function checkFileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes(searchString)) {
      log(`✅ ${description}`, 'green')
      return true
    } else {
      log(`❌ ${description}`, 'red')
      return false
    }
  } catch (error) {
    log(`❌ ${description} (file not found)`, 'red')
    return false
  }
}

function checkEnvironmentFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red')
    return false
  }
  
  const content = fs.readFileSync(envPath, 'utf8')
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]
  
  let allFound = true
  requiredVars.forEach(varName => {
    if (content.includes(varName)) {
      log(`✅ Environment variable ${varName} found`, 'green')
    } else {
      log(`❌ Environment variable ${varName} missing`, 'red')
      allFound = false
    }
  })
  
  return allFound
}

function countProtectedApis() {
  const apiDir = path.join(process.cwd(), 'pages', 'api')
  const files = getAllJSFiles(apiDir)
  
  let protectedCount = 0
  let totalCount = 0
  
  files.forEach(file => {
    // Skip auth-related files
    if (file.includes('auth') || file.includes('[...nextauth]')) {
      return
    }
    
    totalCount++
    try {
      const content = fs.readFileSync(file, 'utf8')
      if (content.includes('withAuth')) {
        protectedCount++
      }
    } catch (error) {
      // Skip files that can't be read
    }
  })
  
  log(`Protected APIs: ${protectedCount}/${totalCount}`, protectedCount === totalCount ? 'green' : 'red')
  return protectedCount === totalCount
}

function getAllJSFiles(dir) {
  let files = []
  const items = fs.readdirSync(dir)
  
  items.forEach(item => {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      files = files.concat(getAllJSFiles(fullPath))
    } else if (item.endsWith('.js')) {
      files.push(fullPath)
    }
  })
  
  return files
}

async function main() {
  log('🔒 Studio Hawk Internal Tool - Authentication Implementation Test', 'blue')
  log('=' * 70, 'blue')
  log('')
  
  let passed = 0
  let total = 0
  
  // Test 1: Core Authentication Files
  log('📁 Core Authentication Files:', 'yellow')
  total++
  if (checkFile('lib/auth.js', 'NextAuth configuration')) passed++
  
  total++
  if (checkFile('lib/auth-middleware.js', 'Authentication middleware')) passed++
  
  total++
  if (checkFile('pages/api/auth/[...nextauth].js', 'NextAuth API route')) passed++
  
  total++
  if (checkFile('pages/auth/signin.js', 'Custom sign-in page')) passed++
  
  total++
  if (checkFile('pages/auth/error.js', 'Authentication error page')) passed++
  
  log('')
  
  // Test 2: Database Setup
  log('🗄️  Database Setup:', 'yellow')
  total++
  if (checkFile('scripts/setup-auth-tables.js', 'Users table migration script')) passed++
  
  log('')
  
  // Test 3: Environment Configuration
  log('⚙️  Environment Configuration:', 'yellow')
  total++
  if (checkEnvironmentFile()) passed++
  
  log('')
  
  // Test 4: API Protection
  log('🛡️  API Protection:', 'yellow')
  total++
  if (countProtectedApis()) passed++
  
  log('')
  
  // Test 5: Frontend Integration
  log('🎨 Frontend Integration:', 'yellow')
  total++
  if (checkFileContains('pages/_app.js', 'SessionProvider', 'SessionProvider in _app.js')) passed++
  
  total++
  if (checkFileContains('components/Sidebar.js', 'useSession', 'Authentication in Sidebar component')) passed++
  
  log('')
  
  // Test 6: Dependencies
  log('📦 Dependencies:', 'yellow')
  total++
  if (checkFileContains('package.json', 'next-auth', 'NextAuth.js dependency')) passed++
  
  log('')
  
  // Summary
  log('=' * 70, 'blue')
  log(`Test Results: ${passed}/${total} checks passed`, passed === total ? 'green' : 'red')
  
  if (passed === total) {
    log('🎉 All authentication implementation tests passed!', 'green')
    log('')
    log('Next Steps:', 'yellow')
    log('1. Set up OAuth providers (Google, Azure AD)', 'blue')
    log('2. Update environment variables with real OAuth credentials', 'blue')
    log('3. Generate a secure NEXTAUTH_SECRET', 'blue')
    log('4. Test the authentication flow', 'blue')
    log('5. Deploy to production with proper environment variables', 'blue')
  } else {
    log('⚠️  Some tests failed. Please review the implementation.', 'red')
    process.exit(1)
  }
}

// Run the tests
main().catch(console.error)

module.exports = { main }