// Test script for Client Activity Migration
// This script tests the new database-backed client activity system

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const baseUrl = 'http://localhost:3000/api';

async function makeRequest(path, options = {}) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    throw error;
  }
}

async function testClientActivitySystem() {
  console.log('🧪 Testing Client Activity Migration\n');
  
  try {
    // 1. Test getting clients
    console.log('1️⃣ Testing client retrieval...');
    const clients = await makeRequest('/clients');
    console.log(`✅ Found ${clients.length} clients`);
    
    if (clients.length === 0) {
      console.log('❌ No clients found! Please add some clients first.');
      return;
    }
    
    const testClient = clients[0];
    console.log(`   Using test client: ${testClient.name} (ID: ${testClient.id})\n`);
    
    // 2. Test creating a trend activity
    console.log('2️⃣ Testing trend activity creation...');
    const trendActivity = await makeRequest('/client-activities', {
      method: 'POST',
      body: JSON.stringify({
        clientId: testClient.id,
        activityType: 'trend',
        title: 'Test Trend - AI in Marketing',
        content: {
          title: 'Test Trend - AI in Marketing',
          description: 'AI-powered marketing tools are becoming mainstream',
          relevanceScore: 8,
          sources: ['TechCrunch', 'Marketing Land']
        },
        notes: 'Migration test trend'
      })
    });
    console.log(`✅ Created trend activity with ID: ${trendActivity.id}\n`);
    
    // 3. Test creating an idea activity
    console.log('3️⃣ Testing idea activity creation...');
    const ideaActivity = await makeRequest('/client-activities', {
      method: 'POST',
      body: JSON.stringify({
        clientId: testClient.id,
        activityType: 'idea',
        title: 'Test Campaign Idea',
        content: {
          headline: 'Test Campaign Idea',
          summary: 'A creative campaign leveraging AI trends',
          campaignType: 'Digital',
          sources: ['Industry Report']
        },
        notes: 'Migration test idea'
      })
    });
    console.log(`✅ Created idea activity with ID: ${ideaActivity.id}\n`);
    
    // 4. Test creating a PR activity
    console.log('4️⃣ Testing PR activity creation...');
    const prActivity = await makeRequest('/client-activities', {
      method: 'POST',
      body: JSON.stringify({
        clientId: testClient.id,
        activityType: 'pr',
        title: 'Test Press Release',
        content: {
          headline: 'Test Press Release',
          summary: 'Company announces new AI initiative',
          content: 'Full PR content would go here...',
          sources: ['Company Blog']
        },
        notes: 'Migration test PR'
      })
    });
    console.log(`✅ Created PR activity with ID: ${prActivity.id}\n`);
    
    // 5. Test retrieving all activities for the client
    console.log('5️⃣ Testing client activity retrieval...');
    const activities = await makeRequest(`/client-activities?clientId=${testClient.id}`);
    console.log(`✅ Retrieved ${activities.length} activities for client`);
    
    activities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.activityType.toUpperCase()}: ${activity.title}`);
    });
    console.log();
    
    // 6. Test updating an activity
    console.log('6️⃣ Testing activity update...');
    const updatedActivity = await makeRequest('/client-activities', {
      method: 'PUT',
      body: JSON.stringify({
        id: trendActivity.id,
        notes: 'Updated notes - migration test successful'
      })
    });
    console.log(`✅ Updated activity notes\n`);
    
    // 7. Test deleting an activity
    console.log('7️⃣ Testing activity deletion...');
    await makeRequest('/client-activities', {
      method: 'DELETE',
      body: JSON.stringify({
        id: prActivity.id
      })
    });
    console.log(`✅ Deleted PR activity\n`);
    
    // 8. Verify final state
    console.log('8️⃣ Verifying final state...');
    const finalActivities = await makeRequest(`/client-activities?clientId=${testClient.id}`);
    console.log(`✅ Final activity count: ${finalActivities.length}`);
    console.log();
    
    console.log('🎉 CLIENT ACTIVITY MIGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log();
    console.log('📋 Summary:');
    console.log('   ✅ Client retrieval works');
    console.log('   ✅ Trend activity creation works');
    console.log('   ✅ Idea activity creation works');
    console.log('   ✅ PR activity creation works');
    console.log('   ✅ Activity retrieval works');
    console.log('   ✅ Activity update works');
    console.log('   ✅ Activity deletion works');
    console.log();
    console.log('🚀 Your Client Activity system is now fully migrated to the database!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Migration issues detected. Please check:');
    console.log('   1. Database connection');
    console.log('   2. API endpoints');
    console.log('   3. Client data exists');
  }
}

// Check if this is being run directly
if (require.main === module) {
  console.log('🚀 Starting Client Activity Migration Test...\n');
  
  testClientActivitySystem()
    .then(() => {
      console.log('\n✅ Test completed. Press any key to exit...');
      rl.question('', () => {
        rl.close();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('\n❌ Test failed with error:', error);
      rl.close();
      process.exit(1);
    });
} else {
  module.exports = { testClientActivitySystem };
}