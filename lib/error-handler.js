/**
 * Secure error handling middleware for API routes
 * Prevents information disclosure while maintaining proper logging
 */

// Generic error messages for different types of errors
const ERROR_MESSAGES = {
  VALIDATION: 'The request data is invalid',
  AUTHENTICATION: 'Authentication required',
  AUTHORIZATION: 'Insufficient permissions',
  NOT_FOUND: 'The requested resource was not found',
  RATE_LIMIT: 'Too many requests, please try again later',
  DATABASE: 'A database error occurred',
  EXTERNAL_API: 'An external service error occurred',
  INTERNAL: 'An internal server error occurred'
};

// Error types that should log full details server-side
const DETAILED_ERROR_TYPES = [
  'DATABASE_CONNECTION',
  'EXTERNAL_API_ERROR',
  'INTERNAL_SERVER_ERROR',
  'CONFIGURATION_ERROR'
];

/**
 * Handle and format errors for API responses
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} context - Additional context for logging
 */
function handleApiError(error, req, res, context = '') {
  const timestamp = new Date().toISOString();
  const userId = req.session?.user?.id || 'anonymous';
  const endpoint = `${req.method} ${req.url}`;
  
  // Log full error details server-side
  console.error(`[${timestamp}] API Error - ${context}`, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: req.method,
      url: req.url,
      userId,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    },
    context
  });

  // Determine error type and response
  let statusCode = 500;
  let clientMessage = ERROR_MESSAGES.INTERNAL;
  let errorCode = 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    statusCode = 400;
    clientMessage = ERROR_MESSAGES.VALIDATION;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
    statusCode = 401;
    clientMessage = ERROR_MESSAGES.AUTHENTICATION;
    errorCode = 'AUTHENTICATION_ERROR';
  } else if (error.message.includes('permission') || error.message.includes('Forbidden')) {
    statusCode = 403;
    clientMessage = ERROR_MESSAGES.AUTHORIZATION;
    errorCode = 'AUTHORIZATION_ERROR';
  } else if (error.message.includes('not found') || error.message.includes('Not Found')) {
    statusCode = 404;
    clientMessage = ERROR_MESSAGES.NOT_FOUND;
    errorCode = 'NOT_FOUND_ERROR';
  } else if (error.message.includes('rate limit') || error.message.includes('Too Many Requests')) {
    statusCode = 429;
    clientMessage = ERROR_MESSAGES.RATE_LIMIT;
    errorCode = 'RATE_LIMIT_ERROR';
  } else if (error.message.includes('database') || error.message.includes('SQL')) {
    statusCode = 500;
    clientMessage = ERROR_MESSAGES.DATABASE;
    errorCode = 'DATABASE_ERROR';
  } else if (error.message.includes('fetch') || error.message.includes('API')) {
    statusCode = 502;
    clientMessage = ERROR_MESSAGES.EXTERNAL_API;
    errorCode = 'EXTERNAL_API_ERROR';
  }

  // Security: Never expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    error: clientMessage,
    code: errorCode,
    timestamp
  };

  // In development, include more details for debugging
  if (isDevelopment) {
    response.details = {
      message: error.message,
      stack: error.stack,
      endpoint
    };
  }

  res.status(statusCode).json(response);
}

/**
 * Middleware wrapper for async route handlers
 * Automatically catches and handles errors
 */
function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, req, res, `Handler: ${handler.name || 'anonymous'}`);
    }
  };
}

/**
 * Database error handler with specific error type detection
 */
function handleDatabaseError(error, req, res, operation = '') {
  const context = `Database Operation: ${operation}`;
  
  // Log additional database-specific context
  console.error(`Database Error in ${operation}:`, {
    error: error.message,
    code: error.code,
    detail: error.detail,
    hint: error.hint,
    position: error.position,
    query: error.query
  });

  handleApiError(error, req, res, context);
}

/**
 * Validation error formatter
 */
function formatValidationErrors(errors) {
  return errors.map(error => ({
    field: error.field || error.instancePath || 'unknown',
    message: error.message || 'Invalid value',
    code: error.keyword || 'VALIDATION_ERROR'
  }));
}

/**
 * Rate limit error handler
 */
function handleRateLimitError(req, res, retryAfter = 900) {
  const response = {
    error: ERROR_MESSAGES.RATE_LIMIT,
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter,
    timestamp: new Date().toISOString()
  };

  res.status(429).json(response);
}

module.exports = {
  handleApiError,
  withErrorHandler,
  handleDatabaseError,
  formatValidationErrors,
  handleRateLimitError,
  ERROR_MESSAGES
};