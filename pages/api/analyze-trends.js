import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { articles, keyword } = req.body;

  if (!articles || !keyword) {
    return res.status(400).json({ error: 'Missing articles or keyword' });
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ error: 'Articles must be a non-empty array' });
  }

  try {
    const articlesText = articles.map(article => 
      `Title: ${article.title}\nDescription: ${article.description}\nPublished: ${article.publishedAt}`
    ).join('\n\n');

    const prompt = `Analyze the following news articles related to "${keyword}" and identify emerging trends. 

Articles:
${articlesText}

Please identify 3-5 key trends that can be inferred from these articles. For each trend, provide:
- Trend title
- Brief description  
- Market impact or relevance
- Relevance score (1-10, where 10 is highly relevant)

Only include trends that are actually supported by the articles. Discard any irrelevant or unrelated content.

IMPORTANT: Respond with ONLY a valid JSON array. Do not include any explanations, markdown formatting, or additional text. The response must be parseable as JSON.

Example format:
[{"title": "Trend Title", "description": "Brief description", "impact": "Market impact", "relevanceScore": 8}]`;

    console.log('Sending prompt to OpenAI for keyword:', keyword);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a market research analyst specializing in identifying trends from news articles. You must respond with ONLY valid JSON. No explanations, no markdown, just pure JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    console.log('OpenAI response:', responseText);
    
    // Try to parse the JSON response
    let trends;
    try {
      // First try to parse as-is
      trends = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying to extract JSON from response...');
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        try {
          trends = JSON.parse(jsonMatch[1]);
          console.log('Successfully extracted JSON from markdown code block');
        } catch (extractError) {
          console.error('Failed to parse extracted JSON:', jsonMatch[1]);
          return res.status(500).json({ error: 'Failed to parse AI response. JSON found in markdown but invalid.' });
        }
      } else {
        // Try to find JSON array directly in the text
        const arrayMatch = responseText.match(/(\[[\s\S]*?\])/);
        if (arrayMatch) {
          try {
            trends = JSON.parse(arrayMatch[1]);
            console.log('Successfully extracted JSON array from text');
          } catch (arrayError) {
            console.error('Failed to parse extracted array:', arrayMatch[1]);
            return res.status(500).json({ error: 'Failed to parse AI response. Could not extract valid JSON.' });
          }
        } else {
          console.error('No JSON found in response:', responseText);
          return res.status(500).json({ error: 'Failed to parse AI response. No JSON found in response.' });
        }
      }
    }

    if (!Array.isArray(trends)) {
      console.error('OpenAI response is not an array:', trends);
      return res.status(500).json({ error: 'AI response format is invalid. Expected an array of trends.' });
    }

    res.status(200).json({ trends });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: `Failed to analyze trends: ${error.message}` });
  }
}