/**
 * API endpoint for updating individual users
 * Handles user role and status updates
 */

import { withAuth } from '../../../lib/auth-middleware';

async function handler(req, res) {
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);
  const { user } = req;
  const { id } = req.query;

  try {
    switch (req.method) {
      case 'PUT':
        return await updateUser(sql, req, res, user, id);
      
      default:
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User update API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateUser(sql, req, res, currentUser, userId) {
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
  values.push(userId);
  
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  
  const result = await sql.unsafe(query, values);
  
  if (result.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  return res.status(200).json(result[0]);
}

export default withAuth(handler);