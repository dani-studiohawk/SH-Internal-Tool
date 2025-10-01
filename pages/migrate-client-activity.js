// Data Migration Script: localStorage to Database
// This script helps migrate existing client activity data from localStorage to the database

export default function ClientActivityMigration() {
  const migrateClientActivities = async () => {
    try {
      console.log('🔄 Starting Client Activity Migration from localStorage to Database...');
      
      // Get all localStorage keys that match client activity pattern
      const clientActivityKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('client_') && key.endsWith('_activity')) {
          clientActivityKeys.push(key);
        }
      }
      
      if (clientActivityKeys.length === 0) {
        alert('No client activity data found in localStorage to migrate.');
        return;
      }
      
      console.log(`Found ${clientActivityKeys.length} client activity records to migrate`);
      
      let totalMigrated = 0;
      let errors = [];
      
      // Process each client's activity data
      for (const key of clientActivityKeys) {
        try {
          // Extract client ID from key (client_123_activity -> 123)
          const clientId = parseInt(key.split('_')[1]);
          
          // Get the stored activity data
          const activityData = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Migrate trends
          if (activityData.savedTrends && activityData.savedTrends.length > 0) {
            for (const trend of activityData.savedTrends) {
              try {
                await migrateActivity(clientId, 'trend', trend);
                totalMigrated++;
              } catch (error) {
                errors.push(`Failed to migrate trend "${trend.title || trend.headline}": ${error.message}`);
              }
            }
          }
          
          // Migrate ideas
          if (activityData.savedIdeas && activityData.savedIdeas.length > 0) {
            for (const idea of activityData.savedIdeas) {
              try {
                await migrateActivity(clientId, 'idea', idea);
                totalMigrated++;
              } catch (error) {
                errors.push(`Failed to migrate idea "${idea.title || idea.headline}": ${error.message}`);
              }
            }
          }
          
          // Migrate PRs
          if (activityData.savedPRs && activityData.savedPRs.length > 0) {
            for (const pr of activityData.savedPRs) {
              try {
                await migrateActivity(clientId, 'pr', pr);
                totalMigrated++;
              } catch (error) {
                errors.push(`Failed to migrate PR "${pr.title || pr.headline}": ${error.message}`);
              }
            }
          }
          
          console.log(`✅ Migrated all activities for client ${clientId}`);
          
        } catch (error) {
          errors.push(`Failed to process ${key}: ${error.message}`);
        }
      }
      
      // Report results
      console.log('🎉 Migration completed!');
      console.log(`📊 Results:`);
      console.log(`   ✅ Total items migrated: ${totalMigrated}`);
      console.log(`   ❌ Errors: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log(`❌ Migration errors:`, errors);
        alert(`Migration completed with ${errors.length} errors. Check console for details.\n\n✅ Successfully migrated: ${totalMigrated} items`);
      } else {
        alert(`🎉 Migration completed successfully!\n\n✅ Migrated ${totalMigrated} items to the database.`);
      }
      
      // Ask if user wants to clear localStorage
      if (totalMigrated > 0 && confirm('Migration successful! Would you like to clear the old localStorage data?\n\n⚠️ This cannot be undone. Make sure the migration was successful.')) {
        for (const key of clientActivityKeys) {
          localStorage.removeItem(key);
        }
        alert('✅ Old localStorage data cleared!');
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      alert('Migration failed: ' + error.message);
    }
  };

  const migrateActivity = async (clientId, activityType, item) => {
    // Transform the old format to new database format
    const activityData = {
      clientId: clientId,
      activityType: activityType,
      title: item.title || item.headline || `${activityType} from migration`,
      content: {
        // Preserve all original data in content field
        ...item,
        // Ensure key fields are present
        headline: item.headline || item.title,
        summary: item.summary || item.description || '',
        sources: item.sources || [],
        campaignType: item.campaignType || '',
        relevanceScore: item.relevanceScore || null,
        clientData: item.clientData || null,
        context: item.context || ''
      },
      notes: item.notes || 'Migrated from localStorage'
    };

    const response = await fetch('/api/client-activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save activity');
    }

    return response.json();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔄 Client Activity Migration Tool</h2>
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #dee2e6'
      }}>
        <h3>📋 What this tool does:</h3>
        <ul style={{ marginBottom: '1rem' }}>
          <li>✅ Migrates all client activity data from localStorage to the database</li>
          <li>✅ Preserves trends, ideas, and press releases</li>
          <li>✅ Maintains all metadata (notes, sources, campaign types, etc.)</li>
          <li>✅ Safe migration - doesn't delete localStorage data until confirmed</li>
        </ul>
        
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '1rem', 
          borderRadius: '6px',
          border: '1px solid #ffeaa7'
        }}>
          <strong>⚠️ Important:</strong> This will migrate data from localStorage to your database. 
          Make sure your database connection is working before proceeding.
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={migrateClientActivities}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          🚀 Start Migration
        </button>
        
        <button 
          onClick={() => window.location.href = '/client-directory'}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#545b62'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          Cancel
        </button>
      </div>
      
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#6c757d' }}>
        <h4>🔍 How to verify migration:</h4>
        <ol>
          <li>Go to Client Directory after migration</li>
          <li>Click on any client to view their activity</li>
          <li>Verify all your trends, ideas, and PRs are present</li>
          <li>Check that notes and metadata are preserved</li>
        </ol>
      </div>
    </div>
  );
}