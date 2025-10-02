import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { secureRetrieve } from '../lib/secure-storage';

export default function StartFresh() {
  const [freshTopic, setFreshTopic] = useState('');
  const [freshDescription, setFreshDescription] = useState('');
  const [freshCampaignType, setFreshCampaignType] = useState('');
  const [freshClient, setFreshClient] = useState('');
  const [clients, setClients] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const storedClients = secureRetrieve('clients');
    if (storedClients) {
      setClients(storedClients);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!freshTopic.trim()) {
      alert('Please enter a topic or headline!');
      return;
    }

    if (!freshCampaignType) {
      alert('Please select a campaign type!');
      return;
    }

    // Get client data if selected
    let selectedClientData = null;
    if (freshClient) {
      selectedClientData = clients.find(c => c.id == freshClient);
    }

    // Create story data
    const storyData = {
      headline: freshTopic,
      summary: freshDescription || `News about ${freshTopic}`,
      sources: [],
      campaignType: freshCampaignType,
      clientData: selectedClientData,
      context: `Fresh start: ${freshTopic}`
    };

    // Navigate to PR writer with story data in URL params
    router.push(`/pr-writing-assistant?storyData=${encodeURIComponent(JSON.stringify(storyData))}`);
  };

  const handleCancel = () => {
    router.push('/pr-writing-assistant');
  };

  const campaignTypes = [
    { value: 'announcement', label: '📢 Company Announcement' },
    { value: 'product-launch', label: '🚀 Product Launch' },
    { value: 'industry-insight', label: '💡 Industry Insight' },
    { value: 'event', label: '🎉 Event Announcement' },
    { value: 'partnership', label: '🤝 Partnership News' },
    { value: 'award', label: '🏆 Award/Recognition' },
    { value: 'research', label: '📊 Research/Study' },
    { value: 'opinion', label: '💬 Expert Opinion' }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button 
          onClick={handleCancel}
          style={{ 
            padding: '0.5rem 1rem', 
            background: '#f5f5f5', 
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← Back to PR Writing Assistant
        </button>
        
        <h1 style={{ color: '#2c3e50', marginBottom: '1rem' }}>🆕 Start Fresh Campaign</h1>
        <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
          Create a new press release campaign from scratch. Enter your topic, select a campaign type, 
          and optionally associate it with a client.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
            Topic or Headline *
          </label>
          <input
            type="text"
            value={freshTopic}
            onChange={(e) => setFreshTopic(e.target.value)}
            placeholder="e.g., 'Local Tech Company Launches Revolutionary AI Platform'"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
            Brief Description (Optional)
          </label>
          <textarea
            value={freshDescription}
            onChange={(e) => setFreshDescription(e.target.value)}
            placeholder="Provide a brief description or context for your story..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
            Campaign Type *
          </label>
          <select
            value={freshCampaignType}
            onChange={(e) => setFreshCampaignType(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          >
            <option value="">Select a campaign type...</option>
            {campaignTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {clients.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
              Associate with Client (Optional)
            </label>
            <select
              value={freshClient}
              onChange={(e) => setFreshClient(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="">No specific client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.industry && `(${client.industry})`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: '1rem',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🚀 Start Writing PR
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            style={{
              padding: '1rem 2rem',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>💡 Tips for Success</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6c757d' }}>
          <li>Use specific, newsworthy headlines that grab attention</li>
          <li>Choose the most appropriate campaign type for better AI assistance</li>
          <li>Associate with a client to include relevant company information</li>
          <li>The AI will use your input to generate a compelling press release</li>
        </ul>
      </div>
    </div>
  );
}