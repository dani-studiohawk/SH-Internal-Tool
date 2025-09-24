import { useState } from 'react';

export default function IdeationAssistant() {
  const [angles, setAngles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');

  const mockAngles = [
    {
      id: 1,
      title: 'Innovation Leadership',
      description: 'Position your client as a pioneer in adopting cutting-edge technologies and methodologies',
      keyPoints: ['First-to-market advantage', 'Thought leadership', 'Competitive differentiation'],
      audience: 'Tech-savvy professionals and early adopters'
    },
    {
      id: 2,
      title: 'Customer Success Stories',
      description: 'Highlight real-world impact and measurable benefits delivered to customers',
      keyPoints: ['ROI demonstrations', 'Case studies', 'Testimonials and reviews'],
      audience: 'Decision-makers and potential customers'
    },
    {
      id: 3,
      title: 'Future Market Positioning',
      description: 'Connect current initiatives to future market trends and opportunities',
      keyPoints: ['Market predictions', 'Strategic vision', 'Long-term value proposition'],
      audience: 'Investors and strategic partners'
    },
    {
      id: 4,
      title: 'Industry Problem Solver',
      description: 'Address pain points and challenges commonly faced in the target industry',
      keyPoints: ['Pain point identification', 'Solution methodology', 'Industry expertise'],
      audience: 'Industry professionals and trade media'
    }
  ];

  const generateAngles = () => {
    if (!selectedTopic.trim()) {
      alert('Please enter a topic or campaign brief first!');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setAngles(mockAngles);
      setLoading(false);
    }, 2000);
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Ideation Assistant</h1>
          <p className="text-muted">Generate creative angles and story approaches for your campaigns</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Campaign Brief</h3>
        <textarea
          placeholder="Describe your campaign topic, client objectives, or story brief here..."
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          style={{ minHeight: '120px', marginBottom: '1rem' }}
        />
        <button onClick={generateAngles} disabled={loading}>
          {loading ? '🧠 Generating Ideas...' : '💡 Generate Story Angles'}
        </button>
      </div>

      {loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
          <h3>Crafting Creative Angles</h3>
          <p className="text-muted">Analyzing your brief and generating unique story perspectives...</p>
        </div>
      )}

      {angles.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
          <h3>Ready to Brainstorm</h3>
          <p className="text-muted">Enter your campaign brief above to generate creative story angles and approaches</p>
        </div>
      )}

      {angles.length > 0 && !loading && (
        <>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2>Generated Story Angles</h2>
            <span className="text-sm text-muted">{angles.length} angles generated</span>
          </div>
          
          <div className="grid grid-auto-fill">
            {angles.map(angle => (
              <div key={angle.id} className="card">
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                    {angle.title}
                  </h3>
                  <p className="text-muted" style={{ marginBottom: '1rem' }}>
                    {angle.description}
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="text-sm" style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                    Key Points:
                  </div>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: 0,
                    backgroundColor: 'var(--secondary-color)',
                    padding: '0.75rem',
                    borderRadius: 'var(--border-radius)'
                  }}>
                    {angle.keyPoints.map((point, index) => (
                      <li key={index} className="text-sm" style={{ marginBottom: '0.25rem' }}>
                        <span style={{ marginRight: '0.5rem' }}>•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div className="text-sm" style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                    Target Audience:
                  </div>
                  <div className="text-sm text-muted">{angle.audience}</div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}>
                    📰 Create Headlines
                  </button>
                  <button 
                    className="secondary" 
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                  >
                    📋 Save Angle
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