import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ClientDirectory() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    leadDpr: '',
    boilerplate: '',
    pressContacts: '',
    url: '',
    toneOfVoice: '',
    spheres: '',
    status: 'active',
    outreachLocations: []
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      alert('Failed to load clients from database');
    }
  };

  const saveClient = async (clientData) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      const newClient = await response.json();
      setClients([...clients, newClient]);
      
      return newClient;
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client to database');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingClient) {
      // Update existing client
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingClient.id })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setClients(clients.map(c => c.id === updated.id ? updated : c));
      }
    } else {
      // Create new client
      await saveClient(formData);
    }
    
    setShowForm(false);
    setFormData({
      name: '', industry: '', leadDpr: '', boilerplate: '',
      pressContacts: '', url: '', toneOfVoice: '', spheres: '',
      status: 'active', outreachLocations: []
    });
    setEditingClient(null);
  };

  const editClient = (client) => {
    setFormData({ ...client, outreachLocations: client.outreachLocations || [] });
    setEditingClient(client);
    setShowForm(true);
  };

  const deleteClient = async (id) => {
    try {
      const response = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        setClients(clients.filter(c => c.id !== id));
      } else {
        alert('Failed to delete client from database');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client from database');
    }
  };

  const getClientActivitySummary = (clientId) => {
    try {
      const activity = JSON.parse(localStorage.getItem(`client_${clientId}_activity`) || '{}');
      return {
        trendsCount: (activity.savedTrends || []).length,
        ideasCount: (activity.savedIdeas || []).length,
        prsCount: (activity.savedPRs || []).length,
        lastActivity: getLastActivityDate(activity)
      };
    } catch (error) {
      return { trendsCount: 0, ideasCount: 0, prsCount: 0, lastActivity: null };
    }
  };

  const getLastActivityDate = (activity) => {
    const allItems = [
      ...(activity.savedTrends || []),
      ...(activity.savedIdeas || []),
      ...(activity.savedPRs || [])
    ];
    
    if (allItems.length === 0) return null;
    
    const dates = allItems.map(item => new Date(item.savedAt)).filter(date => !isNaN(date));
    if (dates.length === 0) return null;
    
    const latest = new Date(Math.max(...dates));
    const now = new Date();
    const diffTime = Math.abs(now - latest);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1>Client Directory</h1>
          <p className="text-muted">Manage your client information and project details</p>
        </div>
        <button onClick={() => setShowForm(true)}>
          ✨ Add New Client
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input 
              placeholder="Client Name *" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
            />
            <input 
              placeholder="Industry" 
              value={formData.industry} 
              onChange={e => setFormData({...formData, industry: e.target.value})} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input 
              placeholder="Lead DPR" 
              value={formData.leadDpr} 
              onChange={e => setFormData({...formData, leadDpr: e.target.value})} 
            />
            <input 
              placeholder="Website URL" 
              value={formData.url} 
              onChange={e => setFormData({...formData, url: e.target.value})} 
            />
          </div>

          <textarea 
            placeholder="Company Boilerplate" 
            value={formData.boilerplate} 
            onChange={e => setFormData({...formData, boilerplate: e.target.value})} 
            style={{ minHeight: '80px' }}
          />

          <textarea 
            placeholder="Press Contacts" 
            value={formData.pressContacts} 
            onChange={e => setFormData({...formData, pressContacts: e.target.value})} 
            style={{ minHeight: '80px' }}
          />

          <textarea 
            placeholder="Tone of Voice Guidelines" 
            value={formData.toneOfVoice} 
            onChange={e => setFormData({...formData, toneOfVoice: e.target.value})} 
            style={{ minHeight: '80px' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
            <input 
              placeholder="Spheres of Relevance" 
              value={formData.spheres} 
              onChange={e => setFormData({...formData, spheres: e.target.value})} 
            />
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})}
              style={{ width: '150px' }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Outreach Locations</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={formData.outreachLocations.includes('Australia')} 
                  onChange={e => {
                    const locs = formData.outreachLocations;
                    if (e.target.checked) {
                      setFormData({...formData, outreachLocations: [...locs, 'Australia']});
                    } else {
                      setFormData({...formData, outreachLocations: locs.filter(l => l !== 'Australia')});
                    }
                  }} 
                /> Australia
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={formData.outreachLocations.includes('UK')} 
                  onChange={e => {
                    const locs = formData.outreachLocations;
                    if (e.target.checked) {
                      setFormData({...formData, outreachLocations: [...locs, 'UK']});
                    } else {
                      setFormData({...formData, outreachLocations: locs.filter(l => l !== 'UK')});
                    }
                  }} 
                /> UK
              </label>
              <label>
                <input 
                  type="checkbox" 
                  checked={formData.outreachLocations.includes('United States')} 
                  onChange={e => {
                    const locs = formData.outreachLocations;
                    if (e.target.checked) {
                      setFormData({...formData, outreachLocations: [...locs, 'United States']});
                    } else {
                      setFormData({...formData, outreachLocations: locs.filter(l => l !== 'United States')});
                    }
                  }} 
                /> United States
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit">
              {editingClient ? '💾 Update Client' : '✨ Add Client'}
            </button>
            <button 
              type="button" 
              className="secondary"
              onClick={() => {setShowForm(false); setEditingClient(null); setFormData({
                name: '', industry: '', leadDpr: '', boilerplate: '', 
                pressContacts: '', url: '', toneOfVoice: '', spheres: '', status: 'active',
                outreachLocations: []
              });}}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {clients.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem', marginTop: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3>No clients yet</h3>
          <p className="text-muted">Start by adding your first client to get organized!</p>
          <button onClick={() => setShowForm(true)}>Add Your First Client</button>
        </div>
      ) : (
        <div className="grid grid-auto-fill">
          {clients.sort((a,b) => a.name.localeCompare(b.name)).map(client => (
            <div key={client.id} className="card">
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{client.name}</h3>
                <span 
                  style={{ 
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: client.status === 'active' ? 'var(--accent-color)' : '#6c757d',
                    color: client.status === 'active' ? 'var(--primary-color)' : 'white'
                  }}
                >
                  {client.status}
                </span>
              </div>
              
              {client.industry && (
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                  <strong>Industry:</strong> {client.industry}
                </p>
              )}
              
              {client.leadDpr && (
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                  <strong>Lead DPR:</strong> {client.leadDpr}
                </p>
              )}
              
              {client.url && (
                <p className="text-sm" style={{ marginBottom: '1rem' }}>
                  <a 
                    href={client.url.startsWith('http') ? client.url : `https://${client.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: 'var(--accent-color)', 
                      textDecoration: 'none'
                    }}
                  >
                    🔗 Visit Website
                  </a>
                </p>
              )}

              {client.outreachLocations && Array.isArray(client.outreachLocations) && client.outreachLocations.length > 0 && (
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                  <strong>Outreach Locations:</strong> {client.outreachLocations.join(', ')}
                </p>
              )}

              {/* Activity Summary */}
              {(() => {
                const activity = getClientActivitySummary(client.id);
                const hasActivity = activity.trendsCount > 0 || activity.ideasCount > 0 || activity.prsCount > 0;
                
                return hasActivity ? (
                  <div style={{ 
                    backgroundColor: 'var(--secondary-color)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--border-radius)',
                    marginTop: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div className="text-sm" style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                      🏢 Recent Activity:
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {activity.trendsCount > 0 && <span>📈 {activity.trendsCount} trends</span>}
                      {activity.ideasCount > 0 && <span>💡 {activity.ideasCount} ideas</span>}
                      {activity.prsCount > 0 && <span>📰 {activity.prsCount} PRs</span>}
                    </div>
                    {activity.lastActivity && (
                      <div className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
                        Last activity: {activity.lastActivity}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    backgroundColor: 'rgba(108, 117, 125, 0.1)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--border-radius)',
                    marginTop: '1rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <div className="text-sm text-muted">
                      📋 No saved activity yet
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => router.push(`/client-activity?clientId=${client.id}`)}
                  style={{ flex: 1, minWidth: '120px', fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                >
                  📋 View Activity
                </button>
                <button 
                  onClick={() => editClient(client)}
                  className="secondary"
                  style={{ flex: 1, minWidth: '100px', fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => deleteClient(client.id)}
                  className="danger"
                  style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}