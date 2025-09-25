import { useState, useEffect } from 'react';

export default function HeadlineAssistant() {
  const [headlines, setHeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storyAngle, setStoryAngle] = useState('');
  const [headlineStyle, setHeadlineStyle] = useState('newsworthy');
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  useEffect(() => {
    // Load clients for optional client-specific headlines
    const stored = localStorage.getItem('clients');
    if (stored) {
      setClients(JSON.parse(stored));
    }
  }, []);

  const mockHeadlines = [
    {
      id: 1,
      text: 'Local Tech Company Pioneers AI-Driven Customer Service Revolution',
      style: 'Newsworthy',
      strength: 8.5,
      appeal: 'Professional media, trade publications'
    },
    {
      id: 2,
      text: 'Breaking: Industry Leader Announces Game-Changing Technology',
      style: 'Breaking News',
      strength: 9.2,
      appeal: 'General media, broad audience'
    },
    {
      id: 3,
      text: 'How This Startup is Transforming an Entire Industry',
      style: 'Feature Story',
      strength: 7.8,
      appeal: 'Business media, entrepreneurs'
    },
    {
      id: 4,
      text: 'The Future of Customer Experience: A Local Success Story',
      style: 'Thought Leadership',
      strength: 8.1,
      appeal: 'Industry experts, thought leaders'
    },
    {
      id: 5,
      text: 'From Startup to Scale-up: The Innovation Behind the Growth',
      style: 'Human Interest',
      strength: 7.5,
      appeal: 'Local media, business community'
    }
  ];

  const generateHeadlines = async () => {
    if (!storyAngle.trim()) {
      alert('Please enter your story angle or key message first!');
      return;
    }
    
    setLoading(true);
    try {
      const selectedClient = selectedClientId ? clients.find(c => c.id == selectedClientId) : null;
      
      const response = await fetch('/api/generate-headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyAngle: storyAngle.trim(),
          headlineStyle,
          clientData: selectedClient
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate headlines: ${response.status}`);
      }

      const data = await response.json();
      setHeadlines(data.headlines);
    } catch (error) {
      console.error('Error generating headlines:', error);
      alert('Failed to generate headlines. Please try again.');
      // Fallback to mock data if API fails
      setHeadlines(mockHeadlines);
    }
    setLoading(false);
  };

  const getStrengthColor = (strength) => {
    if (strength >= 9) return '#28a745';
    if (strength >= 8) return '#ffc107';
    return '#6c757d';
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Headline Assistant</h1>
          <p className="text-muted">Create compelling headlines that capture attention and drive coverage</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Story Details</h3>
        <textarea
          placeholder="Enter your story angle, key message, or main news point..."
          value={storyAngle}
          onChange={(e) => setStoryAngle(e.target.value)}
          style={{ minHeight: '100px', marginBottom: '1rem' }}
        />
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Headline Style:
          </label>
          <select 
            value={headlineStyle} 
            onChange={(e) => setHeadlineStyle(e.target.value)}
            style={{ width: '300px' }}
          >
            <option value="the-sun">🌞 The Sun (Punchy & Bold)</option>
            <option value="bbc-news">📺 BBC News (Factual & Professional)</option>
            <option value="guardian">📰 The Guardian (Thoughtful & Analytical)</option>
            <option value="telegraph">🏛️ The Telegraph (Traditional & Establishment)</option>
            <option value="daily-mail">📢 Daily Mail (Dramatic & Emotional)</option>
            <option value="financial-times">💼 Financial Times (Business & Data-Driven)</option>
            <option value="buzzfeed">🔥 BuzzFeed (Social & Shareable)</option>
            <option value="mixed">🎭 Mixed Publication Styles</option>
          </select>
        </div>

        {/* Client Selection */}
        {clients.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Client Context (Optional):
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{ width: '250px' }}
            >
              <option value="">No specific client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.industry}
                </option>
              ))}
            </select>
            <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>
              Select a client to generate headlines tailored to their brand voice and industry
            </small>
          </div>
        )}

        <button onClick={generateHeadlines} disabled={loading}>
          {loading ? '✍️ Crafting Headlines...' : '📰 Generate Headlines'}
        </button>
      </div>

      {loading && (
        <div className="working-container loading-fade-in">
          <div className="working-emoji loading-bounce">✍️</div>
          <h3 className="working-title">Crafting Perfect Headlines</h3>
          <p className="working-subtitle">Analyzing your story angle and creating multiple headline options...</p>
          <div className="progress-dots">
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
          </div>
        </div>
      )}

      {headlines.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
          <h3>Ready to Create Headlines</h3>
          <p className="text-muted">Enter your story details above to generate compelling headlines that get noticed</p>
        </div>
      )}

      {headlines.length > 0 && !loading && (
        <>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2>Generated Headlines</h2>
            <span className="text-sm text-muted">{headlines.length} options created</span>
          </div>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
            {headlines.map((headline, index) => (
              <div key={headline.id} className="card">
                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      color: 'var(--text-primary)', 
                      marginBottom: '0.5rem',
                      fontSize: '1.25rem',
                      lineHeight: '1.4'
                    }}>
                      {headline.text}
                    </h3>
                    <div className="flex-gap" style={{ alignItems: 'center' }}>
                      <span 
                        style={{ 
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: 'var(--secondary-color)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {headline.style}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="text-sm">Strength:</span>
                        <span 
                          style={{ 
                            fontWeight: '600',
                            color: getStrengthColor(headline.strength)
                          }}
                        >
                          {headline.strength}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  backgroundColor: 'var(--secondary-color)', 
                  padding: '1rem', 
                  borderRadius: 'var(--border-radius)',
                  marginBottom: '1rem'
                }}>
                  <div className="text-sm" style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                    Best for:
                  </div>
                  <div className="text-sm text-muted">{headline.appeal}</div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem', minWidth: '120px' }}>
                    📋 Copy Headline
                  </button>
                  <button 
                    className="secondary" 
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem', minWidth: '120px' }}
                  >
                    ✍️ Write PR Draft
                  </button>
                  <button 
                    className="secondary" 
                    style={{ fontSize: '0.875rem', padding: '0.75rem 1rem', minWidth: '80px' }}
                  >
                    ⭐ Save
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