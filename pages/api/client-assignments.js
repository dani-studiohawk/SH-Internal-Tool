import { neon } from '@neondatabase/serverless';
import { withAuth } from '../../lib/auth-middleware';

const sql = neon(process.env.DATABASE_URL);

async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Client assignments API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  try {
    const assignments = await sql`
      SELECT 
        ca.id,
        ca.client_id,
        ca.user_id,
        ca.assigned_at,
        ca.assigned_by,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        c.name as client_name,
        ab.name as assigned_by_name
      FROM client_assignments ca
      JOIN users u ON ca.user_id = u.id
      JOIN clients c ON ca.client_id = c.id
      LEFT JOIN users ab ON ca.assigned_by = ab.id
      ORDER BY ca.assigned_at DESC
    `;

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching client assignments:', error);
    res.status(500).json({ error: 'Failed to fetch client assignments' });
  }
}

async function handlePost(req, res) {
  const { user } = req;
  const { clientId, userId } = req.body;

  // Check if user has permission to assign clients
  if (!['admin', 'dpr_manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (!clientId || !userId) {
    return res.status(400).json({ error: 'Client ID and User ID are required' });
  }

  try {
    // Check if assignment already exists
    const existingAssignment = await sql`
      SELECT id FROM client_assignments 
      WHERE client_id = ${clientId} AND user_id = ${userId}
    `;

    if (existingAssignment.length > 0) {
      return res.status(409).json({ error: 'User is already assigned to this client' });
    }

    // Create the assignment
    const newAssignment = await sql`
      INSERT INTO client_assignments (client_id, user_id, assigned_by, assigned_at)
      VALUES (${clientId}, ${userId}, ${user.id}, NOW())
      RETURNING *
    `;

    // Log the assignment history
    await sql`
      INSERT INTO client_assignment_history (client_id, user_id, action, performed_by, performed_at)
      VALUES (${clientId}, ${userId}, 'assigned', ${user.id}, NOW())
    `;

    res.status(201).json(newAssignment[0]);
  } catch (error) {
    console.error('Error creating client assignment:', error);
    res.status(500).json({ error: 'Failed to create client assignment' });
  }
}

async function handleDelete(req, res) {
  const { user } = req;
  const { clientId, userId } = req.query;

  // Check if user has permission to unassign clients
  if (!['admin', 'dpr_manager'].includes(user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  if (!clientId || !userId) {
    return res.status(400).json({ error: 'Client ID and User ID are required' });
  }

  try {
    // Delete the assignment
    const deletedAssignment = await sql`
      DELETE FROM client_assignments 
      WHERE client_id = ${clientId} AND user_id = ${userId}
      RETURNING *
    `;

    if (deletedAssignment.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Log the unassignment history
    await sql`
      INSERT INTO client_assignment_history (client_id, user_id, action, performed_by, performed_at)
      VALUES (${clientId}, ${userId}, 'unassigned', ${user.id}, NOW())
    `;

    res.status(200).json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error deleting client assignment:', error);
    res.status(500).json({ error: 'Failed to delete client assignment' });
  }
}

export default withAuth(handler);