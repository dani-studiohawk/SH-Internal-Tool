const https = require('https');
const http = require('http');

// Simple manual test - let's directly call the API once server is running
async function simpleTest() {
  console.log('Testing API connection...');
  
  try {
    // Test basic connectivity first
    const response = await makeRequest('GET', '/api/clients');
    console.log('✅ API is working!');
    console.log('Response:', response);
    
    // Create a test client
    console.log('\n📝 Creating test client...');
    const newClient = await makeRequest('POST', '/api/clients', {
      name: 'Test Client',
      industry: 'Technology',
      status: 'active'
    });
    console.log('✅ Client created:', newClient);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

simpleTest();