import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SavedTrends() {
  const [savedTrends, setSavedTrends] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadClients();
    loadSavedTrends();
  }, []);

  useEffect(() => {
    // Check if coming from a specific client context
    const { clientId } = router.query;
    if (clientId && clientId !== 'all') {
      setSelectedClientId(clientId);
    }
  }, [router.query]);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('clients');
        if (stored) {
          setClients(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('clients');
      if (stored) {
        setClients(JSON.parse(stored));
      }
    }
  };

  const loadSavedTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/saved-trends');
      if (!response.ok) {
        throw new Error('Failed to load saved trends');
      }
      const trends = await response.json();
      setSavedTrends(trends);
    } catch (error) {
      console.error('Error loading saved trends:', error);
      setError('Failed to load saved trends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter trends based on selected client
  const filteredTrends = selectedClientId === 'all' 
    ? savedTrends 
    : savedTrends.filter(trend => {
        const trendClientId = trend.client_id || trend.clientId;
        if (!trendClientId) return selectedClientId === 'no-client';
        return trendClientId == selectedClientId;
      });

  const deleteTrend = async (trendId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved trend?')) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-trends?id=${trendId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete trend');
      }
      
      // Update local state
      const updatedTrends = savedTrends.filter(trend => trend.id !== trendId);
      setSavedTrends(updatedTrends);
    } catch (error) {
      console.error('Error deleting trend:', error);
      alert('Failed to delete trend. Please try again.');
    }
  };

  const useForIdeas = (trend) => {
    // Store trend data for ideation assistant
    const trendData = trend.source_type === 'client_activity' 
      ? trend.trend_data 
      : trend.trend_data;
    localStorage.setItem('trendData', JSON.stringify(trendData));
    // Navigate to ideation assistant
    router.push('/ideation-assistant');
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Saved Trends</h1>
          <p className="text-muted">Browse and use your saved trend analyses</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {selectedClientId !== 'all' && selectedClientId !== 'no-client' && clients.find(c => c.id == selectedClientId) && (
            <button 
              onClick={() => router.push(`/client-directory`)} 
              className="secondary"
              style={{ fontSize: '0.875rem' }}
            >
              👥 Back to Clients
            </button>
          )}
          <button onClick={() => router.push('/trend-assistant')} className="secondary">
            ← Back to Trend Assistant
          </button>
        </div>
      </div>

      {/* Client Filter */}
      {clients.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label htmlFor="client-filter" style={{ fontWeight: '500' }}>
              Filter by Client:
            </label>
            <select
              id="client-filter"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{ 
                padding: '0.5rem',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                minWidth: '200px'
              }}
            >
              <option value="all">All Trends ({savedTrends.length})</option>
              <option value="no-client">No Client Assigned ({savedTrends.filter(trend => !trend.client_id && !trend.clientId).length})</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({savedTrends.filter(trend => (trend.client_id || trend.clientId) == client.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h3>Loading Saved Trends...</h3>
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3>Error Loading Trends</h3>
          <p className="text-muted">{error}</p>
          <button 
            onClick={loadSavedTrends} 
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      ) : filteredTrends.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3>
            {selectedClientId === 'all' 
              ? 'No Saved Trends Yet' 
              : selectedClientId === 'no-client'
              ? 'No Trends Without Client Assignment'
              : `No Trends for ${clients.find(c => c.id == selectedClientId)?.name || 'This Client'}`
            }
          </h3>
          <p className="text-muted">
            {selectedClientId === 'all' 
              ? 'Save trends from the Trend Assistant to access them here.'
              : 'Try selecting a different client or analyze new trends.'
            }
            <br />
            <button
              onClick={() => router.push('/trend-assistant')}
              style={{ marginTop: '1rem' }}
            >
              Go to Trend Assistant →
            </button>
          </p>
        </div>
      ) : (
        <>
          <div className="flex-between mb-4">
            <span className="text-muted">
              {filteredTrends.length} 
              {selectedClientId === 'all' 
                ? ' saved trends' 
                : selectedClientId === 'no-client'
                ? ' trends without client assignment'
                : ` trends for ${clients.find(c => c.id == selectedClientId)?.name || 'this client'}`
              }
            </span>
          </div>

          <div className="grid grid-auto-fill">
            {filteredTrends.map(trend => (
              <div
                key={trend.id}
                className="card"
                style={{ cursor: 'pointer' }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ color: 'var(--primary-color)', margin: 0 }}>
                      {trend.title}
                    </h3>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        backgroundColor: trend.source_type === 'client_activity' ? 'var(--accent-color)' : 'var(--secondary-color)',
                        color: 'var(--text-color)'
                      }}
                    >
                      {trend.source_type === 'client_activity' ? '📋 Activity' : '📌 Saved'}
                    </span>
                  </div>
                  {trend.description && (
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>
                      {trend.description.length > 150 
                        ? trend.description.substring(0, 150) + '...' 
                        : trend.description}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  {trend.client_name && (
                    <div className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                      Client: {trend.client_name} ({trend.client_industry})
                    </div>
                  )}
                  {trend.trend_data?.keyword && (
                    <div className="text-sm" style={{ marginBottom: '0.5rem' }}>
                      <strong>Keyword:</strong> {trend.trend_data.keyword}
                    </div>
                  )}
                  {trend.trend_data?.relevanceScore && (
                    <div className="text-sm" style={{ marginBottom: '0.5rem' }}>
                      <strong>Relevance Score:</strong> {trend.trend_data.relevanceScore}/10
                    </div>
                  )}
                  {trend.source_type === 'client_activity' && trend.trend_data?.category && (
                    <div className="text-sm" style={{ marginBottom: '0.5rem' }}>
                      <strong>Category:</strong> {trend.trend_data.category}
                    </div>
                  )}
                  <div className="text-sm text-muted">
                    {trend.source_type === 'client_activity' ? 'Added to Activity' : 'Saved'}: {new Date(trend.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    onClick={() => useForIdeas(trend)}
                  >
                    💡 Generate Ideas
                  </button>
                  <button
                    onClick={(e) => deleteTrend(trend.id, e)}
                    className="secondary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    🗑️ Delete
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