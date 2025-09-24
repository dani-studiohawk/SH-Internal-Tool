import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SavedIdeas() {
  const [savedIdeas, setSavedIdeas] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadSavedIdeas();
  }, []);

  const loadSavedIdeas = () => {
    const saved = localStorage.getItem('savedIdeas');
    if (saved) {
      setSavedIdeas(JSON.parse(saved));
    }
  };

  const selectIdea = (idea) => {
    // Store the selected idea data
    localStorage.setItem('storyData', JSON.stringify(idea));
    // Navigate back to PR Writing Assistant
    router.push('/pr-writing-assistant');
  };

  const deleteIdea = (ideaId, e) => {
    e.stopPropagation(); // Prevent triggering selectIdea
    const updatedIdeas = savedIdeas.filter(idea => idea.id !== ideaId);
    setSavedIdeas(updatedIdeas);
    localStorage.setItem('savedIdeas', JSON.stringify(updatedIdeas));
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Saved Ideas</h1>
          <p className="text-muted">Browse and select from your saved ideas</p>
        </div>
        <button onClick={() => router.push('/pr-writing-assistant')} className="secondary">
          ← Back to PR Writer
        </button>
      </div>

      {savedIdeas.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
          <h3>No Saved Ideas Yet</h3>
          <p className="text-muted">
            Save ideas from the Ideation Assistant to access them here.
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
            <span className="text-muted">{savedIdeas.length} saved ideas</span>
          </div>

          <div className="grid grid-auto-fill">
            {savedIdeas.map(idea => (
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