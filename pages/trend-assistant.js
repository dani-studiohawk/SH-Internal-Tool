import { useState } from 'react';

export default function TrendAssistant() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  const mockTrends = [
    { 
      id: 1, 
      title: 'AI in Marketing', 
      description: 'How AI is transforming marketing strategies across industries.',
      relevance: 'High',
      category: 'Technology',
      impact: 'Growing adoption of AI tools for personalization and automation'
    },
    { 
      id: 2, 
      title: 'Sustainable Fashion', 
      description: 'Rise of eco-friendly fashion trends and circular economy models.',
      relevance: 'Medium',
      category: 'Sustainability',
      impact: 'Consumers increasingly demand transparency in supply chains'
    },
    { 
      id: 3, 
      title: 'Remote Work Tools', 
      description: 'New tools for remote collaboration and hybrid workplace management.',
      relevance: 'High',
      category: 'Workplace',
      impact: 'Permanent shift to hybrid work models creating new market opportunities'
    },
    { 
      id: 4, 
      title: 'Voice Commerce', 
      description: 'Shopping through voice assistants and smart speakers gaining traction.',
      relevance: 'Medium',
      category: 'E-commerce',
      impact: 'Voice-optimized content becoming crucial for brands'
    }
  ];

  const findTrends = () => {
    setLoading(true);
    // Mock API call with loading state
    setTimeout(() => {
      setTrends(mockTrends);
      setLoading(false);
    }, 1500);
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Trend Assistant</h1>
          <p className="text-muted">Discover emerging trends and market opportunities for your clients</p>
        </div>
        <button onClick={findTrends} disabled={loading}>
          {loading ? '🔍 Analyzing...' : '📈 Find Latest Trends'}
        </button>
      </div>

      {loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>Analyzing Market Trends</h3>
          <p className="text-muted">Scanning social media, news sources, and industry reports...</p>
          <div style={{ 
            width: '200px', 
            height: '4px', 
            backgroundColor: 'var(--border-color)', 
            borderRadius: '2px', 
            margin: '1rem auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '40%',
              height: '100%',
              backgroundColor: 'var(--primary-color)',
              borderRadius: '2px',
              animation: 'loading 2s ease-in-out infinite'
            }}></div>
          </div>
        </div>
      )}

      {trends.length === 0 && !loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
          <h3>Ready to Discover Trends</h3>
          <p className="text-muted">Click "Find Latest Trends" to analyze current market opportunities and emerging patterns</p>
        </div>
      )}

      {trends.length > 0 && !loading && (
        <div className="grid grid-auto-fill">
          {trends.map(trend => (
            <div key={trend.id} className="card">
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <span 
                  style={{ 
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: trend.relevance === 'High' ? 'var(--accent-color)' : '#ffc107',
                    color: 'white'
                  }}
                >
                  {trend.relevance} Relevance
                </span>
                <span className="text-sm text-muted">{trend.category}</span>
              </div>
              
              <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
                {trend.title}
              </h3>
              
              <p className="text-muted" style={{ marginBottom: '1rem' }}>
                {trend.description}
              </p>
              
              <div style={{ 
                backgroundColor: 'var(--secondary-color)', 
                padding: '1rem', 
                borderRadius: 'var(--border-radius)',
                marginBottom: '1rem'
              }}>
                <div className="text-sm" style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Market Impact:
                </div>
                <div className="text-sm text-muted">{trend.impact}</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}>
                  💡 Generate Ideas
                </button>
                <button 
                  className="secondary" 
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                >
                  📋 Add to Brief
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}