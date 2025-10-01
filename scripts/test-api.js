// Simple API test script
const http = require('http');

async function testAPI() {
  console.log('🔄 Testing API endpoints...\n');

  // Test GET /api/clients
  await testEndpoint('GET', '/api/clients', null, 'Get all clients');

  // Test POST /api/clients
  const testClient = {
    name: 'Studio Hawk Test Client',
    industry: 'Digital Marketing',
    leadDpr: 'John Doe',
    status: 'active',
    outreachLocations: ['Sydney', 'Melbourne']
  };
  
  const createdClient = await testEndpoint('POST', '/api/clients', testClient, 'Create new client');

  if (createdClient && createdClient.id) {
    // Test GET /api/clients again (should now have 1 client)
    await testEndpoint('GET', '/api/clients', null, 'Get all clients (after creation)');

    // Test PUT /api/clients
    const updateData = {
      id: createdClient.id,
      industry: 'SEO & Digital Marketing',
      url: 'https://studiohawk.com.au'
    };
    
    await testEndpoint('PUT', '/api/clients', updateData, 'Update client');

    // Test POST /api/client-activities
    const testActivity = {
      clientId: createdClient.id,
      activityType: 'trend',
      title: 'AI Content Trends 2025',
      content: { topic: 'AI', priority: 'high' },
      notes: 'Research trending AI topics for content strategy'
    };
    
    await testEndpoint('POST', '/api/client-activities', testActivity, 'Create client activity');

    // Test GET /api/client-activities
    await testEndpoint('GET', `/api/client-activities?clientId=${createdClient.id}`, null, 'Get client activities');
  }

  console.log('\n🎉 API testing completed!');
}

function testEndpoint(method, path, data, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log(`✅ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response:`, JSON.stringify(parsedData, null, 2));
          console.log('');
          resolve(parsedData);
        } catch (error) {
          console.log(`❌ ${description}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Raw response: ${responseData}`);
          console.log('');
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
      resolve(null);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run the tests
testAPI().catch(console.error);