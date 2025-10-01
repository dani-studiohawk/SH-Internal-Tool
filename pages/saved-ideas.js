import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { secureStore, secureRetrieve, migrateFromLocalStorage } from '../lib/secure-storage';

export default function SavedIdeas() {
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadClients();
    loadSavedIdeas();
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
        // Fallback to secure storage, migrating from localStorage if needed
        let stored = secureRetrieve('clients');
        if (!stored) {
          stored = migrateFromLocalStorage('clients');
        }
        if (stored) {
          setClients(stored);
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      // Fallback to secure storage, migrating from localStorage if needed
      let stored = secureRetrieve('clients');
      if (!stored) {
        stored = migrateFromLocalStorage('clients');
      }
      if (stored) {
        setClients(stored);
      }
    }
  };

  const loadSavedIdeas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/saved-ideas');
      if (!response.ok) {
        throw new Error('Failed to load saved ideas');
      }
      const ideas = await response.json();
      setSavedIdeas(ideas);
    } catch (error) {
      console.error('Error loading saved ideas:', error);
      setError('Failed to load saved ideas. Please try again.');
      // Fallback to secure storage for backward compatibility, migrating from localStorage if needed
      let saved = secureRetrieve('savedIdeas');
      if (!saved) {
        saved = migrateFromLocalStorage('savedIdeas');
      }
      if (saved) {
        setSavedIdeas(saved);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter ideas based on selected client
  const filteredIdeas = selectedClientId === 'all' 
    ? savedIdeas 
    : savedIdeas.filter(idea => {
        if (!idea.clientData) return selectedClientId === 'no-client';
        return idea.clientData.id == selectedClientId;
      });

  const selectIdea = (idea) => {
    // Store the selected idea data securely
    secureStore('storyData', idea);
    // Navigate back to PR Writing Assistant
    router.push('/pr-writing-assistant');
  };

  const deleteIdea = async (ideaId, e) => {
    e.stopPropagation(); // Prevent triggering selectIdea
    try {
      const response = await fetch(`/api/saved-ideas?id=${ideaId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete idea');
      }
      
      // Update local state
      const updatedIdeas = savedIdeas.filter(idea => idea.id !== ideaId);
      setSavedIdeas(updatedIdeas);
      
      // Also update secure storage for backward compatibility
      secureStore('savedIdeas', updatedIdeas);
    } catch (error) {
      console.error('Error deleting idea:', error);
      alert('Failed to delete idea. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Saved Ideas</h1>
          <p className="text-muted">Browse and select from your saved ideas</p>
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
          <button onClick={() => router.push('/pr-writing-assistant')} className="secondary">
            ← Back to PR Writer
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
              <option value="all">All Ideas ({savedIdeas.length})</option>
              <option value="no-client">No Client Assigned ({savedIdeas.filter(idea => !idea.clientData).length})</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({savedIdeas.filter(idea => idea.clientData?.id == client.id).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h3>Loading Saved Ideas...</h3>
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3>Error Loading Ideas</h3>
          <p className="text-muted">{error}</p>
          <button 
            onClick={loadSavedIdeas} 
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
          <h3>
            {selectedClientId === 'all' 
              ? 'No Saved Ideas Yet' 
              : selectedClientId === 'no-client'
              ? 'No Ideas Without Client Assignment'
              : `No Ideas for ${clients.find(c => c.id == selectedClientId)?.name || 'This Client'}`
            }
          </h3>
          <p className="text-muted">
            {selectedClientId === 'all' 
              ? 'Save ideas from the Ideation Assistant to access them here.'
              : 'Try selecting a different client or create new ideas.'
            }
            <br />
            <button
              onClick={() => router.push('/ideation-assistant')}
              style={{ marginTop: '1rem' }}
            >
              Go to Ideation Assistant →
            </button>
          </p>
        </div>
      ) : (
        <>
          <div className="flex-between mb-4">
            <span className="text-muted">
              {filteredIdeas.length} 
              {selectedClientId === 'all' 
                ? ' saved ideas' 
                : selectedClientId === 'no-client'
                ? ' ideas without client assignment'
                : ` ideas for ${clients.find(c => c.id == selectedClientId)?.name || 'this client'}`
              }
            </span>
          </div>

          <div className="grid grid-auto-fill">
            {filteredIdeas.map(idea => (
              <div
                key={idea.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => selectIdea(idea)}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                    {idea.headline}
                  </h3>
                  <p className="text-muted" style={{ marginBottom: '1rem' }}>
                    {idea.summary}
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div className="text-sm" style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                    Campaign Type: {idea.campaignType}
                  </div>
                  {idea.clientData && (
                    <div className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                      Client: {idea.clientData.name} ({idea.clientData.industry})
                    </div>
                  )}
                  {idea.sources && idea.sources.length > 0 && (
                    <div className="text-sm" style={{ marginBottom: '0.5rem' }}>
                      <strong>Data Sources:</strong> {idea.sources.length} available
                    </div>
                  )}
                  <div className="text-sm text-muted">
                    Saved: {new Date(idea.savedAt).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    onClick={() => selectIdea(idea)}
                  >
                    📝 Use This Idea
                  </button>
                  <button
                    onClick={(e) => deleteIdea(idea.id, e)}
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