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
  
  const router = useRouter();

  useEffect(() => {
    // Load saved ideas
    loadSavedIdeas();
    
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
      generateInitialDraft(data);
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

  const generateDraft = () => {
    // This could be enhanced to call OpenAI for full press release generation
    const storyData = localStorage.getItem('storyData');
    if (storyData) {
      const data = JSON.parse(storyData);
      generateInitialDraft(data);
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
        <button onClick={generateDraft} style={{ marginBottom: '1rem' }}>
          {draft ? '🔄 Regenerate Draft' : '✨ Generate Draft'}
        </button>
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
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button>📋 Copy to Clipboard</button>
          <button className="secondary">💾 Save Draft</button>
          <button className="secondary">📤 Export as Word</button>
          <button className="secondary">📧 Send for Review</button>
        </div>
      </div>
    </div>
  );
}