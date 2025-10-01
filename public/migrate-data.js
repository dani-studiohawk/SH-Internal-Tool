// Migration utility for saved ideas and trends
// This can be called from the browser console to migrate localStorage data to the database

window.migrateLocalStorageToDatabase = async function() {
  console.log('🔄 Starting migration of localStorage data to database...');
  
  try {
    // Migrate saved ideas
    const savedIdeas = localStorage.getItem('savedIdeas');
    if (savedIdeas) {
      const ideas = JSON.parse(savedIdeas);
      console.log(`📝 Found ${ideas.length} saved ideas to migrate`);
      
      let migratedIdeas = 0;
      for (const idea of ideas) {
        try {
          const response = await fetch('/api/saved-ideas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              headline: idea.headline,
              summary: idea.summary,
              sources: idea.sources || [],
              campaignType: idea.campaignType,
              context: idea.context,
              clientData: idea.clientData
            })
          });
          
          if (response.ok) {
            migratedIdeas++;
          }
        } catch (error) {
          console.error('Error migrating idea:', idea.headline, error);
        }
      }
      
      console.log(`✅ Successfully migrated ${migratedIdeas}/${ideas.length} saved ideas`);
    } else {
      console.log('📝 No saved ideas found in localStorage');
    }

    // Migrate trend analyses for each client
    const clients = localStorage.getItem('clients');
    if (clients) {
      const clientsData = JSON.parse(clients);
      console.log(`📊 Checking for trend data for ${clientsData.length} clients`);
      
      let migratedAnalyses = 0;
      for (const client of clientsData) {
        const trends = localStorage.getItem(`trends_${client.id}`);
        const articles = localStorage.getItem(`articles_${client.id}`);
        const keyword = localStorage.getItem(`keyword_${client.id}`);
        
        if (trends && articles && keyword) {
          try {
            const response = await fetch('/api/trend-analyses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                clientId: client.id,
                keyword: keyword,
                trends: JSON.parse(trends),
                articles: JSON.parse(articles)
              })
            });
            
            if (response.ok) {
              migratedAnalyses++;
              console.log(`✅ Migrated trend analysis for client: ${client.name}`);
            }
          } catch (error) {
            console.error('Error migrating trend analysis for client:', client.name, error);
          }
        }
      }
      
      console.log(`✅ Successfully migrated ${migratedAnalyses} trend analyses`);
    }

    console.log('🎉 Migration completed!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
};

// Auto-run migration if this script is executed
if (typeof window !== 'undefined') {
  console.log('Migration utility loaded. Run window.migrateLocalStorageToDatabase() to migrate data.');
}