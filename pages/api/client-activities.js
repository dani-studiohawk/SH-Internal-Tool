const { withAuth } = require('../../lib/auth-middleware');
const { neon } = require('@neondatabase/serverless');
const { validateClientActivityContent, sanitizeContent, validateRequestSize } = require('../../lib/validation');
const { applyReadRateLimit, applyWriteRateLimit } = require('../../lib/rate-limit');
const { withErrorHandler, handleDatabaseError } = require('../../lib/error-handler');

// Initialize database connection
const sql = neon(process.env.DATABASE_URL);

// Helper function to convert snake_case to camelCase
function toCamelCase(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Input validation functions
function validateActivityData(data, isUpdate = false) {
  const errors = [];

  // Required field validation (only for creation)
  if (!isUpdate && (!data.clientId || typeof data.clientId !== 'number')) {
    errors.push('Client ID is required and must be a number');
  }

  if (!isUpdate && (!data.activityType || typeof data.activityType !== 'string')) {
    errors.push('Activity type is required');
  }

  // Validate activity type
  if (data.activityType && !['trend', 'idea', 'pr'].includes(data.activityType)) {
    errors.push('Activity type must be trend, idea, or pr');
  }

  // String length validation
  if (data.title && (typeof data.title !== 'string' || data.title.length > 300)) {
    errors.push('Title must be a string under 300 characters');
  }

  if (data.notes && (typeof data.notes !== 'string' || data.notes.length > 10000)) {
    errors.push('Notes must be a string under 10,000 characters');
  }

  // Content validation with enhanced JSON schema validation
  if (data.content) {
    try {
      JSON.stringify(data.content);
      
      // Apply JSON schema validation
      const validation = validateClientActivityContent(data.content);
      if (!validation.isValid) {
        errors.push(`Invalid content structure: ${validation.errors.join(', ')}`);
      }
    } catch (error) {
      errors.push('Content must be valid JSON');
    }
  }

  return errors;
}

async function handler(req, res) {
  // Apply rate limiting based on method
  const rateLimitHandler = req.method === 'GET' ? applyReadRateLimit : applyWriteRateLimit;
  
  return rateLimitHandler(req, res, async () => {
    await handleRequest(req, res);
  });
}

async function handleRequest(req, res) {
  // Validate request size
  validateRequestSize(req, res, () => {});

  // User session is available in req.session (provided by withAuth)
  console.log(`API accessed by user: ${req.session.user.email}`);

  // Check database connection
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return res.status(500).json({ error: 'Database configuration error' });
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res);
        break;
      
      case 'POST':
        await handlePost(req, res);
        break;
      
      case 'PUT':
        await handlePut(req, res);
        break;
      
      case 'DELETE':
        await handleDelete(req, res);
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  try {
    const { clientId, activityType, limit = 50 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let query;
    
    // Build base query with user access control
    const baseFrom = `
      FROM client_activity ca
      JOIN clients c ON ca.client_id = c.id
    `;
    
    const userFilter = ['admin', 'dpr_manager'].includes(userRole) 
      ? '' 
      : `JOIN client_assignments cas ON c.id = cas.client_id AND cas.user_id = ${userId} AND cas.status = 'active'`;

    if (clientId) {
      const clientIdNum = parseInt(clientId);
      if (isNaN(clientIdNum)) {
        return res.status(400).json({ error: 'Invalid client ID' });
      }
      
      // Verify user has access to this specific client
      if (!['admin', 'dpr_manager'].includes(userRole)) {
        const hasAccess = await sql`
          SELECT 1 FROM client_assignments 
          WHERE client_id = ${clientIdNum} AND user_id = ${userId} AND status = 'active'
        `;
        if (hasAccess.length === 0) {
          return res.status(403).json({ error: 'Access denied to this client' });
        }
      }
      
      query = sql`
        SELECT ca.id, ca.client_id, ca.activity_type, ca.title, ca.content, ca.notes, ca.created_at, ca.updated_at, c.name as client_name 
        ${sql.unsafe(baseFrom)}
        ${sql.unsafe(userFilter)}
        WHERE ca.client_id = ${clientIdNum}
        ORDER BY ca.created_at DESC
        LIMIT ${Math.min(parseInt(limit) || 50, 100)}
      `;
    } else if (activityType) {
      if (!['trend', 'idea', 'pr'].includes(activityType)) {
        return res.status(400).json({ error: 'Invalid activity type' });
      }
      query = sql`
        SELECT ca.id, ca.client_id, ca.activity_type, ca.title, ca.content, ca.notes, ca.created_at, ca.updated_at, c.name as client_name 
        ${sql.unsafe(baseFrom)}
        ${sql.unsafe(userFilter)}
        WHERE ca.activity_type = ${activityType}
        ORDER BY ca.created_at DESC
        LIMIT ${Math.min(parseInt(limit) || 50, 100)}
      `;
    } else {
      query = sql`
        SELECT ca.id, ca.client_id, ca.activity_type, ca.title, ca.content, ca.notes, ca.created_at, ca.updated_at, c.name as client_name 
        ${sql.unsafe(baseFrom)}
        ${sql.unsafe(userFilter)}
        ORDER BY ca.created_at DESC
        LIMIT ${Math.min(parseInt(limit) || 50, 100)}
      `;
    }

    const activities = await query;
    
    // Convert to camelCase for frontend
    const camelCaseActivities = activities.map(toCamelCase);
    
    return res.status(200).json(camelCaseActivities);
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    return res.status(500).json({ error: 'Failed to fetch activities' });
  }
}

async function handlePost(req, res) {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  // Validate input data
  const validationErrors = validateActivityData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Check if client exists and user has access
    let clientAccess;
    if (['admin', 'dpr_manager'].includes(userRole)) {
      clientAccess = await sql`
        SELECT id FROM clients WHERE id = ${req.body.clientId}
      `;
    } else {
      clientAccess = await sql`
        SELECT c.id FROM clients c
        INNER JOIN client_assignments ca ON c.id = ca.client_id
        WHERE c.id = ${req.body.clientId} AND ca.user_id = ${userId} AND ca.status = 'active'
      `;
    }

    if (clientAccess.length === 0) {
      return res.status(403).json({ error: 'Client not found or access denied' });
    }

    // Sanitize input data
    const sanitizedData = {
      clientId: req.body.clientId,
      activityType: req.body.activityType.trim(),
      title: req.body.title?.trim() || null,
      content: req.body.content ? sanitizeContent(req.body.content) : null,
      notes: req.body.notes?.trim() || null
    };

    const newActivity = await sql`
      INSERT INTO client_activity (
        client_id, activity_type, title, content, notes
      ) VALUES (
        ${sanitizedData.clientId}, ${sanitizedData.activityType}, 
        ${sanitizedData.title}, ${sanitizedData.content}, ${sanitizedData.notes}
      )
      RETURNING *
    `;

    // Convert back to camelCase for response
    const camelCaseActivity = toCamelCase(newActivity[0]);
    
    return res.status(201).json(camelCaseActivity);
  } catch (error) {
    console.error('Failed to create activity:', error);
    return res.status(500).json({ error: 'Failed to create activity' });
  }
}

async function handlePut(req, res) {
  if (!req.body || !req.body.id) {
    return res.status(400).json({ error: 'Activity ID is required for updates' });
  }

  const activityId = parseInt(req.body.id);
  if (isNaN(activityId)) {
    return res.status(400).json({ error: 'Invalid activity ID' });
  }

  // Validate input data (allowing partial updates)
  const validationErrors = validateActivityData(req.body, true);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  try {
    // Check if activity exists
    const existingActivity = await sql`
      SELECT id FROM client_activity WHERE id = ${activityId}
    `;

    if (existingActivity.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Prepare update data (only include provided fields)
    const updates = {};
    
    if (req.body.activityType !== undefined) updates.activity_type = req.body.activityType.trim();
    if (req.body.title !== undefined) updates.title = req.body.title?.trim() || null;
    if (req.body.content !== undefined) updates.content = req.body.content ? sanitizeContent(req.body.content) : null;
    if (req.body.notes !== undefined) updates.notes = req.body.notes?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedActivity = await sql`
      UPDATE client_activity 
      SET 
        activity_type = COALESCE(${updates.activity_type}, activity_type),
        title = COALESCE(${updates.title}, title),
        content = COALESCE(${updates.content}, content),
        notes = COALESCE(${updates.notes}, notes)
      WHERE id = ${activityId}
      RETURNING *
    `;

    if (updatedActivity.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Convert back to camelCase for response
    const camelCaseActivity = toCamelCase(updatedActivity[0]);
    
    return res.status(200).json(camelCaseActivity);
  } catch (error) {
    console.error('Failed to update activity:', error);
    return res.status(500).json({ error: 'Failed to update activity' });
  }
}

async function handleDelete(req, res) {
  if (!req.body || !req.body.id) {
    return res.status(400).json({ error: 'Activity ID is required for deletion' });
  }

  const activityId = parseInt(req.body.id);
  if (isNaN(activityId)) {
    return res.status(400).json({ error: 'Invalid activity ID' });
  }

  try {
    const deletedActivity = await sql`
      DELETE FROM client_activity 
      WHERE id = ${activityId}
      RETURNING *
    `;

    if (deletedActivity.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // Convert back to camelCase for response
    const camelCaseActivity = toCamelCase(deletedActivity[0]);
    
    return res.status(200).json({ 
      message: 'Activity deleted successfully', 
      activity: camelCaseActivity 
    });
  } catch (error) {
    console.error('Failed to delete activity:', error);
    return res.status(500).json({ error: 'Failed to delete activity' });
  }
}

// Export the handler wrapped with authentication
export default withAuth(handler);