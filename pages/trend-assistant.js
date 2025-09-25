import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TrendAssistant() {
  const [keyword, setKeyword] = useState('');
  const [articles, setArticles] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('au'); // Default to Australia
  const [step, setStep] = useState('input'); // 'input', 'fetching', 'analysis', 'results'

  const locations = [
    { code: 'au', name: 'Australia', flag: '🇦🇺' },
    { code: 'us', name: 'United States', flag: '🇺🇸' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' }
  ];

  const router = useRouter();

  useEffect(() => {
    // Load clients for optional client association
    const stored = localStorage.getItem('clients');
    if (stored) {
      setClients(JSON.parse(stored));
    }

    // Check if coming from a specific client context
    const { clientId, showResults } = router.query;
    if (clientId) {
      setSelectedClient(clientId);
    }

    // If coming back from trend detail, restore the results
    if (showResults === 'true' && clientId) {
      const storedTrends = localStorage.getItem(`trends_${clientId}`);
      const storedArticles = localStorage.getItem(`articles_${clientId}`);
      const storedKeyword = localStorage.getItem(`keyword_${clientId}`);

      if (storedTrends && storedArticles && storedKeyword) {
        setTrends(JSON.parse(storedTrends));
        setArticles(JSON.parse(storedArticles));
        setKeyword(storedKeyword);
        setStep('results');
      }
    }
  }, [router.query]);

  const analyzeTrends = async () => {
    if (!keyword.trim()) {
      alert('Please enter a keyword to analyze trends for!');
      return;
    }

    setFetchingNews(true);
    setStep('fetching');

    try {
      // Step 1: Fetch real news articles
      console.log('Fetching news articles for:', keyword.trim(), 'in', selectedLocation);
      const newsResponse = await fetch('/api/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword: keyword.trim(),
          country: selectedLocation 
        })
      });

      if (!newsResponse.ok) {
        throw new Error(`Failed to fetch news: ${newsResponse.status}`);
      }

      const newsData = await newsResponse.json();
      const articlesToAnalyze = newsData.articles;
      
      if (!articlesToAnalyze || articlesToAnalyze.length === 0) {
        throw new Error('No articles found for this keyword. Try a different search term.');
      }

      setArticles(articlesToAnalyze);
      setFetchingNews(false);
      setLoading(true);
      setStep('analysis');

      // Step 2: Analyze trends from the fetched articles
      console.log(`Analyzing ${articlesToAnalyze.length} articles for trends...`);
      const trendsResponse = await fetch('/api/analyze-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          articles: articlesToAnalyze,
          keyword: keyword.trim()
        })
      });

      if (!trendsResponse.ok) {
        throw new Error(`Trend analysis failed: ${trendsResponse.status}`);
      }

      const trendsData = await trendsResponse.json();
      
      // Add IDs and additional metadata to trends
      const trendsWithMetadata = trendsData.trends.map((trend, index) => ({
        ...trend,
        id: Date.now() + index,
        clientId: selectedClient || 'custom',
        keyword: keyword.trim(),
        analyzedAt: new Date().toISOString(),
        articleCount: articlesToAnalyze.length
      }));

      setTrends(trendsWithMetadata);
      setStep('results');

      // Store for trend detail page
      const clientKey = selectedClient || 'custom';
      localStorage.setItem(`trends_${clientKey}`, JSON.stringify(trendsWithMetadata));
      localStorage.setItem(`articles_${clientKey}`, JSON.stringify(articlesToAnalyze));
      localStorage.setItem(`keyword_${clientKey}`, keyword.trim());

    } catch (error) {
      console.error('Error analyzing trends:', error);
      alert(`Failed to analyze trends: ${error.message}`);
      setStep('input');
    }
    
    setLoading(false);
    setFetchingNews(false);
  };

  const generateIdeasFromTrend = (trend) => {
    // Store trend data for ideation assistant
    localStorage.setItem('trendData', JSON.stringify(trend));
    // Navigate to ideation assistant
    router.push('/ideation-assistant');
  };

  const viewTrendDetails = (trend) => {
    const clientKey = selectedClient || 'custom';
    // Store current state so we can return to results
    router.push(`/trend-detail?trendId=${trend.id}&clientId=${clientKey}&returnToResults=true`);
  };

  const saveToClientActivity = (item, type) => {
    if (clients.length === 0) {
      alert('No clients available. Please add clients first.');
      return;
    }

    // Create a modal-like prompt for client selection
    const clientOptions = clients.map(c => `${c.id}: ${c.name} - ${c.industry}`).join('\n');
    const selectedClientId = prompt(
      `Save this ${type} to which client?\n\n${clientOptions}\n\nEnter client ID:`,
      selectedClient || clients[0]?.id
    );

    if (!selectedClientId) return; // User cancelled

    const client = clients.find(c => c.id == selectedClientId);
    if (!client) {
      alert('Invalid client ID selected.');
      return;
    }

    // Add optional notes
    const notes = prompt(`Add notes for this ${type} (optional):`, '');

    try {
      // Get existing client activity
      const existingActivity = JSON.parse(localStorage.getItem(`client_${selectedClientId}_activity`) || '{}');
      
      // Initialize arrays if they don't exist
      if (!existingActivity.savedTrends) existingActivity.savedTrends = [];
      if (!existingActivity.savedIdeas) existingActivity.savedIdeas = [];
      if (!existingActivity.savedPRs) existingActivity.savedPRs = [];

      // Add the item to appropriate array
      const savedItem = {
        ...item,
        savedAt: new Date().toISOString(),
        notes: notes || '',
        clientId: selectedClientId,
        clientName: client.name
      };

      if (type === 'trend') {
        existingActivity.savedTrends.unshift(savedItem); // Add to beginning
      } else if (type === 'idea') {
        existingActivity.savedIdeas.unshift(savedItem);
      } else if (type === 'pr') {
        existingActivity.savedPRs.unshift(savedItem);
      }

      // Save back to localStorage
      localStorage.setItem(`client_${selectedClientId}_activity`, JSON.stringify(existingActivity));

      alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} saved to ${client.name}'s activity!${notes ? `\n\nNotes: ${notes}` : ''}`);
    } catch (error) {
      console.error('Error saving to client activity:', error);
      alert('❌ Error saving to client activity. Please try again.');
    }
  };

  const startOver = () => {
    setKeyword('');
    setArticles([]);
    setTrends([]);
    setFetchingNews(false);
    setLoading(false);
    setStep('input');
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>🔍 Trend Assistant</h1>
          <p className="text-muted">Analyze market trends from news articles to identify opportunities</p>
        </div>
        {step === 'results' && (
          <button onClick={startOver} className="secondary">
            🔄 Start New Analysis
          </button>
        )}
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>🎯 What trends would you like to analyze?</h3>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Enter a keyword or topic to analyze current market trends from recent news articles.
          </p>

          {/* Client Selection */}
          {clients.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Associate with Client (Optional)
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
                <option value="">No specific client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.industry}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              News Source Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white',
                fontSize: '1rem'
              }}
            >
              {locations.map(location => (
                <option key={location.code} value={location.code}>
                  {location.flag} {location.name}
                </option>
              ))}
            </select>
            <small className="text-muted" style={{ display: 'block', marginTop: '0.5rem' }}>
              Select the region to source news articles from for trend analysis
            </small>
          </div>

          {/* Keyword Input */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Trend Analysis Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., AI marketing, sustainable fashion, remote work..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                fontSize: '1rem'
              }}
              onKeyPress={(e) => e.key === 'Enter' && analyzeTrends()}
            />
            <div className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
              💡 Tip: Use specific keywords for better trend analysis (e.g., "AI in healthcare" vs "technology")
            </div>
          </div>

          {/* News Source Info */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              backgroundColor: 'var(--secondary-color)', 
              padding: '1rem', 
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📰</span>
                <strong>Real-Time News Analysis</strong>
              </div>
              <p className="text-sm text-muted" style={{ margin: 0 }}>
                We'll fetch the latest news articles related to your keyword from GNews API and analyze them for emerging trends.
              </p>
            </div>
          </div>

          <button
            onClick={analyzeTrends}
            disabled={loading || fetchingNews || !keyword.trim()}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: '500',
              backgroundColor: (loading || fetchingNews) ? 'var(--border-color)' : 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              cursor: (loading || fetchingNews) ? 'not-allowed' : 'pointer'
            }}
          >
            {fetchingNews ? '📰 Fetching News...' : loading ? '🔍 Analyzing Trends...' : '🚀 Fetch News & Analyze Trends'}
          </button>
        </div>
      )}

      {/* Step 2: Fetching News */}
      {step === 'fetching' && fetchingNews && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
          <h3 style={{ marginBottom: '1rem' }}>Fetching Latest News</h3>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Searching for the most recent articles about "{keyword}" from news sources worldwide...
          </p>
          <div style={{ 
            width: '200px', 
            height: '4px', 
            backgroundColor: 'var(--border-color)',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              backgroundColor: 'var(--primary-color)',
              borderRadius: '2px',
              animation: 'pulse 2s infinite'
            }}></div>
          </div>
        </div>
      )}

      {/* Step 3: Analysis in Progress */}
      {step === 'analysis' && loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
          <h3 style={{ marginBottom: '1rem' }}>Analyzing Market Trends</h3>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            Our AI is analyzing {articles.length} fresh articles to identify emerging trends related to "{keyword}"...
          </p>
          <div style={{ 
            width: '200px', 
            height: '4px', 
            backgroundColor: 'var(--border-color)',
            borderRadius: '2px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '50%',
              height: '100%',
              backgroundColor: 'var(--accent-color)',
              borderRadius: '2px',
              animation: 'pulse 2s infinite'
            }}></div>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'results' && trends.length > 0 && (
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>📈 Identified Trends</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Found {trends.length} emerging trends from {articles.length} real-time news articles related to "{keyword}"
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-muted)',
                backgroundColor: 'var(--secondary-color)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--border-radius)'
              }}>
                📰 Powered by GNews API
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                color: '#28a745',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--border-radius)'
              }}>
                💾 Results saved - you can view multiple trend details
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '2rem' }}>
            {trends.map((trend) => (
              <div key={trend.id} className="card" style={{ 
                border: '1px solid var(--border-color)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--primary-color)', flex: 1 }}>
                      📊 {trend.title}
                    </h4>
                    <div style={{
                      backgroundColor: trend.relevanceScore >= 8 ? '#28a745' : 
                                     trend.relevanceScore >= 6 ? '#ffc107' : '#dc3545',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '15px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      marginLeft: '1rem'
                    }}>
                      {trend.relevanceScore}/10
                    </div>
                  </div>
                  
                  <p style={{ margin: '0 0 1rem 0', lineHeight: '1.6' }}>
                    {trend.description}
                  </p>

                  <div style={{ 
                    backgroundColor: 'rgba(0, 201, 255, 0.1)', 
                    padding: '1rem', 
                    borderRadius: 'var(--border-radius)',
                    marginBottom: '1rem'
                  }}>
                    <strong style={{ color: 'var(--primary-color)' }}>Market Impact:</strong>
                    <div style={{ marginTop: '0.5rem' }}>{trend.impact}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => generateIdeasFromTrend(trend)}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    💡 Generate Ideas
                  </button>
                  <button
                    onClick={() => viewTrendDetails(trend)}
                    className="secondary"
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--border-radius)',
                      cursor: 'pointer'
                    }}
                  >
                    📋 View Details
                  </button>
                  {clients.length > 0 && (
                    <button
                      onClick={() => saveToClientActivity(trend, 'trend')}
                      className="secondary"
                      style={{
                        flex: 1,
                        minWidth: '140px',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--border-radius)',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderColor: '#28a745',
                        color: '#28a745'
                      }}
                    >
                      💾 Save to Client
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {step === 'results' && trends.length === 0 && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤔</div>
          <h3 style={{ marginBottom: '1rem' }}>No Trends Found</h3>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>
            We couldn't identify any clear trends from the articles for "{keyword}". 
            Try a different keyword or check back later for more articles.
          </p>
          <button onClick={startOver} style={{ padding: '0.75rem 1.5rem' }}>
            🔄 Try Different Keyword
          </button>
        </div>
      )}
    </div>
  );
}
