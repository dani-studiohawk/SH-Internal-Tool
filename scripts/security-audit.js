#!/usr/bin/env node

/**
 * Security Audit Script for Studio Hawk Internal Tool
 * Performs automated security checks and generates reports
 */

const fs = require('fs');
const path = require('path');

// Security check results
const results = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  passed: []
};

// File patterns to check
const DANGEROUS_PATTERNS = {
  localStorage: {
    pattern: /localStorage\.(getItem|setItem|removeItem)/g,
    severity: 'high',
    message: 'localStorage usage detected - should use secure storage'
  },
  clientSideApiKey: {
    pattern: /(?<!pages\/api\/).*apiKey.*process\.env/g,
    severity: 'critical', 
    message: 'Potential API key exposure in client-side code'
  },
  sqlInjection: {
    pattern: /sql`.*\${.*}.*`/g,
    severity: 'medium',
    message: 'SQL query with interpolation - verify parameterization'
  },
  realHardcodedSecrets: {
    pattern: /(password|secret|token).*=.*["'][A-Za-z0-9]{20,}["']/gi,
    severity: 'critical',
    message: 'Potential hardcoded secret detected'
  },
  consoleLog: {
    pattern: /console\.(log|error|warn|info)/g,
    severity: 'low',
    message: 'Console logging detected - ensure no sensitive data'
  }
};

// Files to exclude from certain checks
const EXCLUDE_PATTERNS = {
  localStorage: [
    'migrate-client-activity.js', // Migration script legitimately uses localStorage
    'secure-storage.js', // Secure storage library
    'migrate-data.js' // Migration script
  ],
  clientSideApiKey: [
    'pages/api/', // Server-side API routes are safe
  ],
  realHardcodedSecrets: [
    'security-audit.js', // This script has regex patterns
    'validation.js' // Has validation patterns
  ]
};

function checkFile(filePath, content) {
  const relativePath = path.relative(process.cwd(), filePath);
  const fileName = path.basename(filePath);
  
  for (const [checkName, config] of Object.entries(DANGEROUS_PATTERNS)) {
    // Skip excluded files for specific checks
    if (EXCLUDE_PATTERNS[checkName]) {
      const shouldSkip = EXCLUDE_PATTERNS[checkName].some(pattern => 
        fileName.includes(pattern) || relativePath.includes(pattern)
      );
      if (shouldSkip) continue;
    }
    
    const matches = content.match(config.pattern);
    if (matches) {
      const finding = {
        file: relativePath,
        check: checkName,
        message: config.message,
        occurrences: matches.length,
        details: matches.slice(0, 3) // Show first 3 matches
      };
      
      results[config.severity].push(finding);
    }
  }
}

function checkFileStructure() {
  const criticalFiles = [
    'lib/auth.js',
    'lib/auth-middleware.js',
    'lib/rate-limit.js',
    'lib/validation.js',
    'lib/secure-storage.js',
    'next.config.js'
  ];
  
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      results.critical.push({
        file: file,
        check: 'missingFile',
        message: `Critical security file missing: ${file}`,
        occurrences: 1
      });
    } else {
      results.passed.push({
        file: file,
        check: 'fileExists',
        message: `Security file present: ${file}`
      });
    }
  }
}

function checkEnvironmentVariables() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OPENAI_API_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    results.high.push({
      file: '.env',
      check: 'missingEnvVars',
      message: `Missing environment variables: ${missingVars.join(', ')}`,
      occurrences: missingVars.length
    });
  } else {
    results.passed.push({
      file: '.env',
      check: 'envVarsPresent',
      message: 'All required environment variables are set'
    });
  }
}

function checkPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const securityPackages = ['express-rate-limit', 'ajv'];
    
    const missingPackages = securityPackages.filter(pkg => 
      !packageJson.dependencies?.[pkg] && !packageJson.devDependencies?.[pkg]
    );
    
    if (missingPackages.length > 0) {
      results.medium.push({
        file: 'package.json',
        check: 'missingSecurityPackages',
        message: `Missing security packages: ${missingPackages.join(', ')}`,
        occurrences: missingPackages.length
      });
    } else {
      results.passed.push({
        file: 'package.json',
        check: 'securityPackagesPresent',
        message: 'Security packages are installed'
      });
    }
  } catch (error) {
    results.high.push({
      file: 'package.json',
      check: 'packageJsonError',
      message: 'Could not read package.json',
      occurrences: 1
    });
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      checkFile(filePath, content);
    }
  }
}

function generateReport() {
  const totalIssues = results.critical.length + results.high.length + results.medium.length + results.low.length;
  const totalPassed = results.passed.length;
  
  console.log('\n🔒 SECURITY AUDIT REPORT');
  console.log('=' .repeat(50));
  console.log(`Total Issues Found: ${totalIssues}`);
  console.log(`Security Checks Passed: ${totalPassed}`);
  console.log('');
  
  // Critical issues
  if (results.critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    results.critical.forEach(issue => {
      console.log(`  ❌ ${issue.file}: ${issue.message}`);
      if (issue.details) {
        issue.details.forEach(detail => console.log(`     - ${detail}`));
      }
    });
    console.log('');
  }
  
  // High priority issues
  if (results.high.length > 0) {
    console.log('⚠️  HIGH PRIORITY ISSUES:');
    results.high.forEach(issue => {
      console.log(`  ⚠️  ${issue.file}: ${issue.message}`);
      if (issue.details) {
        issue.details.forEach(detail => console.log(`     - ${detail}`));
      }
    });
    console.log('');
  }
  
  // Medium priority issues
  if (results.medium.length > 0) {
    console.log('🔶 MEDIUM PRIORITY ISSUES:');
    results.medium.forEach(issue => {
      console.log(`  🔶 ${issue.file}: ${issue.message}`);
    });
    console.log('');
  }
  
  // Low priority issues
  if (results.low.length > 0) {
    console.log('ℹ️  LOW PRIORITY ISSUES:');
    results.low.forEach(issue => {
      console.log(`  ℹ️  ${issue.file}: ${issue.message} (${issue.occurrences} occurrences)`);
    });
    console.log('');
  }
  
  // Passed checks
  if (results.passed.length > 0) {
    console.log('✅ PASSED SECURITY CHECKS:');
    results.passed.forEach(check => {
      console.log(`  ✅ ${check.message}`);
    });
    console.log('');
  }
  
  // Security score
  const score = Math.max(0, 100 - (results.critical.length * 20) - (results.high.length * 10) - (results.medium.length * 5) - (results.low.length * 1));
  console.log(`🎯 SECURITY SCORE: ${score}/100`);
  
  if (score >= 90) {
    console.log('✅ Excellent security posture!');
  } else if (score >= 70) {
    console.log('⚠️  Good security, but some improvements needed');
  } else if (score >= 50) {
    console.log('🔶 Moderate security issues detected');
  } else {
    console.log('🚨 Significant security vulnerabilities found');
  }
  
  console.log('');
  console.log('Next steps:');
  console.log('1. Address critical and high priority issues immediately');
  console.log('2. Review medium priority issues during next development cycle');
  console.log('3. Consider low priority issues for future security improvements');
  console.log('');
}

function main() {
  console.log('🔍 Starting security audit...');
  
  // Check file structure
  checkFileStructure();
  
  // Check environment variables
  checkEnvironmentVariables();
  
  // Check package.json
  checkPackageJson();
  
  // Scan all files
  scanDirectory(process.cwd());
  
  // Generate report
  generateReport();
}

// Run the audit
main();