/**
 * Authentication middleware for API routes
 * Protects API endpoints by requiring valid session
 */

import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"

/**
 * Middleware to protect API routes with authentication
 * @param {NextApiRequest} req - The request object
 * @param {NextApiResponse} res - The response object
 * @returns {Promise<Object|null>} Session object if authenticated, null otherwise
 */
export async function requireAuth(req, res) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'You must be signed in to access this resource'
    })
    return null
  }
  
  return session
}

/**
 * Higher-order function that wraps API handlers with authentication
 * @param {Function} handler - The API route handler function
 * @returns {Function} Wrapped handler with authentication check
 */
export function withAuth(handler) {
  return async (req, res) => {
    const session = await requireAuth(req, res)
    
    if (!session) {
      // Response already sent by requireAuth
      return
    }
    
    // Add session to request object for use in handler
    req.session = session
    
    // Call the original handler
    return handler(req, res)
  }
}

/**
 * Enhanced API fetcher that includes authentication headers
 * Updates the existing fetcher to work with authenticated endpoints
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
}

/**
 * Check if user has required role/permission
 * @param {Object} session - The user session
 * @param {string} requiredRole - The required role (admin, user, etc.)
 * @returns {boolean} Whether user has required role
 */
export function hasRole(session, requiredRole = 'user') {
  // For now, all authenticated Studio Hawk users have access
  // This can be extended later with role-based access control
  return session && session.user && session.user.email
}

/**
 * Middleware for role-based access control
 * @param {string} requiredRole - The required role
 * @returns {Function} Middleware function
 */
export function requireRole(requiredRole = 'user') {
  return (handler) => {
    return async (req, res) => {
      const session = await requireAuth(req, res)
      
      if (!session) {
        return // Response already sent by requireAuth
      }
      
      if (!hasRole(session, requiredRole)) {
        res.status(403).json({ 
          error: 'Forbidden',
          message: 'You do not have permission to access this resource'
        })
        return
      }
      
      req.session = session
      return handler(req, res)
    }
  }
}