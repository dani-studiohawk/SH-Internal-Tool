/**
 * API endpoint for managing users
 * Handles user listing, role updates, and user management
 */

import { withAuth } from '../../../lib/auth-middleware';

async function handler(req, res) {
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  const { user } = req;

  try {
    switch (req.method) {
      case 'GET':
        return await getUsers(sql, res);
      
      case 'PUT':
        return await updateUser(sql, req, res, user);
      
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function getUsers(sql, res) {
  const users = await sql`
    SELECT 
      id,
      email,
      name,
      image,
      role,
      status,
      department,
      last_login,
      created_at,
      (
        SELECT COUNT(*)::integer 
        FROM client_assignments ca 
        WHERE ca.user_id = users.id AND ca.status = 'active'
      ) as assigned_clients_count
    FROM users 
    WHERE status = 'active'
    ORDER BY 
      CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'dpr_manager' THEN 2 
        WHEN 'dpr_lead' THEN 3 
        WHEN 'assistant' THEN 4 
        ELSE 5 
      END,
      name
  `;
  
  return res.status(200).json(users);
}

async function updateUser(sql, req, res, currentUser) {
  const { id } = req.query;
  const { role, status, department } = req.body;
  
  // Check if current user has permission to update users
  if (!['admin', 'dpr_manager'].includes(currentUser.role)) {
    return res.status(403).json({ message: 'Insufficient permissions to update users' });
  }
  
  // Validate role
  const validRoles = ['admin', 'dpr_manager', 'dpr_lead', 'assistant'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified' });
  }
  
  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramCount = 1;
  
  if (role !== undefined) {
    updates.push(`role = $${paramCount++}`);
    values.push(role);
  }
  
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }
  
  if (department !== undefined) {
    updates.push(`department = $${paramCount++}`);
    values.push(department);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }
  
  updates.push(`updated_at = NOW()`);
  values.push(id);
  
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  
  const result = await sql.unsafe(query, values);
  
  if (result.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  return res.status(200).json(result[0]);
}

export default withAuth(handler);