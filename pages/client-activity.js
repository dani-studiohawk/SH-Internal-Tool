import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { secureStore } from '../lib/secure-storage';

export default function ClientActivity() {
  const [client, setClient] = useState(null);
  const [activity, setActivity] = useState({
    savedTrends: [],
    savedIdeas: [],
    savedPRs: []
  });
  const [activeTab, setActiveTab] = useState('trends');
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const { clientId } = router.query;
    if (clientId) {
      loadClientActivity(clientId);
    }
  }, [router.query]);

  const loadClientActivity = async (clientId) => {
    try {
      setLoading(true);
      
      // Load client info from API
      const clientResponse = await fetch(`/api/clients?id=${clientId}`);
      if (!clientResponse.ok) {
        throw new Error('Failed to fetch client');
      }
      
      const clients = await clientResponse.json();
      const clientInfo = clients.find(c => c.id == clientId);
      
      if (!clientInfo) {
        alert('Client not found');
        router.push('/client-directory');
        return;
      }

      // Load client activity from API
      const activityResponse = await fetch(`/api/client-activities?clientId=${clientId}`);
      if (!activityResponse.ok) {
        throw new Error('Failed to fetch client activities');
      }
      
      const activities = await activityResponse.json();
      
      // Organize activities by type
      const organizedActivity = {
        savedTrends: activities.filter(a => a.activityType === 'trend').map(transformActivityToOldFormat),
        savedIdeas: activities.filter(a => a.activityType === 'idea').map(transformActivityToOldFormat),
        savedPRs: activities.filter(a => a.activityType === 'pr').map(transformActivityToOldFormat)
      };
      
      setClient(clientInfo);
      setActivity(organizedActivity);
      setLoading(false);
    } catch (error) {
      console.error('Error loading client activity:', error);
      alert('Error loading client activity');
      router.push('/client-directory');
    }
  };

  // Transform database activity format to match the old localStorage format
  const transformActivityToOldFormat = (dbActivity) => {
    const content = dbActivity.content || {};
    return {
      id: dbActivity.id.toString(),
      title: dbActivity.title || content.headline || content.title,
      headline: content.headline || dbActivity.title,
      summary: content.summary || content.description || '',
      description: content.description || content.summary || '',
      content: content.content || content.draft || '',
      sources: content.sources || [],
      campaignType: content.campaignType || '',
      clientData: content.clientData || {},
      context: content.context || '',
      notes: dbActivity.notes || '',
      savedAt: dbActivity.createdAt,
      relevanceScore: content.relevanceScore || 7,
      clientId: dbActivity.clientId,
      clientName: dbActivity.clientName || client?.name
    };
  };

  const removeFromActivity = async (type, itemId) => {
    if (!confirm('Are you sure you want to remove this item from client activity?')) {
      return;
    }

    try {
      // Delete from database
      const response = await fetch('/api/client-activities', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: parseInt(itemId) })
      });

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }

      // Update local state
      const updatedActivity = { ...activity };
      
      if (type === 'trends') {
        updatedActivity.savedTrends = updatedActivity.savedTrends.filter(item => item.id !== itemId);
      } else if (type === 'ideas') {
        updatedActivity.savedIdeas = updatedActivity.savedIdeas.filter(item => item.id !== itemId);
      } else if (type === 'prs') {
        updatedActivity.savedPRs = updatedActivity.savedPRs.filter(item => item.id !== itemId);
      }

      setActivity(updatedActivity);
      alert('✅ Item removed from client activity');
    } catch (error) {
      console.error('Error removing from activity:', error);
      alert('❌ Error removing item. Please try again.');
    }
  };

  const useAgain = (type, item) => {
    if (type === 'trends') {
      // Store trend data securely and navigate to ideation assistant
      secureStore('trendData', item);
      router.push('/ideation-assistant');
    } else if (type === 'ideas') {
      // Navigate to PR writing assistant with idea data
      const storyData = {
        headline: item.headline,
        summary: item.summary,
        sources: item.sources || [],
        campaignType: item.campaignType,
        clientData: item.clientData,
        context: item.context
      };
      secureStore('storyData', storyData);
      router.push('/pr-writing-assistant');
    } else if (type === 'prs') {
      // Navigate to PR writing assistant with existing PR data for editing
      const storyData = {
        headline: item.headline,
        summary: item.summary,
        sources: item.sources || [],
        campaignType: item.campaignType,
        clientData: client, // Use current client data
        context: `Editing saved press release: ${item.headline}`,
        existingContent: item.content // Pass the existing content
      };
      secureStore('storyData', storyData);
      router.push('/pr-writing-assistant');
    }
  };

  const viewFullPR = (pr) => {
    // Create a modal-like display for the full PR content
    const modalContent = `
=== PRESS RELEASE ===

HEADLINE: ${pr.headline}

SUMMARY: ${pr.summary}

${pr.campaignType ? `CAMPAIGN TYPE: ${pr.campaignType}` : ''}

FULL CONTENT:
${pr.content}

${pr.sources && pr.sources.length > 0 ? `SOURCES: ${pr.sources.join(', ')}` : ''}

SAVED: ${formatDate(pr.savedAt)}
${pr.notes ? `NOTES: ${pr.notes}` : ''}
    `;
    
    // For now, use alert - could be enhanced with a proper modal later
    alert(modalContent);
  };

  const getTabCount = (tab) => {
    switch(tab) {
      case 'trends': return activity.savedTrends.length;
      case 'ideas': return activity.savedIdeas.length;
      case 'prs': return activity.savedPRs.length;
      default: return 0;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
        <h3>Loading client activity...</h3>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <h3>Client not found</h3>
        <button onClick={() => router.push('/client-directory')} style={{ marginTop: '1rem' }}>
          ← Back to Client Directory
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => router.push('/client-directory')} 
          style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ←
        </button>
        <div>
          <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>
            📋 {client.name} Activity
          </h1>
          <p className="text-muted" style={{ margin: '0.5rem 0' }}>
            {client.industry} • {client.spheres}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📊 Activity Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--border-radius)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {activity.savedTrends.length}
            </div>
            <div className="text-muted">Saved Trends</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--border-radius)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
              {activity.savedIdeas.length}
            </div>
            <div className="text-muted">Saved Ideas</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--border-radius)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
              {activity.savedPRs.length}
            </div>
            <div className="text-muted">Saved PRs</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          {[
            { key: 'trends', label: '📈 Trends', icon: '📈' },
            { key: 'ideas', label: '💡 Ideas', icon: '💡' },
            { key: 'prs', label: '📰 Press Releases', icon: '📰' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary-color)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--primary-color)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? '600' : '400'
              }}
            >
              {tab.label} ({getTabCount(tab.key)})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div>
            {activity.savedTrends.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                <h3 style={{ marginBottom: '1rem' }}>No Saved Trends</h3>
                <p className="text-muted" style={{ marginBottom: '2rem' }}>
                  Trends saved for this client will appear here.
                </p>
                <button onClick={() => router.push('/trend-assistant')}>
                  🔍 Analyze Trends
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {activity.savedTrends.map((trend) => (
                  <div key={trend.id} className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>
                          📊 {trend.title}
                        </h4>
                        <div style={{
                          backgroundColor: trend.relevanceScore >= 8 ? '#28a745' : 
                                         trend.relevanceScore >= 6 ? '#ffc107' : '#dc3545',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '15px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold'
                        }}>
                          {trend.relevanceScore}/10
                        </div>
                      </div>
                      <p style={{ margin: '0 0 1rem 0', lineHeight: '1.6' }}>
                        {trend.description}
                      </p>
                      {trend.notes && (
                        <div style={{ 
                          backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                          padding: '0.75rem', 
                          borderRadius: 'var(--border-radius)',
                          marginBottom: '1rem',
                          fontSize: '0.9rem'
                        }}>
                          <strong>Notes:</strong> {trend.notes}
                        </div>
                      )}
                      <div className="text-sm text-muted">
                        Saved: {formatDate(trend.savedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => useAgain('trends', trend)}
                        style={{ flex: 1, padding: '0.75rem' }}
                      >
                        💡 Generate Ideas
                      </button>
                      <button
                        onClick={() => removeFromActivity('trends', trend.id)}
                        className="secondary"
                        style={{ padding: '0.75rem 1rem', color: '#dc3545', borderColor: '#dc3545' }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ideas Tab */}
        {activeTab === 'ideas' && (
          <div>
            {activity.savedIdeas.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
                <h3 style={{ marginBottom: '1rem' }}>No Saved Ideas</h3>
                <p className="text-muted" style={{ marginBottom: '2rem' }}>
                  Ideas saved for this client will appear here.
                </p>
                <button onClick={() => router.push('/ideation-assistant')}>
                  💡 Generate Ideas
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {activity.savedIdeas.map((idea) => (
                  <div key={idea.id} className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>
                        💡 {idea.headline}
                      </h4>
                      <p style={{ margin: '0 0 1rem 0', lineHeight: '1.6' }}>
                        {idea.summary}
                      </p>
                      {idea.campaignType && (
                        <div style={{ 
                          backgroundColor: 'var(--accent-color)', 
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '15px',
                          fontSize: '0.85rem',
                          display: 'inline-block',
                          marginBottom: '1rem'
                        }}>
                          {idea.campaignType}
                        </div>
                      )}
                      {idea.notes && (
                        <div style={{ 
                          backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                          padding: '0.75rem', 
                          borderRadius: 'var(--border-radius)',
                          marginBottom: '1rem',
                          fontSize: '0.9rem'
                        }}>
                          <strong>Notes:</strong> {idea.notes}
                        </div>
                      )}
                      <div className="text-sm text-muted">
                        Saved: {formatDate(idea.savedAt)} • Context: {idea.context}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => useAgain('ideas', idea)}
                        style={{ flex: 1, padding: '0.75rem' }}
                      >
                        📝 Write PR
                      </button>
                      <button
                        onClick={() => removeFromActivity('ideas', idea.id)}
                        className="secondary"
                        style={{ padding: '0.75rem 1rem', color: '#dc3545', borderColor: '#dc3545' }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRs Tab */}
        {activeTab === 'prs' && (
          <div>
            {activity.savedPRs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
                <h3 style={{ marginBottom: '1rem' }}>No Saved Press Releases</h3>
                <p className="text-muted" style={{ marginBottom: '2rem' }}>
                  Press releases saved for this client will appear here.
                </p>
                <button onClick={() => router.push('/pr-writing-assistant')}>
                  📝 Write Press Release
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {activity.savedPRs.map((pr) => (
                  <div key={pr.id} className="card">
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>
                        📰 {pr.headline || pr.title}
                      </h4>
                      <p style={{ margin: '0 0 1rem 0', lineHeight: '1.6' }}>
                        {pr.summary || pr.description}
                      </p>
                      {pr.notes && (
                        <div style={{ 
                          backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                          padding: '0.75rem', 
                          borderRadius: 'var(--border-radius)',
                          marginBottom: '1rem',
                          fontSize: '0.9rem'
                        }}>
                          <strong>Notes:</strong> {pr.notes}
                        </div>
                      )}
                      <div className="text-sm text-muted">
                        Saved: {formatDate(pr.savedAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => viewFullPR(pr)}
                        style={{ padding: '0.75rem 1rem' }}
                      >
                        👁️ Open
                      </button>
                      <button
                        onClick={() => useAgain('prs', pr)}
                        className="secondary"
                        style={{ padding: '0.75rem 1rem' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => removeFromActivity('prs', pr.id)}
                        className="secondary"
                        style={{ padding: '0.75rem 1rem', color: '#dc3545', borderColor: '#dc3545' }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}