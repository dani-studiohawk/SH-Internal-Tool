import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function IdeationAssistant() {
  const [selectionMode, setSelectionMode] = useState('brief'); // 'client', 'topic', 'brief'
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);

  const router = useRouter();

  const topics = [
    'Technology Innovation',
    'Market Trends',
    'Customer Success',
    'Industry Challenges',
    'Future Outlook',
    'Competitive Landscape',
    'Regulatory Changes',
    'Sustainability',
    'Digital Transformation',
    'Leadership Insights'
  ];

  useEffect(() => {
    const stored = localStorage.getItem('clients');
    if (stored) {
      setClients(JSON.parse(stored));
    }
  }, []);

  const generateHeadlines = async () => {
    let context = '';
    if (selectionMode === 'client' && selectedClient) {
      const client = clients.find(c => c.id == selectedClient);
      context = `Client: ${client.name}, Industry: ${client.industry}, Spheres: ${client.spheres}`;
    } else if (selectionMode === 'topic' && selectedTopic) {
      context = `Topic: ${selectedTopic}`;
    } else if (selectionMode === 'brief' && campaignBrief) {
      context = `Campaign Brief: ${campaignBrief}`;
    } else {
      alert('Please select or enter a context first!');
      return;
    }

    if (!campaignType) {
      alert('Please select a campaign type!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, campaignType })
      });
      const data = await response.json();
      setHeadlines(data.headlines);
    } catch (error) {
      console.error('Error generating headlines:', error);
      // Fallback to mock
      setHeadlines([
        {
          title: 'Mock Headline 1',
          summary: 'This is a summary of the idea.',
          sources: campaignType === 'Data lead' ? ['Source 1', 'Source 2'] : null
        },
        // Add more mocks
      ]);
    }
    setLoading(false);
  };

  const developStory = (headline, summary, sources) => {
    // Get client data if selected
    let clientData = null;
    if (selectionMode === 'client' && selectedClient) {
      clientData = clients.find(c => c.id == selectedClient);
    }

    // Prepare data to pass to PR writer
    const storyData = {
      headline,
      summary,
      sources: sources || [],
      campaignType,
      clientData,
      context: selectionMode === 'client' ? `Client: ${clientData?.name}` : 
               selectionMode === 'topic' ? `Topic: ${selectedTopic}` : 
               `Brief: ${campaignBrief}`
    };

    // Store in localStorage and navigate
    localStorage.setItem('storyData', JSON.stringify(storyData));
    router.push('/pr-writing-assistant');
  };

  const saveHeadline = (headline, summary, sources) => {
    console.log('Save Headline clicked:', { headline, summary, sources });
    try {
      // Get client data if selected
      let clientData = null;
      if (selectionMode === 'client' && selectedClient) {
        clientData = clients.find(c => c.id == selectedClient);
      }

      // Prepare data to save
      const ideaData = {
        headline,
        summary,
        sources: sources || [],
        campaignType,
        clientData,
        context: selectionMode === 'client' ? `Client: ${clientData?.name}` : 
                 selectionMode === 'topic' ? `Topic: ${selectedTopic}` : 
                 `Brief: ${campaignBrief}`
      };

      // Save to localStorage
      const existingIdeas = JSON.parse(localStorage.getItem('savedIdeas') || '[]');
      const newIdea = {
        id: Date.now().toString(),
        ...ideaData,
        savedAt: new Date().toISOString()
      };
      
      existingIdeas.unshift(newIdea); // Add to beginning
      localStorage.setItem('savedIdeas', JSON.stringify(existingIdeas));
      
      // Show success message
      alert(`✅ Headline saved successfully!\n\n"${headline}"\n\nYou can access it later in the PR Writing Assistant under "Saved Ideas".`);
    } catch (error) {
      console.error('Error saving headline:', error);
      alert('❌ Error saving headline. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Ideation Assistant</h1>
          <p className="text-muted">Generate creative headline ideas for your campaigns</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Select Context</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="radio"
              name="selectionMode"
              value="client"
              checked={selectionMode === 'client'}
              onChange={(e) => setSelectionMode(e.target.value)}
            /> Select a client
          </label>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="radio"
              name="selectionMode"
              value="topic"
              checked={selectionMode === 'topic'}
              onChange={(e) => setSelectionMode(e.target.value)}
            /> Select a topic
          </label>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="radio"
              name="selectionMode"
              value="brief"
              checked={selectionMode === 'brief'}
              onChange={(e) => setSelectionMode(e.target.value)}
            /> Enter campaign brief
          </label>
        </div>

        {selectionMode === 'client' && (
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.industry}
              </option>
            ))}
          </select>
        )}

        {selectionMode === 'topic' && (
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            <option value="">Select a topic</option>
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        )}

        {selectionMode === 'brief' && (
          <textarea
            placeholder="Describe your campaign topic, client objectives, or story brief here..."
            value={campaignBrief}
            onChange={(e) => setCampaignBrief(e.target.value)}
            style={{ minHeight: '120px', marginBottom: '1rem', width: '100%' }}
          />
        )}

        <h3>Campaign Type</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="radio"
              name="campaignType"
              value="Expert commentary"
              checked={campaignType === 'Expert commentary'}
              onChange={(e) => setCampaignType(e.target.value)}
            /> Expert commentary
          </label>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="radio"
              name="campaignType"
              value="Data lead"
              checked={campaignType === 'Data lead'}
              onChange={(e) => setCampaignType(e.target.value)}
            /> Data lead
          </label>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            <input
              type="radio"
              name="campaignType"
              value="Founder story"
              checked={campaignType === 'Founder story'}
              onChange={(e) => setCampaignType(e.target.value)}
            /> Founder story
          </label>
        </div>

        <button onClick={generateHeadlines} disabled={loading}>
          {loading ? '🧠 Generating Headlines...' : '💡 Generate Headlines'}
        </button>
      </div>

      {loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
          <h3>Generating Headline Ideas</h3>
          <p className="text-muted">Using AI to craft compelling headline options...</p>
        </div>
      )}

      {headlines.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
          <h3>Ready to Generate</h3>
          <p className="text-muted">Select your context and campaign type above to generate headline ideas</p>
        </div>
      )}

      {headlines.length > 0 && !loading && (
        <>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2>Generated Headlines</h2>
            <span className="text-sm text-muted">{headlines.length} headlines generated</span>
          </div>
          
          <div className="grid grid-auto-fill">
            {headlines.map((headline, index) => (
              <div key={index} className="card">
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                  {headline.title}
                </h3>
                <p className="text-muted" style={{ marginBottom: '1rem' }}>
                  {headline.summary}
                </p>

                {headline.sources && headline.sources.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className="text-sm" style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                      Suggested Data Sources:
                    </div>
                    <ul style={{ 
                      listStyle: 'none', 
                      padding: 0, 
                      margin: 0,
                      backgroundColor: 'var(--secondary-color)',
                      padding: '0.75rem',
                      borderRadius: 'var(--border-radius)'
                    }}>
                      {headline.sources.map((source, idx) => (
                        <li key={idx} className="text-sm" style={{ marginBottom: '0.25rem' }}>
                          <span style={{ marginRight: '0.5rem' }}>•</span>
                          {source}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}


                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                    onClick={() => developStory(headline.title, headline.summary, headline.sources)}
                  >
                    📝 Develop Story
                  </button>
                  <button 
                    className="secondary" 
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                    onClick={() => saveHeadline(headline.title, headline.summary, headline.sources)}
                  >
                    💾 Save Headline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}