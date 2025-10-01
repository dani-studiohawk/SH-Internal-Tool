const { withAuth } = require('../../lib/auth-middleware');
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handler(req, res) {
  // User session is available in req.session (provided by withAuth)
  console.log(`API accessed by user: ${req.session.user.email}`);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { context, campaignType } = req.body;

  if (!context || !campaignType) {
    return res.status(400).json({ error: 'Missing context or campaignType' });
  }

  try {
    const examples = {
      'Expert commentary': [
        '"Study Finds Brits Don’t Know Laundry Symbols: “It’s Costing Thousands!” Expert Warns"',
        '"The “Cute” Pet  Behaviour That Is Landing Aussie Drivers with Hefty Fines"',
        '"Vet Issues Warning Over Seed Grass Injuries to Dogs: Hidden Spring Hazard Could Cost Owners Hundreds in Vet Bills"'
      ],
      'Data lead': [
        '"Curb Appeal Counts: Outdoor Styling Could Add up to $200K to Your Property Sale, Say Experts"',
        '"Survivalist\'s Tips “to Save a Life”: Australia’s Breakdown Danger Roads, Revealed"',
        '"93% of Parents Worry About Their Baby Overheating While Sleeping in Summer, New Survey Finds"'
      ],
      'Founder story': [
        '"We Want People to Get Home Alive’: Designer Turns Personal Tragedy Into Safer Cycling Gear"',
        '"Cycling designer reveals how pal\'s horror crash inspired her top-selling kit"'
      ]
    };

    const prompt = `Generate 5 creative ideas for a Digital PR campaign based on the following context: ${context}. The campaign type is: ${campaignType}.

Here are examples of strong ideas for this campaign type:
${examples[campaignType].map(ex => `- "${ex}"`).join('\n')}

For each idea, provide:
- Title (the main idea expressed as a compelling headline)
- A one-sentence summary of the idea
${campaignType === 'Data lead' ? '- Suggested sources for the data (either external or internal)' : ''}

IMPORTANT: Respond with ONLY a valid JSON array. Do not include any explanations, markdown formatting, or additional text. The response must be parseable as JSON.

Example format:
[{"title": "Headline Idea", "summary": "Brief summary of the idea"${campaignType === 'Data lead' ? ', "sources": ["Source 1", "Source 2"]' : ''}}]`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional PR headline writer specializing in compelling, newsworthy headlines for B2B and B2C campaigns. You must respond with ONLY valid JSON. No explanations, no markdown, just pure JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 1,
    });

    const responseText = completion.choices[0].message.content;
    console.log('OpenAI response:', responseText);
    
    // Try to parse the JSON response
    let ideas;
    try {
      // First try to parse as-is
      ideas = JSON.parse(responseText);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying to extract JSON from response...');
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        try {
          ideas = JSON.parse(jsonMatch[1]);
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
            ideas = JSON.parse(arrayMatch[1]);
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

    res.status(200).json({ ideas });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate headlines' });
  }
}

// Export the handler wrapped with authentication
export default withAuth(handler);