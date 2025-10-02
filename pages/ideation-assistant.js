import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { secureRetrieve, secureRemove, migrateFromLocalStorage } from '../lib/secure-storage';

export default function IdeationAssistant() {
  const [selectionMode, setSelectionMode] = useState('brief'); // 'client', 'topic', 'brief', 'trend'
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [campaignBrief, setCampaignBrief] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [editingTrend, setEditingTrend] = useState(false);
  const [editedTrend, setEditedTrend] = useState({});

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
    // Load clients with migration from localStorage if needed
    let stored = secureRetrieve('clients');
    if (!stored) {
      stored = migrateFromLocalStorage('clients');
    }
    if (stored) {
      setClients(stored);
    }

    // Check for trend data from Trend Assistant
    const trendData = secureRetrieve('trendData');
    if (trendData) {
      setSelectionMode('trend');
      setSelectedTrend(trendData);
      secureRemove('trendData'); // Clear it after loading
    }
  }, []);

  const startEditingTrend = () => {
    setEditingTrend(true);
    setEditedTrend({
      title: selectedTrend.title || '',
      description: selectedTrend.description || '',
      impact: selectedTrend.impact || '',
      category: selectedTrend.category || '',
      relevanceScore: selectedTrend.relevanceScore || 0
    });
  };

  const saveEditedTrend = () => {
    const updatedTrend = {
      ...selectedTrend,
      ...editedTrend
    };
    setSelectedTrend(updatedTrend);
    setEditingTrend(false);
    setEditedTrend({});
  };

  const cancelEditingTrend = () => {
    setEditingTrend(false);
    setEditedTrend({});
  };

  const generateIdeas = async () => {
    let context = '';
    if (selectionMode === 'client' && selectedClient) {
      const client = clients.find(c => c.id == selectedClient);
      context = `Client: ${client.name}, Industry: ${client.industry}, Spheres: ${client.spheres}`;
    } else if (selectionMode === 'topic' && selectedTopic) {
      context = `Topic: ${selectedTopic}`;
    } else if (selectionMode === 'brief' && campaignBrief) {
      context = `Campaign Brief: ${campaignBrief}`;
    } else if (selectionMode === 'trend' && selectedTrend) {
      context = `Trend: ${selectedTrend.title}, Description: ${selectedTrend.description}, Impact: ${selectedTrend.impact}`;
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
    } else if (selectionMode === 'trend' && selectedTrend && selectedTrend.clientId && selectedTrend.clientId !== "custom") {
      clientData = clients.find(c => c.id == selectedTrend.clientId);
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
               selectionMode === 'brief' ? `Brief: ${campaignBrief}` :
               selectionMode === 'trend' ? `Trend: ${selectedTrend.title}` : ''
    };

    // Navigate to PR writing assistant with story data in URL params
    router.push(`/pr-writing-assistant?storyData=${encodeURIComponent(JSON.stringify(storyData))}`);
  };

  const saveIdea = async (ideaTitle, ideaSummary, ideaSources) => {
    console.log('Save Idea clicked:', { ideaTitle, ideaSummary, ideaSources });
    try {
      // Get client data if selected
      let clientData = null;
      if (selectionMode === 'client' && selectedClient) {
        clientData = clients.find(c => c.id == selectedClient);
      } else if (selectionMode === 'trend' && selectedTrend && selectedTrend.clientId && selectedTrend.clientId !== "custom") {
        clientData = clients.find(c => c.id == selectedTrend.clientId);
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
                 selectionMode === 'brief' ? `Brief: ${campaignBrief}` :
                 selectionMode === 'trend' ? `Trend: ${selectedTrend.title}` : ''
      };

      // Save to database
      const response = await fetch('/api/saved-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ideaData)
      });

      if (!response.ok) {
        throw new Error('Failed to save idea to database');
      }

      const savedIdea = await response.json();

      // Show success message
      alert(`✅ Idea saved successfully!\n\n"${ideaTitle}"\n\nYou can access it later in the PR Writing Assistant under "Saved Ideas".`);
    } catch (error) {
      console.error('Error saving idea:', error);
      
      // No localStorage fallback for security reasons
      alert(`⚠️ Unable to save idea - database unavailable. Please try again later.`);
    }
  };

  const saveToClientActivity = async (ideaTitle, ideaSummary, ideaSources, type = 'idea') => {
    if (clients.length === 0) {
      alert('No clients available. Please add clients first.');
      return;
    }

    // Determine client context
    let contextClientId = null;
    if (selectionMode === 'client' && selectedClient) {
      contextClientId = selectedClient;
    } else if (selectionMode === 'trend' && selectedTrend && selectedTrend.clientId && selectedTrend.clientId !== "custom") {
      contextClientId = selectedTrend.clientId;
    }

    // Create client selection prompt
    const clientOptions = clients.map(c => `${c.id}: ${c.name} - ${c.industry}`).join('\n');
    const selectedClientId = prompt(
      `Save this ${type} to which client?\n\n${clientOptions}\n\nEnter client ID:`,
      contextClientId || clients[0]?.id
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
      // Get client data if selected
      let clientData = client;

      // Prepare data to save
      const activityData = {
        clientId: parseInt(selectedClientId),
        activityType: 'idea',
        title: ideaTitle,
        content: {
          headline: ideaTitle,
          summary: ideaSummary,
          sources: ideaSources || [],
          campaignType,
          clientData,
          context: selectionMode === 'client' ? `Client: ${clientData?.name}` : 
                   selectionMode === 'topic' ? `Topic: ${selectedTopic}` : 
                   selectionMode === 'brief' ? `Brief: ${campaignBrief}` :
                   selectionMode === 'trend' ? `Trend: ${selectedTrend.title}` : '',
          clientId: selectedClientId,
          clientName: client.name
        },
        notes: notes || ''
      };

      // Save to database via API
      const response = await fetch('/api/client-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      });

      if (!response.ok) {
        throw new Error('Failed to save to client activity');
      }

      const savedActivity = await response.json();
      alert(`✅ Idea saved to ${client.name}'s activity!\n\n"${ideaTitle}"${notes ? `\n\nNotes: ${notes}` : ''}`);
    } catch (error) {
      console.error('Error saving to client activity:', error);
      alert('❌ Error saving to client activity. Please try again.');
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

          {/* Trend Card */}
          <div
            className={`card ${selectionMode === 'trend' ? 'selected' : ''}`}
            style={{
              cursor: 'pointer',
              border: selectionMode === 'trend' ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
              backgroundColor: selectionMode === 'trend' ? 'rgba(0, 201, 255, 0.05)' : 'var(--secondary-color)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setSelectionMode('trend')}
          >
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Start with a Trend</h4>
              <p className="text-sm text-muted">
                Generate ideas based on a market trend from Trend Assistant
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

          {selectionMode === 'trend' && selectedTrend && (
            <div>
              <div style={{
                marginTop: '1rem',
                padding: '1.5rem',
                backgroundColor: 'var(--secondary-color)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)'
              }}>
                {!editingTrend ? (
                  // Display Mode
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)' }}>
                          📈 {selectedTrend.title}
                        </h4>
                        {selectedTrend.category && (
                          <span style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--accent-color)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px'
                          }}>
                            {selectedTrend.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={startEditingTrend}
                        className="secondary"
                        style={{ 
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        ✏️ Edit Trend
                      </button>
                    </div>
                    
                    <div style={{ lineHeight: '1.6' }}>
                      <p style={{ margin: '0 0 1rem 0' }}>{selectedTrend.description}</p>
                      
                      <div style={{ 
                        backgroundColor: 'rgba(0, 201, 255, 0.1)', 
                        padding: '1rem', 
                        borderRadius: 'var(--border-radius)',
                        marginBottom: '1rem'
                      }}>
                        <strong style={{ color: 'var(--primary-color)' }}>Market Impact:</strong>
                        <div style={{ marginTop: '0.5rem' }}>{selectedTrend.impact}</div>
                      </div>
                      
                      {selectedTrend.relevanceScore && (
                        <div style={{ textAlign: 'center' }}>
                          <strong>Relevance Score: </strong>
                          <span style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 'bold',
                            color: selectedTrend.relevanceScore >= 8 ? '#28a745' : 
                                   selectedTrend.relevanceScore >= 6 ? '#ffc107' : '#dc3545'
                          }}>
                            {selectedTrend.relevanceScore}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Edit Mode
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>
                        ✏️ Edit Trend Details
                      </h4>
                    </div>
                    
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Trend Title
                        </label>
                        <input
                          type="text"
                          value={editedTrend.title}
                          onChange={(e) => setEditedTrend({ ...editedTrend, title: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius)',
                            border: '1px solid var(--border-color)',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Category
                        </label>
                        <input
                          type="text"
                          value={editedTrend.category}
                          onChange={(e) => setEditedTrend({ ...editedTrend, category: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius)',
                            border: '1px solid var(--border-color)',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Description
                        </label>
                        <textarea
                          value={editedTrend.description}
                          onChange={(e) => setEditedTrend({ ...editedTrend, description: e.target.value })}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius)',
                            border: '1px solid var(--border-color)',
                            fontSize: '1rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Market Impact
                        </label>
                        <textarea
                          value={editedTrend.impact}
                          onChange={(e) => setEditedTrend({ ...editedTrend, impact: e.target.value })}
                          rows={3}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius)',
                            border: '1px solid var(--border-color)',
                            fontSize: '1rem',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                          Relevance Score (0-10)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={editedTrend.relevanceScore}
                          onChange={(e) => setEditedTrend({ ...editedTrend, relevanceScore: parseInt(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: 'var(--border-radius)',
                            border: '1px solid var(--border-color)',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                          onClick={saveEditedTrend}
                          style={{ 
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          💾 Save Changes
                        </button>
                        <button
                          onClick={cancelEditingTrend}
                          className="secondary"
                          style={{ 
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {selectionMode === 'trend' && !selectedTrend && (
            <div style={{
              marginTop: '1rem',
              padding: '2rem',
              backgroundColor: 'var(--secondary-color)',
              borderRadius: 'var(--border-radius)',
              textAlign: 'center',
              border: '2px dashed var(--border-color)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>No Trend Selected</h4>
              <p className="text-muted" style={{ margin: 0 }}>
                Visit the Trend Assistant to analyze market trends and return here to generate ideas.
              </p>
              <button 
                onClick={() => router.push('/trend-assistant')}
                style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}
              >
                🔍 Go to Trend Assistant
              </button>
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
        <div className="working-container loading-fade-in">
          <div className="working-emoji loading-bounce">💡</div>
          <h3 className="working-title">Generating Ideas</h3>
          <p className="working-subtitle">Using AI to craft compelling campaign idea options...</p>
          <div className="progress-dots">
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
            <div className="progress-dot"></div>
          </div>
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


                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    style={{ flex: 1, minWidth: '120px', fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                    onClick={() => developStory(idea.title, idea.summary, idea.sources)}
                  >
                    📝 Develop Story
                  </button>
                  <button 
                    className="secondary" 
                    style={{ flex: 1, minWidth: '120px', fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                    onClick={() => saveIdea(idea.title, idea.summary, idea.sources)}
                  >
                    💾 Save Idea
                  </button>
                  {clients.length > 0 && (
                    <button 
                      className="secondary"
                      style={{ 
                        flex: 1, 
                        minWidth: '120px', 
                        fontSize: '0.875rem', 
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderColor: '#28a745',
                        color: '#28a745'
                      }}
                      onClick={() => saveToClientActivity(idea.title, idea.summary, idea.sources)}
                    >
                      💾 Save to Client
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}