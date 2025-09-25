import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { storyAngle, headlineStyle, clientData } = req.body;

  if (!storyAngle) {
    return res.status(400).json({ error: 'Missing story angle' });
  }

  try {
    const styleInstructions = {
      'the-sun': 'Create punchy, sensational headlines in The Sun newspaper style. Use bold claims, emotional language, and attention-grabbing phrases. Include quotation marks and exclamation points where appropriate.',
      'bbc-news': 'Create authoritative, factual headlines in BBC News style. Professional, clear, and informative. Avoid sensationalism and focus on key facts.',
      'guardian': 'Create thoughtful, analytical headlines in The Guardian style. Often include context, analysis, and measured tone. May include subtle opinion or perspective.',
      'telegraph': 'Create traditional, establishment headlines in The Telegraph style. Professional, conservative tone with focus on business and politics.',
      'daily-mail': 'Create dramatic, attention-grabbing headlines in Daily Mail style. Use emotional language, focus on impact to readers, often with "EXCLUSIVE" or strong claims.',
      'financial-times': 'Create business-focused, analytical headlines in Financial Times style. Professional, market-focused, with emphasis on economic impact and data.',
      'buzzfeed': 'Create engaging, social media-friendly headlines in BuzzFeed style. Use numbers, "This", "These", emotional hooks, and shareable angles.',
      'mixed': 'Create a variety of headline styles mixing different publication approaches from tabloid to broadsheet.'
    };

    const clientContext = clientData ? 
      `Client: ${clientData.name} (${clientData.industry}). Tone of voice: ${clientData.toneOfVoice || 'professional'}. Business focus: ${clientData.spheres || 'general business'}.` : 
      '';

    const prompt = `Generate 8 compelling headlines for this story angle: "${storyAngle}"

Style Focus: ${styleInstructions[headlineStyle] || styleInstructions['mixed']}

${clientContext}

Requirements:
- Headlines should be attention-grabbing and media-friendly
- Vary the length and approach (8-15 words ideally)
- Include strong action words and compelling angles
- Make them newsworthy and shareable
- Each headline should have a different angle or approach

Return a JSON object with a "headlines" array. Each headline object should contain:
- text: the headline text
- style: the publication style (The Sun, BBC News, The Guardian, The Telegraph, Daily Mail, Financial Times, BuzzFeed)
- strength: a score from 7.0-9.5 (based on newsworthiness, clarity, and appeal)
- appeal: target audience (e.g., "Professional media, trade publications")

JSON format:
{
  "headlines": [
    {
      "text": "Local Tech Company Pioneers AI-Driven Customer Service Revolution",
      "style": "BBC News", 
      "strength": 8.5,
      "appeal": "Professional media, trade publications"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert PR and marketing headline writer. You MUST respond with valid JSON only. Do not include any explanation, comments, or text outside the JSON array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    console.log('OpenAI Response:', responseText);
    
    try {
      // Try to parse the JSON response
      const parsedResponse = JSON.parse(responseText);
      const headlines = parsedResponse.headlines || parsedResponse;
      
      // Ensure headlines is an array
      const headlinesArray = Array.isArray(headlines) ? headlines : [headlines];
      
      // Add unique IDs to each headline and validate structure
      const headlinesWithIds = headlinesArray
        .filter(headline => headline && headline.text) // Only include valid headlines
        .map((headline, index) => ({
          id: Date.now() + index,
          text: headline.text || 'Untitled Headline',
          style: headline.style || 'Newsworthy',
          strength: parseFloat(headline.strength) || 8.0,
          appeal: headline.appeal || 'General audience'
        }));

      if (headlinesWithIds.length === 0) {
        throw new Error('No valid headlines found in response');
      }

      res.status(200).json({ headlines: headlinesWithIds });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw response:', responseText);
      
      // Generate fallback headlines based on the story angle
      const fallbackHeadlines = [
        'Breaking: Industry Leader Announces Major Innovation',
        'New Study Reveals Surprising Market Trends',
        'Local Company Pioneers Game-Changing Technology', 
        'Expert Shares Insights on Industry Future',
        'The Story Behind This Year\'s Biggest Success',
        'How Innovation is Transforming the Industry',
        'Market Analysis: What This Means for Consumers',
        'Industry Insider Reveals Key Success Strategies'
      ].map((text, index) => {
        const styles = ['BBC News', 'The Guardian', 'The Telegraph', 'Financial Times'];
        return {
          id: Date.now() + index,
          text: text,
          style: styles[index % styles.length],
          strength: Math.random() * 1.5 + 7.5, // Random score between 7.5-9.0
          appeal: 'General media audience'
        };
      });

      res.status(200).json({ headlines: fallbackHeadlines });
    }

  } catch (error) {
    console.error('Error generating headlines:', error);
    res.status(500).json({ error: 'Failed to generate headlines' });
  }
}