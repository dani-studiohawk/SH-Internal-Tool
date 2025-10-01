/**
 * API utility functions for the Studio Hawk Internal Tool
 * Provides reusable functions for data fetching with proper error handling and authentication
 */

/**
 * Enhanced API fetcher that includes authentication headers
 * @param {string} url - The API endpoint to fetch from
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} The response data as JSON
 * @throws {Error} When the response is not ok or network fails
 */
export const authenticatedFetcher = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session
      ...options,
    });

    if (response.status === 401) {
      // Redirect to sign in page
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/signin'
      }
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError) {
      throw new Error('Network error: Unable to connect to the server')
    }
    throw error
  }
};

/**
 * Generic fetcher function that handles HTTP responses and errors
 * @param {string} url - The API endpoint to fetch from
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} The response data as JSON
 * @throws {Error} When the response is not ok or network fails
 * @deprecated Use authenticatedFetcher instead for authenticated requests
 */
export const fetcher = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session
      ...options,
    });

    if (response.status === 401) {
      // Redirect to sign in page
      window.location.href = '/api/auth/signin'
      throw new Error('Authentication required')
    }

    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError) {
      throw new Error('Network error: Unable to connect to the server');
    }
    throw error;
  }
};

/**
 * Get all clients from the database
 * @returns {Promise<Array>} Array of client objects
 * @throws {Error} When the request fails
 */
export const getClients = async () => {
  return authenticatedFetcher('/api/clients');
};

/**
 * Create a new client in the database
 * @param {Object} clientData - The client data to create
 * @param {string} clientData.name - Client name (required)
 * @param {string} [clientData.industry] - Client industry
 * @param {string} [clientData.leadDpr] - Lead DPR name
 * @param {string} [clientData.boilerplate] - Company boilerplate text
 * @param {string} [clientData.pressContacts] - Press contact information
 * @param {string} [clientData.url] - Client website URL
 * @param {string} [clientData.toneOfVoice] - Tone of voice guidelines
 * @param {string} [clientData.spheres] - Spheres of relevance
 * @param {string} [clientData.status] - Client status (active/inactive)
 * @param {Array<string>} [clientData.outreachLocations] - Outreach locations
 * @returns {Promise<Object>} The created client object
 * @throws {Error} When the request fails or validation errors occur
 */
export const createClient = async (clientData) => {
  return authenticatedFetcher('/api/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
};

/**
 * Update an existing client in the database
 * @param {Object} clientData - The client data to update (must include id)
 * @param {number|string} clientData.id - Client ID (required)
 * @param {string} [clientData.name] - Client name
 * @param {string} [clientData.industry] - Client industry
 * @param {string} [clientData.leadDpr] - Lead DPR name
 * @param {string} [clientData.boilerplate] - Company boilerplate text
 * @param {string} [clientData.pressContacts] - Press contact information
 * @param {string} [clientData.url] - Client website URL
 * @param {string} [clientData.toneOfVoice] - Tone of voice guidelines
 * @param {string} [clientData.spheres] - Spheres of relevance
 * @param {string} [clientData.status] - Client status (active/inactive)
 * @param {Array<string>} [clientData.outreachLocations] - Outreach locations
 * @returns {Promise<Object>} The updated client object
 * @throws {Error} When the request fails or client not found
 */
export const updateClient = async (clientData) => {
  if (!clientData.id) {
    throw new Error('Client ID is required for updates');
  }
  
  return authenticatedFetcher('/api/clients', {
    method: 'PUT',
    body: JSON.stringify(clientData),
  });
};

/**
 * Delete a client from the database
 * @param {number|string} clientId - The ID of the client to delete
 * @returns {Promise<Object>} Success response
 * @throws {Error} When the request fails or client not found
 */
export const deleteClient = async (clientId) => {
  if (!clientId) {
    throw new Error('Client ID is required for deletion');
  }
  
  return authenticatedFetcher('/api/clients', {
    method: 'DELETE',
    body: JSON.stringify({ id: clientId }),
  });
};