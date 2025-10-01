import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { clientId } = req.query;
      
      if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
      }

      // Get trend analyses for the client
      const analyses = await sql`
        SELECT * FROM trend_analyses 
        WHERE client_id = ${clientId}
        ORDER BY created_at DESC
      `;

      res.status(200).json(analyses);
    } catch (error) {
      console.error('Error fetching trend analyses:', error);
      res.status(500).json({ error: 'Failed to fetch trend analyses' });
    }
  } else if (req.method === 'POST') {
    try {
      const { clientId, keyword, trends, articles } = req.body;

      if (!clientId || !keyword || !trends) {
        return res.status(400).json({ error: 'Client ID, keyword, and trends are required' });
      }

      // Check if analysis for this client/keyword already exists (within last 24 hours)
      const existing = await sql`
        SELECT id FROM trend_analyses 
        WHERE client_id = ${clientId} 
        AND keyword = ${keyword}
        AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      let analysisId;

      if (existing.length > 0) {
        // Update existing analysis
        const result = await sql`
          UPDATE trend_analyses 
          SET 
            trends = ${JSON.stringify(trends)},
            articles = ${JSON.stringify(articles || [])},
            updated_at = NOW()
          WHERE id = ${existing[0].id}
          RETURNING *
        `;
        analysisId = result[0].id;
      } else {
        // Create new analysis
        const result = await sql`
          INSERT INTO trend_analyses (
            client_id,
            keyword,
            trends,
            articles
          ) VALUES (
            ${clientId},
            ${keyword},
            ${JSON.stringify(trends)},
            ${JSON.stringify(articles || [])}
          )
          RETURNING *
        `;
        analysisId = result[0].id;
      }

      res.status(201).json({ id: analysisId, success: true });
    } catch (error) {
      console.error('Error saving trend analysis:', error);
      res.status(500).json({ error: 'Failed to save trend analysis' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}