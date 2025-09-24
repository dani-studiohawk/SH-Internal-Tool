import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
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

Format the response as a JSON array of objects with keys: title, summary${campaignType === 'Data lead' ? ', sources (array of strings)' : ''}.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional PR headline writer specializing in compelling, newsworthy headlines for B2B and B2C campaigns. Focus on headlines that are engaging, specific, and likely to attract media attention.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 1,
    });

    const responseText = completion.choices[0].message.content;
    const ideas = JSON.parse(responseText);

    res.status(200).json({ ideas });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate headlines' });
  }
}