import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import mockTrends from '../mockTrends.js';

export default function TrendAssistant() {
  const router = useRouter();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('clients');
    if (stored) {
      setClients(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    // Load persisted trend data if available (runs after clients are loaded)
    if (clients.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const clientId = urlParams.get('clientId');
      if (clientId) {
        const storedTrends = localStorage.getItem(`trends_${clientId}`);
        const storedKeyword = localStorage.getItem(`keyword_${clientId}`);
        if (storedTrends) {
          setTrends(JSON.parse(storedTrends));
          setSelectedClient(clientId);
          if (storedKeyword) {
            setSelectedKeyword(storedKeyword);
          }
        }
      }
    }
  }, [clients]);

  useEffect(() => {
    // Reset keyword selection when client changes
    setSelectedKeyword('');
    if (selectedClient) {
      const client = clients.find(c => c.id == selectedClient);
      if (client && client.spheres) {
        const keywords = client.spheres.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (keywords.length > 0) {
          // If we have stored keyword, use it; otherwise use first one
          const storedKeyword = localStorage.getItem(`keyword_${selectedClient}`);
          setSelectedKeyword(storedKeyword && keywords.includes(storedKeyword) ? storedKeyword : keywords[0]);
        }
      }
    }
  }, [selectedClient, clients]);

  const findTrends = async () => {
    if (!selectedClient || !selectedKeyword) return;
    
    setLoading(true);
    setTrends([]);
    setError('');
    
    try {
      const client = clients.find(c => c.id == selectedClient);
      if (!client) {
        setError('Client not found. Please try selecting a different client.');
        setLoading(false);
        return;
      }
      
      console.log('Using keyword:', selectedKeyword);
      
      const countryMap = {
        'Australia': 'au',
        'UK': 'gb',
        'United States': 'us'
      };
      
      const outreachCountries = client.outreachLocations || [];
      if (outreachCountries.length === 0) {
        setError('No outreach locations found for this client. Please add locations in the client directory.');
        setLoading(false);
        return;
      }
      
      const country = countryMap[outreachCountries[0]] || 'us';
      console.log('Using country:', country);
      
      const API_KEY = "b747f4ded0bc7bd0eceffc4a073baae2";
      const url = "https://gnews.io/api/v4/search";
      
      const params = new URLSearchParams({
        q: selectedKeyword,
        lang: "en",
        country: country,
        max: 10,
        in: "title,description",
        sortby: "publishedAt",
        apikey: API_KEY
      });
      
      console.log('Fetching from GNews:', `${url}?${params}`);
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`GNews API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('GNews response:', data);
      
      if (data.articles && data.articles.length > 0) {
        console.log('Found', data.articles.length, 'articles, analyzing with AI...');
        // Analyze with GPT
        const analyzeResponse = await fetch('/api/analyze-trends', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articles: data.articles,
            keyword: selectedKeyword
          }),
        });
        
        if (!analyzeResponse.ok) {
          const errorData = await analyzeResponse.json();
          throw new Error(`Analysis API error: ${errorData.error || 'Unknown error'}`);
        }
        
        const analyzeData = await analyzeResponse.json();
        console.log('Analysis response:', analyzeData);
        
        if (analyzeData.trends && Array.isArray(analyzeData.trends)) {
          const processedTrends = analyzeData.trends.map((trend, index) => ({ ...trend, id: index + 1, category: 'News Analysis' }));
          setTrends(processedTrends);
          
          // Store trends, articles, and keyword for detail view
          localStorage.setItem(`trends_${selectedClient}`, JSON.stringify(processedTrends));
          localStorage.setItem(`articles_${selectedClient}`, JSON.stringify(data.articles));
          localStorage.setItem(`keyword_${selectedClient}`, selectedKeyword);
        } else {
          setError('No trends could be identified from the current news articles. Try again later or with a different client.');
        }
      } else {
        setError('No recent news articles found for this keyword and location. Try adjusting the client\'s spheres or outreach locations.');
      }
    } catch (error) {
      console.error('Error in findTrends:', error);
      setError(`Failed to analyze trends: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Trend Assistant</h1>
          <p className="text-muted">Discover emerging trends and market opportunities for your clients</p>
        </div>
      </div>

      {/* Controls Menu */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Select Client
            </label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', backgroundColor: 'white', width: '100%' }}
            >
              <option value="">Choose a client...</option>
              {clients.filter(c => c.status === 'active').map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Select Keyword
            </label>
            <select
              value={selectedKeyword}
              onChange={e => setSelectedKeyword(e.target.value)}
              disabled={!selectedClient}
              style={{ padding: '0.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', backgroundColor: 'white', width: '100%' }}
            >
              <option value="">Choose a keyword...</option>
              {selectedClient && clients.find(c => c.id == selectedClient)?.spheres?.split(',').map(k => k.trim()).filter(k => k.length > 0).map(keyword => (
                <option key={keyword} value={keyword}>{keyword}</option>
              ))}
            </select>
          </div>

          <div style={{ flexShrink: 0 }}>
            <div style={{ height: '1.5rem', marginBottom: '0.5rem' }}></div> {/* Spacer for alignment */}
            <button
              onClick={findTrends}
              disabled={loading || !selectedClient || !selectedKeyword}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                cursor: 'pointer',
                height: 'auto'
              }}
            >
              {loading ? '🔍 Analyzing...' : '📈 Find Latest Trends'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>Analyzing Market Trends</h3>
          <p className="text-muted">Fetching latest news articles and analyzing trends with AI...</p>
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

      {error && (
        <div className="card" style={{ padding: '1rem', backgroundColor: '#fee', borderColor: '#fcc' }}>
          <p style={{ color: '#c33', margin: 0 }}>{error}</p>
        </div>
      )}

      {trends.length === 0 && !loading && !error && (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
          <h3>Ready to Discover Trends</h3>
          <p className="text-muted">Select a client above to analyze current market opportunities and emerging patterns from news articles</p>
        </div>
      )}

      {trends.length > 0 && !loading && (
        <div className="grid grid-auto-fill">
          {trends.map(trend => (
            <div
              key={trend.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/trend-detail?trendId=${trend.id}&clientId=${selectedClient}`)}
            >
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
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

              <div style={{ 
                backgroundColor: 'var(--accent-color)', 
                padding: '1rem', 
                borderRadius: 'var(--border-radius)',
                marginBottom: '1rem'
              }}>
                <div className="text-sm" style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                  Relevance Score:
                </div>
                <div className="text-sm text-muted">{trend.relevanceScore}/10</div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    // Generate ideas functionality can be added here
                  }}
                >
                  💡 Generate Ideas
                </button>
                <button 
                  className="secondary" 
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    // Add to brief functionality can be added here
                  }}
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