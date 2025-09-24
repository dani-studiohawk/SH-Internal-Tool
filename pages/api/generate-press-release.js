import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { headline, summary, clientData, campaignType, sources, currentDate } = req.body;

  if (!headline || !summary) {
    return res.status(400).json({ error: 'Missing headline or summary' });
  }

  try {
    const currentDateFormatted = currentDate || new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompt = `Write a comprehensive, professional press release following this Standard Operating Procedure for Digital PR campaigns. Create a FULL-LENGTH press release (aim for 400-600 words) that would be suitable for media distribution.

CURRENT DATE: ${currentDateFormatted}

CONTEXT:
- Headline: ${headline}
- Summary: ${summary}
- Campaign Type: ${campaignType || 'General'}
- Client: ${clientData ? `${clientData.name} (${clientData.industry})` : 'Not specified'}
${sources && sources.length > 0 ? `- Data Sources: ${sources.join(', ')}` : ''}

PRESS RELEASE REQUIREMENTS - CREATE A FULL, DETAILED RELEASE:

1. STRUCTURE (Follow exactly):
   - Start with: "For Immediate Release"
   - Dateline: [City, State] – ${currentDateFormatted} –
   - Headline (use the provided headline)
   - Lead paragraph: 2-3 detailed sentences with 5 W's and strong hook
   - 3-5 body paragraphs with substantial detail, evidence, quotes, and context
   - Company boilerplate section
   - Media contact information
   - End with "###"

2. LENGTH REQUIREMENTS:
   - Minimum 400 words, maximum 600 words
   - Include substantial detail in each paragraph
   - Expand on implications, context, and background information
   - Add relevant industry trends or market context

3. BOILERPLATE HANDLING:
   ${clientData && clientData.boilerplate ? 
     `- Use this exact boilerplate: "${clientData.boilerplate}"` : 
     `- Use placeholder: "[Insert approved company boilerplate here]"`}

4. CONTACT INFORMATION:
   ${clientData && clientData.pressContacts ? 
     `- Use this contact: "${clientData.pressContacts}"` : 
     `- Use placeholder: "[Insert press contact name, title, email, and phone number]"`}

5. CAMPAIGN-SPECIFIC CONTENT:
${campaignType === 'Data lead' ? `- Include detailed methodology, sample sizes, data collection methods
- Present key findings with specific numbers and percentages
- Explain data significance and implications` : ''}
${campaignType === 'Product launch' ? `- Detail product features, specifications, and benefits
- Include pricing, availability, and launch timeline
- Explain market positioning and competitive advantages` : ''}
${campaignType === 'Executive appointment' ? `- Detail executive background, experience, and qualifications
- Explain appointment significance and expected contributions
- Include effective date and reporting structure` : ''}
${campaignType === 'Partnership' ? `- Detail partnership scope, benefits, and strategic value
- Include quotes from both organizations
- Explain combined capabilities and market impact` : ''}
${campaignType === 'Award' ? `- Detail award criteria, selection process, and judging panel
- Explain award significance and industry recognition
- Include future implications and continued excellence` : ''}
${campaignType === 'Thought leadership' ? `- Include detailed insights, trends, and forward-looking analysis
- Provide data-backed perspectives and expert opinions
- Explain broader industry implications` : ''}
${campaignType === 'Event' ? `- Detail event agenda, speakers, and expected outcomes
- Include registration information and participation benefits
- Explain event significance and networking opportunities` : ''}

6. QUALITY STANDARDS:
   - Journalistic tone with substantial depth
   - Include 2-3 authoritative quotes with proper attribution
   - Add industry context and market implications
   - Naturally incorporate 1-2 relevant SEO keywords
   - Ensure factual accuracy and newsworthiness

Write the complete, detailed press release following this SOP exactly. Make it comprehensive enough for professional media distribution.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: 'You are a professional PR writer following StudioHawk\'s Digital PR Standard Operating Procedure. Write press releases that earn media coverage, authoritative links, and brand awareness while maintaining journalistic integrity and SEO best practices.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const pressRelease = completion.choices[0].message.content;

    res.status(200).json({ pressRelease });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate press release' });
  }
}