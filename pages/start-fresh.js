import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StartFresh() {
  const [freshClient, setFreshClient] = useState('');
  const [freshTopic, setFreshTopic] = useState('');
  const [freshCampaignType, setFreshCampaignType] = useState('');
  const [freshDescription, setFreshDescription] = useState('');
  const [clients, setClients] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
      setClients(JSON.parse(storedClients));
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

    // Store in localStorage and navigate to PR writer
    localStorage.setItem('storyData', JSON.stringify(storyData));
    router.push('/pr-writing-assistant');
  };

  const handleCancel = () => {
    router.push('/pr-writing-assistant');
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Start Fresh Press Release</h1>
          <p className="text-muted">Create a new press release from scratch</p>
        </div>
        <button onClick={handleCancel} className="secondary">
          ← Back to PR Writer
        </button>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Client Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Client (Optional)
            </label>
            <select
              value={freshClient}
              onChange={e => setFreshClient(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}
            >
              <option value="">Select a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.industry})
                </option>
              ))}
            </select>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Leave blank for general press releases
            </p>
          </div>

          {/* Topic/Headline */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Topic or Headline *
            </label>
            <input
              type="text"
              value={freshTopic}
              onChange={e => setFreshTopic(e.target.value)}
              placeholder="Enter a topic or headline for your press release"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}
              required
            />
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              This will become the main headline of your press release
            </p>
          </div>

          {/* Campaign Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Campaign Type *
            </label>
            <select
              value={freshCampaignType}
              onChange={e => setFreshCampaignType(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}
              required
            >
              <option value="">Select campaign type...</option>
              <option value="Product launch">Product Launch</option>
              <option value="Company milestone">Company Milestone</option>
              <option value="Executive appointment">Executive Appointment</option>
              <option value="Partnership">Partnership</option>
              <option value="Award">Award</option>
              <option value="Data lead">Data Lead</option>
              <option value="Thought leadership">Thought Leadership</option>
              <option value="Event">Event</option>
              <option value="Other">Other</option>
            </select>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Choose the type of announcement for appropriate formatting
            </p>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Brief Description (Optional)
            </label>
            <textarea
              value={freshDescription}
              onChange={e => setFreshDescription(e.target.value)}
              placeholder="Add any additional context or details about the announcement..."
              rows="4"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', resize: 'vertical' }}
            />
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              This will help generate a more detailed press release summary
            </p>
          </div>

          {/* Preview */}
          {(freshTopic || freshDescription) && (
            <div style={{ padding: '1rem', backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--border-radius)' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Preview</h4>
              <div style={{ fontSize: '0.875rem' }}>
                <strong>Headline:</strong> {freshTopic || 'Your headline here'}
                <br />
                <strong>Summary:</strong> {freshDescription || `News about ${freshTopic || 'your topic'}`}
                {freshCampaignType && (
                  <>
                    <br />
                    <strong>Type:</strong> {freshCampaignType}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={handleCancel} className="secondary">
              Cancel
            </button>
            <button type="submit">
              Create Press Release →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}