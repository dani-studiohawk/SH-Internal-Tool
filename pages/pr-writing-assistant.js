import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PRWritingAssistant() {
  const [draft, setDraft] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [clientData, setClientData] = useState(null);
  const [campaignType, setCampaignType] = useState('');
  const [sources, setSources] = useState([]);
  
  // New state for saved ideas functionality
  const [mode, setMode] = useState('loading'); // 'loading', 'fresh', 'saved', 'recent'
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [selectedSavedIdea, setSelectedSavedIdea] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  // Client directory integration
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  const loadClients = () => {
    const clientsData = localStorage.getItem('clients');
    if (clientsData) {
      setClients(JSON.parse(clientsData));
    }
  };

  const saveToClientActivity = (clientId, activityData) => {
    try {
      // Get existing client activity using the same pattern as other tools
      const existingActivity = JSON.parse(localStorage.getItem(`client_${clientId}_activity`) || '{}');
      
      // Initialize arrays if they don't exist
      if (!existingActivity.savedTrends) existingActivity.savedTrends = [];
      if (!existingActivity.savedIdeas) existingActivity.savedIdeas = [];
      if (!existingActivity.savedPRs) existingActivity.savedPRs = [];

      // Create the press release activity
      const prActivity = {
        id: Date.now().toString(),
        headline: activityData.headline || 'Press Release Draft',
        summary: activityData.summary || '',
        content: activityData.draft || '',
        campaignType: activityData.campaignType || '',
        sources: activityData.sources || [],
        savedAt: new Date().toISOString(),
        notes: '' // Can be extended later
      };
      
      // Add to savedPRs array
      existingActivity.savedPRs.push(prActivity);
      
      // Save back to localStorage
      localStorage.setItem(`client_${clientId}_activity`, JSON.stringify(existingActivity));
      
      return prActivity.id;
    } catch (error) {
      console.error('Error saving to client activity:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Load saved ideas and clients
    loadSavedIdeas();
    loadClients();
    
    // Check for recent session data
    const storyData = localStorage.getItem('storyData');
    if (storyData) {
      const data = JSON.parse(storyData);
      setHeadline(data.headline);
      setSummary(data.summary);
      setClientData(data.clientData);
      setCampaignType(data.campaignType);
      setSources(data.sources || []);
      setMode('recent');
      
      // If editing an existing PR, use the existing content
      if (data.existingContent) {
        setDraft(data.existingContent);
      } else {
        generateInitialDraft(data);
      }
    } else {
      setMode('fresh');
    }
  }, []);

  const loadSavedIdeas = () => {
    const saved = localStorage.getItem('savedIdeas');
    if (saved) {
      setSavedIdeas(JSON.parse(saved));
    }
  };

  const saveIdea = (ideaData) => {
    const newIdea = {
      id: Date.now().toString(),
      ...ideaData,
      savedAt: new Date().toISOString()
    };
    
    const updatedIdeas = [newIdea, ...savedIdeas];
    setSavedIdeas(updatedIdeas);
    localStorage.setItem('savedIdeas', JSON.stringify(updatedIdeas));
  };

  const startFresh = () => {
    router.push('/start-fresh');
  };

  const generateInitialDraft = (data) => {
    let draftText = `For Immediate Release\n\n`;
    
    if (data.clientData) {
      draftText += `[${data.clientData.name}]\n`;
    }
    
    draftText += `[City, State] – [Date] – `;
    
    if (data.clientData) {
      draftText += `${data.clientData.name} `;
    }
    
    draftText += `${data.headline}\n\n`;
    draftText += `${data.summary}\n\n`;
    
    if (data.campaignType === 'Data lead' && data.sources.length > 0) {
      draftText += `Key Findings:\n`;
      data.sources.forEach(source => {
        draftText += `- ${source}\n`;
      });
      draftText += `\n`;
    }
    
    draftText += `[Body of the press release - expand on the story here]\n\n`;
    
    if (data.clientData) {
      draftText += `About ${data.clientData.name}\n`;
      if (data.clientData.boilerplate) {
        draftText += `${data.clientData.boilerplate}\n\n`;
      }
    }
    
    draftText += `For more information, contact:\n`;
    if (data.clientData && data.clientData.pressContacts) {
      draftText += `${data.clientData.pressContacts}\n`;
    }
    draftText += `[Contact details]\n\n`;
    draftText += `###\n\n`;
    draftText += `Campaign Type: ${data.campaignType}\n`;
    draftText += `Context: ${data.context}`;
    
    setDraft(draftText);
  };

  const generateFullPressRelease = async () => {
    if (!headline || !summary) {
      alert('Please provide a headline and summary first!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-press-release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline,
          summary,
          clientData,
          campaignType,
          sources,
          currentDate: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        })
      });

      const data = await response.json();
      setDraft(data.pressRelease);
    } catch (error) {
      console.error('Error generating press release:', error);
      alert('Failed to generate press release. Please try again.');
    }
    setLoading(false);
  };

  const copyToClipboard = async () => {
    if (!draft) {
      alert('No press release content to copy!');
      return;
    }

    try {
      await navigator.clipboard.writeText(draft);
      alert('Press release copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = draft;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Press release copied to clipboard!');
    }
  };

  const saveDraft = () => {
    if (!draft) {
      alert('No press release content to save!');
      return;
    }

    if (!selectedClientId) {
      if (confirm('No client selected. Would you like to save this to the general drafts?')) {
        // Save to general saved ideas
        const draftData = {
          headline,
          summary,
          draft,
          campaignType,
          sources,
          clientData,
          savedAt: new Date().toISOString()
        };
        saveIdea(draftData);
        alert('Press release draft saved!');
      }
      return;
    }

    const client = clients.find(c => c.id === parseInt(selectedClientId));
    if (!client) {
      alert('Selected client not found!');
      return;
    }

    try {
      const activityId = saveToClientActivity(selectedClientId, {
        headline,
        summary,
        draft,
        campaignType,
        sources
      });
      
      alert(`Press release draft saved to ${client.name}'s activity!`);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>PR Writing Assistant</h1>
          <p className="text-muted">Develop your story into a complete press release</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push('/saved-ideas')}>📚 Saved Ideas</button>
          <button onClick={startFresh} className="secondary">🆕 Start Fresh</button>
        </div>
      </div>

      {/* Mode Indicator */}
      {mode !== 'loading' && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '500' }}>
              Current Mode: 
              <span style={{ color: 'var(--primary-color)', marginLeft: '0.5rem' }}>
                {mode === 'fresh' && '🆕 Fresh Start'}
                {mode === 'recent' && '⏰ Recent Session'}
                {mode === 'saved' && '💾 Saved Idea'}
              </span>
            </span>
            {selectedSavedIdea && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Loaded: {selectedSavedIdea.headline.substring(0, 50)}...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Story Details */}
      {(headline || summary) && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Story Details</h3>
          {headline && <div style={{ marginBottom: '1rem' }}><strong>Headline:</strong> {headline}</div>}
          {summary && <div style={{ marginBottom: '1rem' }}><strong>Summary:</strong> {summary}</div>}
          {campaignType && <div style={{ marginBottom: '1rem' }}><strong>Campaign Type:</strong> {campaignType}</div>}
          {clientData && <div style={{ marginBottom: '1rem' }}><strong>Client:</strong> {clientData.name} ({clientData.industry})</div>}
          {sources.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Data Sources:</strong>
              <ul>{sources.map((source, index) => <li key={index}>{source}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Press Release Draft */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Press Release Draft</h3>
        <button onClick={generateFullPressRelease} style={{ marginBottom: '1rem' }} disabled={loading}>
          {loading ? '🧠 Generating Press Release...' : '✨ Generate Full Press Release'}
        </button>
        
        {loading && (
          <div className="working-container loading-fade-in" style={{ marginBottom: '1rem' }}>
            <div className="working-emoji loading-pulse">📝</div>
            <h3 className="working-title">Crafting Your Press Release</h3>
            <p className="working-subtitle">AI is writing a professional press release based on your story details...</p>
            <div className="progress-dots">
              <div className="progress-dot"></div>
              <div className="progress-dot"></div>
              <div className="progress-dot"></div>
            </div>
          </div>
        )}
        
        <textarea 
          value={draft} 
          onChange={e => setDraft(e.target.value)} 
          rows="25" 
          cols="80"
          style={{ width: '100%', fontFamily: 'monospace' }}
          placeholder="Your press release draft will appear here..."
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={copyToClipboard} disabled={!draft}>
            📋 Copy to Clipboard
          </button>
          <button className="secondary" onClick={saveDraft} disabled={!draft}>
            💾 Save Draft
          </button>
          {clients.length > 0 && (
            <select 
              value={selectedClientId} 
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{ padding: '0.5rem', marginLeft: '1rem' }}
            >
              <option value="">Select client (optional)</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}