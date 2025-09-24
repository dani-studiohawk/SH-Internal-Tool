import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function IdeationAssistant() {
  const [selectionMode, setSelectionMode] = useState('brief'); // 'client', 'topic', 'brief'
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [ideas, setIdeas] = useState([]);
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

  const generateIdeas = async () => {
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
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, campaignType })
      });
      const data = await response.json();
      setIdeas(data.ideas);
    } catch (error) {
      console.error('Error generating ideas:', error);
      // Fallback to mock
      setIdeas([
        {
          title: 'Mock Idea 1',
          summary: 'This is a summary of the idea.',
          sources: campaignType === 'Data lead' ? ['Source 1', 'Source 2'] : null
        },
        // Add more mocks
      ]);
    }
    setLoading(false);
  };

  const developStory = (ideaTitle, ideaSummary, ideaSources) => {
    // Get client data if selected
    let clientData = null;
    if (selectionMode === 'client' && selectedClient) {
      clientData = clients.find(c => c.id == selectedClient);
    }

    // Prepare data to pass to PR writer
    const storyData = {
      headline: ideaTitle,
      summary: ideaSummary,
      sources: ideaSources || [],
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

  const saveIdea = (ideaTitle, ideaSummary, ideaSources) => {
    console.log('Save Idea clicked:', { ideaTitle, ideaSummary, ideaSources });
    try {
      // Get client data if selected
      let clientData = null;
      if (selectionMode === 'client' && selectedClient) {
        clientData = clients.find(c => c.id == selectedClient);
      }

      // Prepare data to save
      const ideaData = {
        headline: ideaTitle,
        summary: ideaSummary,
        sources: ideaSources || [],
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
      alert(`✅ Idea saved successfully!\n\n"${ideaTitle}"\n\nYou can access it later in the PR Writing Assistant under "Saved Ideas".`);
    } catch (error) {
      console.error('Error saving idea:', error);
      alert('❌ Error saving idea. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Ideation Assistant</h1>
          <p className="text-muted">Generate creative ideas for your campaigns</p>
        </div>
      </div>

      {/* Context Selection */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Choose Your Starting Point</h3>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Select one approach to generate ideas
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {/* Client Card */}
          <div
            className={`card ${selectionMode === 'client' ? 'selected' : ''}`}
            style={{
              cursor: 'pointer',
              border: selectionMode === 'client' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: selectionMode === 'client' ? 'rgba(0, 201, 255, 0.05)' : 'var(--secondary-color)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setSelectionMode('client')}
          >
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Start with a Client</h4>
              <p className="text-sm text-muted">
                Generate ideas based on an existing client's profile and industry
              </p>
            </div>
          </div>

          {/* Topic Card */}
          <div
            className={`card ${selectionMode === 'topic' ? 'selected' : ''}`}
            style={{
              cursor: 'pointer',
              border: selectionMode === 'topic' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: selectionMode === 'topic' ? 'rgba(0, 201, 255, 0.05)' : 'var(--secondary-color)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setSelectionMode('topic')}
          >
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💡</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Choose a Topic</h4>
              <p className="text-sm text-muted">
                Pick from popular campaign topics and themes
              </p>
            </div>
          </div>

          {/* Brief Card */}
          <div
            className={`card ${selectionMode === 'brief' ? 'selected' : ''}`}
            style={{
              cursor: 'pointer',
              border: selectionMode === 'brief' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: selectionMode === 'brief' ? 'rgba(0, 201, 255, 0.05)' : 'var(--secondary-color)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setSelectionMode('brief')}
          >
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Write a Brief</h4>
              <p className="text-sm text-muted">
                Describe your campaign idea in your own words
              </p>
            </div>
          </div>
        </div>

        {/* Context Details */}
        <div style={{ marginBottom: '2rem' }}>
          {selectionMode === 'client' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Client
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.industry}
                  </option>
                ))}
              </select>
              {selectedClient && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--secondary-color)',
                  borderRadius: 'var(--border-radius)'
                }}>
                  <div className="text-sm">
                    <strong>Client:</strong> {clients.find(c => c.id == selectedClient)?.name}
                    <br />
                    <strong>Industry:</strong> {clients.find(c => c.id == selectedClient)?.industry}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectionMode === 'topic' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Choose a topic...</option>
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
              {selectedTopic && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--secondary-color)',
                  borderRadius: 'var(--border-radius)'
                }}>
                  <div className="text-sm">
                    <strong>Selected Topic:</strong> {selectedTopic}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectionMode === 'brief' && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Campaign Brief
              </label>
              <textarea
                placeholder="Describe your campaign topic, client objectives, target audience, key messages, or any specific requirements..."
                value={campaignBrief}
                onChange={(e) => setCampaignBrief(e.target.value)}
                style={{
                  minHeight: '120px',
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'white',
                  resize: 'vertical'
                }}
              />
              <div className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
                Be as specific as possible - include details about the story, audience, goals, or any constraints.
              </div>
            </div>
          )}
        </div>

        {/* Campaign Type Selection */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Campaign Type</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { value: 'Expert commentary', label: 'Expert Commentary', icon: '🎯', desc: 'Thought leadership and insights' },
              { value: 'Data lead', label: 'Data Lead', icon: '📊', desc: 'Research and statistics' },
              { value: 'Founder story', label: 'Founder Story', icon: '🚀', desc: 'Personal journey and vision' }
            ].map(type => (
              <label
                key={type.value}
                style={{
                  display: 'block',
                  cursor: 'pointer',
                  padding: '1rem',
                  border: campaignType === type.value ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: campaignType === type.value ? 'rgba(0, 201, 255, 0.05)' : 'var(--secondary-color)',
                  transition: 'all 0.3s ease'
                }}
              >
                <input
                  type="radio"
                  name="campaignType"
                  value={type.value}
                  checked={campaignType === type.value}
                  onChange={(e) => setCampaignType(e.target.value)}
                  style={{ display: 'none' }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{type.icon}</div>
                  <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{type.label}</div>
                  <div className="text-sm text-muted">{type.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={generateIdeas}
            disabled={loading || !campaignType || (
              (selectionMode === 'client' && !selectedClient) ||
              (selectionMode === 'topic' && !selectedTopic) ||
              (selectionMode === 'brief' && !campaignBrief.trim())
            )}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '500'
            }}
          >
            {loading ? '🧠 Generating Headlines...' : '� Generate Headline Ideas'}
          </button>
          {!campaignType && (
            <div className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
              Please select a campaign type above
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
          <h3>Generating Ideas</h3>
          <p className="text-muted">Using AI to craft compelling idea options...</p>
        </div>
      )}

      {ideas.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
          <h3>Ready to Generate</h3>
          <p className="text-muted">Select your context and campaign type above to generate ideas</p>
        </div>
      )}

      {ideas.length > 0 && !loading && (
        <>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2>Generated Ideas</h2>
            <span className="text-sm text-muted">{ideas.length} ideas generated</span>
          </div>
          
          <div className="grid grid-auto-fill">
            {ideas.map((idea, index) => (
              <div key={index} className="card">
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                  {idea.title}
                </h3>
                <p className="text-muted" style={{ marginBottom: '1rem' }}>
                  {idea.summary}
                </p>

                {idea.sources && idea.sources.length > 0 && (
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
                      {idea.sources.map((source, idx) => (
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
                    onClick={() => developStory(idea.title, idea.summary, idea.sources)}
                  >
                    📝 Develop Story
                  </button>
                  <button 
                    className="secondary" 
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                    onClick={() => saveIdea(idea.title, idea.summary, idea.sources)}
                  >
                    💾 Save Idea
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