const { withAuth } = require('../../lib/auth-middleware');
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function handler(req, res) {
  // User session is available in req.session (provided by withAuth)
  console.log(`API accessed by user: ${req.session.user.email}`);

  if (req.method === 'GET') {
    try {
      const { clientId } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      let savedTrends = [];
      let clientActivityTrends = [];

      // Get trends from saved_trends table
      if (clientId) {
        // Verify user has access to this specific client
        if (!['admin', 'dpr_manager'].includes(userRole)) {
          const hasAccess = await sql`
            SELECT 1 FROM client_assignments 
            WHERE client_id = ${clientId} AND user_id = ${userId} AND status = 'active'
          `;
          if (hasAccess.length === 0) {
            return res.status(403).json({ error: 'Access denied to this client' });
          }
        }

        savedTrends = await sql`
          SELECT 
            st.*,
            c.name as client_name,
            c.industry as client_industry,
            'saved_trend' as source_type
          FROM saved_trends st
          LEFT JOIN clients c ON st.client_id = c.id
          WHERE st.client_id = ${clientId}
          ORDER BY st.created_at DESC
        `;

        // Get trends from client_activity table
        clientActivityTrends = await sql`
          SELECT 
            ca.*,
            c.name as client_name,
            c.industry as client_industry,
            'client_activity' as source_type
          FROM client_activity ca
          LEFT JOIN clients c ON ca.client_id = c.id
          WHERE ca.client_id = ${clientId} AND ca.activity_type = 'trend'
          ORDER BY ca.created_at DESC
        `;
      } else {
        // Get all trends user has access to
        if (['admin', 'dpr_manager'].includes(userRole)) {
          savedTrends = await sql`
            SELECT 
              st.*,
              c.name as client_name,
              c.industry as client_industry,
              'saved_trend' as source_type
            FROM saved_trends st
            LEFT JOIN clients c ON st.client_id = c.id
            ORDER BY st.created_at DESC
          `;

          clientActivityTrends = await sql`
            SELECT 
              ca.*,
              c.name as client_name,
              c.industry as client_industry,
              'client_activity' as source_type
            FROM client_activity ca
            LEFT JOIN clients c ON ca.client_id = c.id
            WHERE ca.activity_type = 'trend'
            ORDER BY ca.created_at DESC
          `;
        } else {
          savedTrends = await sql`
            SELECT 
              st.*,
              c.name as client_name,
              c.industry as client_industry,
              'saved_trend' as source_type
            FROM saved_trends st
            LEFT JOIN clients c ON st.client_id = c.id
            INNER JOIN client_assignments cas ON c.id = cas.client_id 
            WHERE cas.user_id = ${userId} AND cas.status = 'active'
            ORDER BY st.created_at DESC
          `;

          clientActivityTrends = await sql`
            SELECT 
              ca.*,
              c.name as client_name,
              c.industry as client_industry,
              'client_activity' as source_type
            FROM client_activity ca
            LEFT JOIN clients c ON ca.client_id = c.id
            INNER JOIN client_assignments cas ON c.id = cas.client_id
            WHERE ca.activity_type = 'trend' AND cas.user_id = ${userId} AND cas.status = 'active'
            ORDER BY ca.created_at DESC
          `;
        }
      }

      // Transform client activity trends to match saved trends format
      const transformedActivityTrends = clientActivityTrends.map(trend => ({
        id: `activity_${trend.id}`,
        title: trend.title,
        description: trend.notes || trend.content?.description || '',
        trend_data: trend.content,
        articles: trend.content?.articles || [],
        client_id: trend.client_id,
        client_name: trend.client_name,
        client_industry: trend.client_industry,
        created_at: trend.created_at,
        updated_at: trend.created_at,
        source_type: 'client_activity'
      }));

      // Combine both sources and sort by creation date
      const allTrends = [...savedTrends, ...transformedActivityTrends]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.status(200).json(allTrends);
    } catch (error) {
      console.error('Error fetching saved trends:', error);
      res.status(500).json({ error: 'Failed to fetch saved trends' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        trendAnalysisId,
        clientId, 
        title, 
        description, 
        trendData, 
        articles = [] 
      } = req.body;

      if (!title || !trendData) {
        return res.status(400).json({ error: 'Title and trend data are required' });
      }

      const result = await sql`
        INSERT INTO saved_trends (
          trend_analysis_id,
          client_id,
          title,
          description,
          trend_data,
          articles
        ) VALUES (
          ${trendAnalysisId || null},
          ${clientId || null},
          ${title},
          ${description || null},
          ${JSON.stringify(trendData)},
          ${JSON.stringify(articles)}
        )
        RETURNING *
      `;

      res.status(201).json(result[0]);
    } catch (error) {
      console.error('Error saving trend:', error);
      res.status(500).json({ error: 'Failed to save trend' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Trend ID is required' });
      }

      // Check if this is a client activity trend
      if (id.startsWith('activity_')) {
        const activityId = id.replace('activity_', '');
        await sql`DELETE FROM client_activity WHERE id = ${activityId} AND activity_type = 'trend'`;
      } else {
        // This is a saved trend
        await sql`DELETE FROM saved_trends WHERE id = ${id}`;
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting trend:', error);
      res.status(500).json({ error: 'Failed to delete trend' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Export the handler wrapped with authentication
export default withAuth(handler);