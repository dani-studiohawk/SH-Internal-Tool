import { neon } from '@neondatabase/serverless';
import { withAuth } from '../../lib/auth-middleware';
import { applyReadRateLimit, applyWriteRateLimit } from '../../lib/rate-limit';
import { validateRequestSize, createValidationMiddleware, clientSchema } from '../../lib/validation';

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

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = value;
  }
  return result;
}

// Input validation functions
function validateClientData(data, isUpdate = false) {
  const errors = [];

  // Required field validation (only for creation)
  if (!isUpdate && (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)) {
    errors.push('Name is required');
  }

  // String length validation
  if (data.name && (typeof data.name !== 'string' || data.name.length > 200)) {
    errors.push('Name must be a string under 200 characters');
  }

  if (data.industry && (typeof data.industry !== 'string' || data.industry.length > 200)) {
    errors.push('Industry must be a string under 200 characters');
  }

  if (data.leadDpr && (typeof data.leadDpr !== 'string' || data.leadDpr.length > 200)) {
    errors.push('Lead DPR must be a string under 200 characters');
  }

  if (data.url && (typeof data.url !== 'string' || data.url.length > 500)) {
    errors.push('URL must be a string under 500 characters');
  }

  if (data.status && !['active', 'inactive', 'archived'].includes(data.status)) {
    errors.push('Status must be active, inactive, or archived');
  }

  // Array validation
  if (data.outreachLocations && (!Array.isArray(data.outreachLocations) || data.outreachLocations.length > 20)) {
    errors.push('Outreach locations must be an array with max 20 items');
  }

  return errors;
}

async function handler(req, res) {
  // Apply rate limiting based on method
  if (req.method === 'GET') {
    return applyReadRateLimit(req, res, async () => {
      await handleRequest(req, res);
    });
  } else {
    return applyWriteRateLimit(req, res, async () => {
      await handleRequest(req, res);
    });
  }
}

async function handleRequest(req, res) {
  // Check database connection
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return res.status(500).json({ error: 'Database configuration error' });
  }

  // Validate request size
  validateRequestSize(req, res, () => {});

  // User session is available in req.session (provided by withAuth)
  console.log(`API accessed by user: ${req.session.user.email}`);

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
    const userId = req.user.id;
    const userRole = req.user.role;

    let clients;
    
    // Admin and DPR managers can see all clients
    if (['admin', 'dpr_manager'].includes(userRole)) {
      clients = await sql`
        SELECT 
          id, name, industry, status, url, lead_dpr, tone_of_voice, 
          spheres, outreach_locations, created_at, updated_at
        FROM clients 
        ORDER BY name ASC
      `;
    } else {
      // Regular users can only see assigned clients
      clients = await sql`
        SELECT 
          c.id, c.name, c.industry, c.status, c.url, c.lead_dpr, 
          c.tone_of_voice, c.spheres, c.outreach_locations, 
          c.created_at, c.updated_at
        FROM clients c
        INNER JOIN client_assignments ca ON c.id = ca.client_id
        WHERE ca.user_id = ${userId} AND ca.status = 'active'
        ORDER BY c.name ASC
      `;
    }
    
    // Convert to camelCase for frontend
    const camelCaseClients = clients.map(toCamelCase);
    
    return res.status(200).json(camelCaseClients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return res.status(500).json({ error: 'Failed to fetch clients' });
  }
}

async function handlePost(req, res) {
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  // Validate input data
  const validationErrors = validateClientData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  try {
    // Sanitize input data
    const sanitizedData = {
      name: req.body.name.trim(),
      industry: req.body.industry?.trim() || null,
      leadDpr: req.body.leadDpr?.trim() || null,
      boilerplate: req.body.boilerplate?.trim() || null,
      pressContacts: req.body.pressContacts?.trim() || null,
      url: req.body.url?.trim() || null,
      toneOfVoice: req.body.toneOfVoice?.trim() || null,
      spheres: req.body.spheres?.trim() || null,
      status: req.body.status || 'active',
      outreachLocations: req.body.outreachLocations || []
    };

    // Convert to snake_case for database
    const dbData = toSnakeCase(sanitizedData);

    const newClient = await sql`
      INSERT INTO clients (
        name, industry, lead_dpr, boilerplate, press_contacts, 
        url, tone_of_voice, spheres, status, outreach_locations
      ) VALUES (
        ${dbData.name}, ${dbData.industry}, ${dbData.lead_dpr}, 
        ${dbData.boilerplate}, ${dbData.press_contacts}, ${dbData.url}, 
        ${dbData.tone_of_voice}, ${dbData.spheres}, ${dbData.status}, 
        ${dbData.outreach_locations}
      )
      RETURNING *
    `;

    // Convert back to camelCase for response
    const camelCaseClient = toCamelCase(newClient[0]);
    
    return res.status(201).json(camelCaseClient);
  } catch (error) {
    console.error('Failed to create client:', error);
    return res.status(500).json({ error: 'Failed to create client' });
  }
}

async function handlePut(req, res) {
  if (!req.body || !req.body.id) {
    return res.status(400).json({ error: 'Client ID is required for updates' });
  }

  const clientId = parseInt(req.body.id);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  const userId = req.user.id;
  const userRole = req.user.role;

  // Validate input data (allowing partial updates)
  const validationErrors = validateClientData(req.body, true);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: validationErrors });
  }

  try {
    // Check if client exists and user has access
    let existingClient;
    
    if (['admin', 'dpr_manager'].includes(userRole)) {
      existingClient = await sql`
        SELECT id FROM clients WHERE id = ${clientId}
      `;
    } else {
      existingClient = await sql`
        SELECT c.id FROM clients c
        INNER JOIN client_assignments ca ON c.id = ca.client_id
        WHERE c.id = ${clientId} AND ca.user_id = ${userId} AND ca.status = 'active'
      `;
    }

    if (existingClient.length === 0) {
      return res.status(404).json({ error: 'Client not found or access denied' });
    }

    // Prepare update data (only include provided fields)
    const updates = {};
    
    if (req.body.name !== undefined) updates.name = req.body.name.trim();
    if (req.body.industry !== undefined) updates.industry = req.body.industry?.trim() || null;
    if (req.body.leadDpr !== undefined) updates.lead_dpr = req.body.leadDpr?.trim() || null;
    if (req.body.boilerplate !== undefined) updates.boilerplate = req.body.boilerplate?.trim() || null;
    if (req.body.pressContacts !== undefined) updates.press_contacts = req.body.pressContacts?.trim() || null;
    if (req.body.url !== undefined) updates.url = req.body.url?.trim() || null;
    if (req.body.toneOfVoice !== undefined) updates.tone_of_voice = req.body.toneOfVoice?.trim() || null;
    if (req.body.spheres !== undefined) updates.spheres = req.body.spheres?.trim() || null;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.outreachLocations !== undefined) updates.outreach_locations = req.body.outreachLocations;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedClient = await sql`
      UPDATE clients 
      SET 
        name = COALESCE(${updates.name}, name),
        industry = COALESCE(${updates.industry}, industry),
        lead_dpr = COALESCE(${updates.lead_dpr}, lead_dpr),
        boilerplate = COALESCE(${updates.boilerplate}, boilerplate),
        press_contacts = COALESCE(${updates.press_contacts}, press_contacts),
        url = COALESCE(${updates.url}, url),
        tone_of_voice = COALESCE(${updates.tone_of_voice}, tone_of_voice),
        spheres = COALESCE(${updates.spheres}, spheres),
        status = COALESCE(${updates.status}, status),
        outreach_locations = COALESCE(${updates.outreach_locations}, outreach_locations),
        updated_at = NOW()
      WHERE id = ${clientId}
      RETURNING *
    `;

    if (updatedClient.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Convert back to camelCase for response
    const camelCaseClient = toCamelCase(updatedClient[0]);
    
    return res.status(200).json(camelCaseClient);
  } catch (error) {
    console.error('Failed to update client:', error);
    return res.status(500).json({ error: 'Failed to update client' });
  }
}

async function handleDelete(req, res) {
  if (!req.body || !req.body.id) {
    return res.status(400).json({ error: 'Client ID is required for deletion' });
  }

  const clientId = parseInt(req.body.id);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  const userId = req.user.id;
  const userRole = req.user.role;

  // Only admins can delete clients
  if (!['admin'].includes(userRole)) {
    return res.status(403).json({ error: 'Insufficient permissions to delete clients' });
  }

  try {
    const deletedClient = await sql`
      DELETE FROM clients 
      WHERE id = ${clientId}
      RETURNING *
    `;

    if (deletedClient.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Convert back to camelCase for response
    const camelCaseClient = toCamelCase(deletedClient[0]);
    
    return res.status(200).json({ 
      message: 'Client deleted successfully', 
      client: camelCaseClient 
    });
  } catch (error) {
    console.error('Failed to delete client:', error);
    return res.status(500).json({ error: 'Failed to delete client' });
  }
}

// Export the handler wrapped with authentication
export default withAuth(handler);