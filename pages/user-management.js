import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ROLE_LABELS = {
  admin: 'Admin',
  dpr_manager: 'DPR Manager',
  dpr_lead: 'DPR Lead',
  assistant: 'Assistant'
};

const ROLE_COLORS = {
  admin: '#dc3545',
  dpr_manager: '#0d6efd',
  dpr_lead: '#198754',
  assistant: '#6f42c1'
};

export default function UserManagement() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Check if current user can manage users
  const canManageUsers = session?.user?.role && ['admin', 'dpr_manager'].includes(session.user.role);

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch client assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['client-assignments'],
    queryFn: async () => {
      const response = await fetch('/api/client-assignments');
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  });

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleUpdateRole = (newRole) => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser.id,
        updates: { role: newRole }
      });
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'dpr_manager': return '👔';
      case 'dpr_lead': return '🎯';
      case 'assistant': return '🤝';
      default: return '👤';
    }
  };

  const getUserAssignments = (userId) => {
    return assignments.filter(assignment => assignment.user_id === userId);
  };

  if (usersLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>You don't have permission to manage users. Only Admins and DPR Managers can access this page.</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1>👥 User Management</h1>
          <p className="text-muted">Manage team members and their roles</p>
        </div>
        <div className="user-stats">
          <div className="stat-card">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{assignments.length}</div>
            <div className="stat-label">Active Assignments</div>
          </div>
        </div>
      </div>

      <div className="users-grid">
        {users.map(user => {
          const userAssignments = getUserAssignments(user.id);
          
          return (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar-section">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-placeholder">
                      {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="user-info">
                    <h3 className="user-name">{user.name}</h3>
                    <p className="user-email">{user.email}</p>
                  </div>
                </div>
                
                <div 
                  className="role-badge"
                  style={{ backgroundColor: ROLE_COLORS[user.role] }}
                  onClick={() => canManageUsers && handleRoleChange(user)}
                  title={canManageUsers ? 'Click to change role' : 'Role'}
                >
                  <span className="role-icon">{getRoleIcon(user.role)}</span>
                  <span className="role-text">{ROLE_LABELS[user.role]}</span>
                  {canManageUsers && <span className="role-edit-icon">✏️</span>}
                </div>
              </div>

              <div className="user-stats-section">
                <div className="user-stat">
                  <span className="stat-value">{user.assigned_clients_count || 0}</span>
                  <span className="stat-label">Assigned Clients</span>
                </div>
                {user.department && (
                  <div className="user-stat">
                    <span className="stat-value">{user.department}</span>
                    <span className="stat-label">Department</span>
                  </div>
                )}
                <div className="user-stat">
                  <span className="stat-value">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </span>
                  <span className="stat-label">Last Login</span>
                </div>
              </div>

              {userAssignments.length > 0 && (
                <div className="user-assignments">
                  <h4>Recent Assignments:</h4>
                  <div className="assignment-list">
                    {userAssignments.slice(0, 3).map(assignment => (
                      <div key={assignment.id} className="assignment-item">
                        <span className="client-name">{assignment.client_name}</span>
                        <span className="assignment-date">
                          {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {userAssignments.length > 3 && (
                      <div className="assignment-item">
                        <span className="more-assignments">
                          +{userAssignments.length - 3} more...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Role for {selectedUser.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowRoleModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Select a new role for this user. This will affect their permissions throughout the system.
              </p>
              
              <div className="role-options">
                {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => (
                  <button
                    key={roleKey}
                    className={`role-option ${selectedUser.role === roleKey ? 'current' : ''}`}
                    style={{ borderColor: ROLE_COLORS[roleKey] }}
                    onClick={() => handleUpdateRole(roleKey)}
                    disabled={updateUserMutation.isLoading}
                  >
                    <span className="role-icon">{getRoleIcon(roleKey)}</span>
                    <span className="role-label">{roleLabel}</span>
                    {selectedUser.role === roleKey && <span className="current-badge">Current</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .user-management {
          padding: 2rem 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .user-stats {
          display: flex;
          gap: 1rem;
        }

        .stat-card {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .user-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .user-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .user-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .user-avatar-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e2e8f0;
        }

        .user-avatar-placeholder {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color), var(--accent-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: #2d3748;
        }

        .user-email {
          font-size: 0.85rem;
          color: #718096;
          margin: 0;
        }

        .role-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .role-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .role-icon {
          font-size: 0.9rem;
        }

        .role-edit-icon {
          font-size: 0.7rem;
          opacity: 0.8;
          margin-left: 0.25rem;
        }

        .user-stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .user-stat {
          text-align: center;
        }

        .user-stat .stat-value {
          display: block;
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .user-stat .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #718096;
          margin-top: 0.25rem;
        }

        .user-assignments {
          border-top: 1px solid #e2e8f0;
          padding-top: 1rem;
        }

        .user-assignments h4 {
          font-size: 0.85rem;
          color: #4a5568;
          margin: 0 0 0.5rem 0;
          font-weight: 600;
        }

        .assignment-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .assignment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          padding: 0.25rem 0;
        }

        .client-name {
          color: #2d3748;
          font-weight: 500;
        }

        .assignment-date {
          color: #718096;
          font-size: 0.75rem;
        }

        .more-assignments {
          color: #718096;
          font-style: italic;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          text-align: center;
        }

        .spinner {
          width: 2rem;
          height: 2rem;
          border: 3px solid #e2e8f0;
          border-top: 3px solid var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .access-denied {
          text-align: center;
          padding: 4rem 2rem;
          color: #718096;
        }

        .access-denied-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .access-denied h2 {
          color: #2d3748;
          margin-bottom: 1rem;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 0;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2d3748;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #718096;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .modal-close:hover {
          background: #f7fafc;
          color: #2d3748;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-description {
          color: #718096;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .role-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .role-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: 2px solid transparent;
          border-radius: 12px;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .role-option:hover {
          background: #e9ecef;
          transform: translateY(-1px);
        }

        .role-option.current {
          background: rgba(0, 201, 255, 0.1);
          border-color: var(--accent-color);
        }

        .role-option .role-icon {
          font-size: 1.25rem;
        }

        .role-option .role-label {
          font-weight: 600;
          color: #2d3748;
          flex: 1;
        }

        .current-badge {
          background: var(--accent-color);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .user-stats {
            justify-content: center;
          }

          .users-grid {
            grid-template-columns: 1fr;
          }

          .user-stats-section {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}