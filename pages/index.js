import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const [clientCount, setClientCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    fetchClientCount();
  }, []);

  const fetchClientCount = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const clients = await response.json();
        const activeClients = clients.filter(client => client.status === 'active');
        setClientCount(activeClients.length);
      } else {
        // Fallback to localStorage if API fails
        if (typeof window !== 'undefined') {
          const clients = JSON.parse(localStorage.getItem('clients') || '[]');
          const activeClients = clients.filter(client => client.status === 'active');
          setClientCount(activeClients.length);
        }
      }
    } catch (error) {
      console.error('Error fetching client count:', error);
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const activeClients = clients.filter(client => client.status === 'active');
        setClientCount(activeClients.length);
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = (fullName) => {
    return fullName ? fullName.split(' ')[0] : 'there';
  };

  return (
    <div>
      {/* Welcome Banner */}
      {session && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <h1 className="welcome-title">
              {getGreeting()}, {getFirstName(session.user.name)}! 👋
            </h1>
            <p className="welcome-subtitle">
              Welcome back to your Studio Hawk dashboard. Ready to create something amazing today?
            </p>
          </div>
          {session.user.image && (
            <img 
              src={session.user.image} 
              alt={session.user.name}
              className="welcome-avatar"
            />
          )}
        </div>
      )}

      <div className="flex-between mb-4">
        <div>
          <h1>Studio Hawk Dashboard</h1>
          <p className="text-muted">Your comprehensive internal tool for client management and content creation</p>
        </div>
        <div className="text-sm text-muted">
          {isClient && new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="grid grid-auto-fill">
        <div className="card">
          <h3>📊 Quick Stats</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-color)' }}>
                {isClient ? clientCount : '...'}
              </div>
              <div className="text-sm text-muted">Active Clients</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-color)' }}>8</div>
              <div className="text-sm text-muted">Tools Available</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>🚀 Getting Started</h3>
          <p className="text-muted">Start by adding your first client to the directory, then explore our AI-powered tools for content creation and trend analysis.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => router.push('/client-directory')}>
              Add Clients
            </button>
            <button className="secondary" onClick={() => router.push('/trend-assistant')}>
              Explore Tools
            </button>
          </div>
        </div>

        <div className="card">
          <h3>🔧 System Status</h3>
          <div style={{ marginTop: '1rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <span className="text-sm">Local Storage</span>
              <span style={{ color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: '500' }}>✓ Active</span>
            </div>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <span className="text-sm">Demo Mode</span>
              <span style={{ color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: '500' }}>✓ Enabled</span>
            </div>
            <div className="flex-between">
              <span className="text-sm">All Systems</span>
              <span style={{ color: 'var(--accent-color)', fontSize: '0.875rem', fontWeight: '500' }}>✓ Operational</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>💡 Features</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ marginRight: '0.5rem' }}>👥</span>
              Client Directory Management
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ marginRight: '0.5rem' }}>📈</span>
              Trend Analysis Tools
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ marginRight: '0.5rem' }}>💡</span>
              AI-Powered Content Creation
            </li>
            <li style={{ padding: '0.5rem 0' }}>
              <span style={{ marginRight: '0.5rem' }}>📰</span>
              PR & Headline Generation
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}