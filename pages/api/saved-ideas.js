import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const ideas = await sql`
        SELECT 
          si.*,
          c.name as client_name,
          c.industry as client_industry
        FROM saved_ideas si
        LEFT JOIN clients c ON si.client_id = c.id
        ORDER BY si.created_at DESC
      `;
      
      // Transform the data to match the current frontend format
      const transformedIdeas = ideas.map(idea => ({
        id: idea.id.toString(),
        headline: idea.headline,
        summary: idea.summary,
        sources: idea.sources || [],
        campaignType: idea.campaign_type,
        context: idea.context,
        clientData: idea.client_data || (idea.client_name ? {
          id: idea.client_id,
          name: idea.client_name,
          industry: idea.client_industry
        } : null),
        savedAt: idea.created_at
      }));

      res.status(200).json(transformedIdeas);
    } catch (error) {
      console.error('Error fetching saved ideas:', error);
      res.status(500).json({ error: 'Failed to fetch saved ideas' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        headline, 
        summary, 
        sources = [], 
        campaignType, 
        context, 
        clientData 
      } = req.body;

      if (!headline || !summary) {
        return res.status(400).json({ error: 'Headline and summary are required' });
      }

      const result = await sql`
        INSERT INTO saved_ideas (
          client_id,
          headline,
          summary,
          sources,
          campaign_type,
          context,
          client_data
        ) VALUES (
          ${clientData?.id || null},
          ${headline},
          ${summary},
          ${JSON.stringify(sources)},
          ${campaignType || null},
          ${context || null},
          ${clientData ? JSON.stringify(clientData) : null}
        )
        RETURNING *
      `;

      const savedIdea = result[0];
      
      // Transform response to match frontend format
      const transformedIdea = {
        id: savedIdea.id.toString(),
        headline: savedIdea.headline,
        summary: savedIdea.summary,
        sources: savedIdea.sources || [],
        campaignType: savedIdea.campaign_type,
        context: savedIdea.context,
        clientData: savedIdea.client_data,
        savedAt: savedIdea.created_at
      };

      res.status(201).json(transformedIdea);
    } catch (error) {
      console.error('Error saving idea:', error);
      res.status(500).json({ error: 'Failed to save idea' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Idea ID is required' });
      }

      await sql`DELETE FROM saved_ideas WHERE id = ${id}`;
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting idea:', error);
      res.status(500).json({ error: 'Failed to delete idea' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}