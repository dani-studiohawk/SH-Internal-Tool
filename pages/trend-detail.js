import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function TrendDetail() {
  const router = useRouter();
  const { trendId, clientId } = router.query;
  const [trend, setTrend] = useState(null);
  const [articles, setArticles] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trendId && clientId) {
      // Load trend data from localStorage or API
      const storedTrends = localStorage.getItem(`trends_${clientId}`);
      const storedArticles = localStorage.getItem(`articles_${clientId}`);
      const storedKeyword = localStorage.getItem(`keyword_${clientId}`);

      if (storedTrends && storedArticles) {
        const trends = JSON.parse(storedTrends);
        const articlesData = JSON.parse(storedArticles);

        const foundTrend = trends.find(t => t.id == trendId);
        if (foundTrend) {
          setTrend(foundTrend);
          setArticles(articlesData);
          setKeyword(storedKeyword || '');
        }
      }
      setLoading(false);
    }
  }, [trendId, clientId]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
        <h3>Loading trend details...</h3>
      </div>
    );
  }

  if (!trend) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <h3>Trend not found</h3>
        <p>The requested trend could not be found.</p>
        <button onClick={() => router.back()} style={{ marginTop: '1rem' }}>
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => {
            // Navigate back to trend assistant with preserved results
            router.push(`/trend-assistant?clientId=${clientId}&showResults=true`);
          }} 
          style={{ fontSize: '1.5rem' }}
        >←</button>
        <div>
          <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>{trend.title}</h1>
          <p className="text-muted" style={{ margin: '0.5rem 0' }}>{trend.category}</p>
          {keyword && (
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Analyzed using keyword: <strong>"{keyword}"</strong>
            </p>
          )}
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="card" style={{ marginBottom: '3rem' }}>
        <h2>Trend Analysis</h2>
        <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>{trend.description}</p>

        <div style={{
          backgroundColor: 'var(--secondary-color)',
          padding: '1.5rem',
          borderRadius: 'var(--border-radius)',
          marginBottom: '1rem'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            Market Impact
          </div>
          <div>{trend.impact}</div>
        </div>

        <div style={{
          backgroundColor: 'var(--accent-color)',
          padding: '1.5rem',
          borderRadius: 'var(--border-radius)',
          marginBottom: '1rem'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            Relevance Score
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{trend.relevanceScore}/10</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <button 
          onClick={() => {
            // Store trend data for ideation assistant
            localStorage.setItem('trendData', JSON.stringify(trend));
            // Navigate to ideation assistant
            router.push('/ideation-assistant');
          }}
          style={{ flex: 1, padding: '1rem' }}
        >
          💡 Generate Ideas
        </button>
        <button 
          className="secondary" 
          onClick={() => {
            // Store trend for PR writing assistant
            const briefData = {
              trendTitle: trend.title,
              trendDescription: trend.description,
              trendImpact: trend.impact,
              relevanceScore: trend.relevanceScore,
              keyword: keyword || '',
              addedAt: new Date().toISOString()
            };
            
            // Add to existing brief data or create new
            const existingBrief = localStorage.getItem('briefData');
            let briefContent = existingBrief ? JSON.parse(existingBrief) : {};
            
            briefContent.trendContext = briefData;
            localStorage.setItem('briefData', JSON.stringify(briefContent));
            
            alert(`✅ Trend added to brief!\n\n"${trend.title}"\n\nYou can access it in the PR Writing Assistant.`);
          }}
          style={{ flex: 1, padding: '1rem' }}
        >
          📋 Add to Brief
        </button>
      </div>

      {/* Source Articles */}
      <div className="card">
        <h2>Source Articles</h2>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Articles analyzed to identify this trend:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {articles.map((article, index) => (
            <div key={index} style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              padding: '1.5rem',
              backgroundColor: 'var(--background-color)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {article.title}
                </a>
              </h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {article.description}
              </p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {new Date(article.publishedAt).toLocaleDateString()} • {article.source?.name || 'Unknown Source'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}