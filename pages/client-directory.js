import { useState, useEffect } from 'react';

export default function ClientDirectory() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    leadDPR: '',
    boilerplate: '',
    pressContacts: '',
    url: '',
    toneOfVoice: '',
    spheres: '',
    status: 'active',
    outreachLocations: []
  });

  useEffect(() => {
    const stored = localStorage.getItem('clients');
    if (stored) {
      setClients(JSON.parse(stored));
    }
  }, []);

  const saveClients = (newClients) => {
    setClients(newClients);
    localStorage.setItem('clients', JSON.stringify(newClients));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingClient) {
      const updated = clients.map(c => c.id === editingClient.id ? { ...formData, id: editingClient.id } : c);
      saveClients(updated);
      setEditingClient(null);
    } else {
      const newClient = { ...formData, id: Date.now() };
      saveClients([...clients, newClient]);
    }
    setFormData({
      name: '',
      industry: '',
      leadDPR: '',
      boilerplate: '',
      pressContacts: '',
      url: '',
      toneOfVoice: '',
      spheres: '',
      status: 'active',
      outreachLocations: []
    });
    setShowForm(false);
  };

  const editClient = (client) => {
    setFormData({ ...client, outreachLocations: client.outreachLocations || [] });
    setEditingClient(client);
    setShowForm(true);
  };

  const deleteClient = (id) => {
    const filtered = clients.filter(c => c.id !== id);
    saveClients(filtered);
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
              value={formData.leadDPR} 
              onChange={e => setFormData({...formData, leadDPR: e.target.value})} 
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
                name: '', industry: '', leadDPR: '', boilerplate: '', 
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
              
              {client.leadDPR && (
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>
                  <strong>Lead DPR:</strong> {client.leadDPR}
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

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => editClient(client)}
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => deleteClient(client.id)}
                  className="danger"
                  style={{ flex: 1, fontSize: '0.875rem', padding: '0.75rem 1rem' }}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}