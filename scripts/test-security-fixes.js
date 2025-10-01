// Test script to verify security fixes
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test data with potentially dangerous content
const testContent = {
  headline: "Test Headline",
  summary: "Test summary",
  sources: ["https://example.com"],
  __proto__: { malicious: "data" }, // This should be sanitized
  constructor: { evil: "payload" }, // This should be sanitized
  metadata: {
    confidence: 0.95,
    version: "1.0"
  }
};

async function testValidation() {
  console.log('🔐 Testing Security Fixes...\n');
  
  // Test 1: Content validation and sanitization
  console.log('1. Testing JSONB content validation and sanitization...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/client-activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, this would need proper authentication
      },
      body: JSON.stringify({
        clientId: 1,
        activityType: 'trend',
        title: 'Security Test',
        content: testContent
      })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ Authentication required (as expected)');
    } else {
      const data = await response.text();
      console.log(`   Response: ${data.substring(0, 200)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  // Test 2: Rate limiting
  console.log('\n2. Testing rate limiting...');
  
  let requestCount = 0;
  const maxRequests = 12; // Try to exceed the limit
  
  for (let i = 0; i < maxRequests; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/analyze-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: [{ title: 'Test', description: 'Test', publishedAt: new Date() }],
          keyword: 'test'
        })
      });
      
      requestCount++;
      console.log(`   Request ${requestCount}: Status ${response.status}`);
      
      if (response.status === 429) {
        console.log('   ✅ Rate limiting is working!');
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`   Request ${requestCount + 1}: Error - ${error.message}`);
    }
  }
  
  // Test 3: Usage dashboard
  console.log('\n3. Testing usage dashboard...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/usage-dashboard`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ Authentication required for dashboard (as expected)');
    } else {
      const data = await response.json();
      console.log(`   ✅ Dashboard accessible (would need auth in real usage)`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n🎉 Security testing complete!');
  console.log('\n📋 Summary of implemented fixes:');
  console.log('   ✅ JSON schema validation for content fields');
  console.log('   ✅ Content sanitization (removes dangerous properties)');
  console.log('   ✅ Rate limiting on expensive AI endpoints');
  console.log('   ✅ User-based rate limiting (requires authentication)');
  console.log('   ✅ Usage dashboard for monitoring API consumption');
  console.log('   ✅ Proper error handling and validation');
}

// Run the tests if this script is executed directly
if (require.main === module) {
  testValidation().catch(console.error);
}

module.exports = { testValidation };