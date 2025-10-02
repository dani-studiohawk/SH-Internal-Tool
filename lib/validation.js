const Ajv = require('ajv');

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true, // Remove additional properties not defined in schema
  strict: false
});

// Request size limits (in bytes)
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_STRING_LENGTH = 50000; // 50KB for any single string field
const MAX_ARRAY_LENGTH = 1000; // Max array items

// Content schema for client activities
const contentSchema = {
  type: 'object',
  properties: {
    headline: { 
      type: 'string', 
      maxLength: 500,
      pattern: '^[\\s\\S]*$' // Allow any characters including newlines
    },
    summary: { 
      type: 'string', 
      maxLength: 5000,
      pattern: '^[\\s\\S]*$'
    },
    sources: { 
      type: 'array', 
      items: { 
        type: 'string',
        maxLength: 2000 // Reasonable URL length limit
      }, 
      maxItems: 50 
    },
    trends: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          keyword: { type: 'string', maxLength: 100 },
          relevance: { type: 'number', minimum: 0, maximum: 1 },
          sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
        },
        additionalProperties: false
      },
      maxItems: 20
    },
    keywords: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 30
    },
    category: {
      type: 'string',
      maxLength: 100
    },
    priority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'urgent']
    },
    metadata: {
      type: 'object',
      properties: {
        analysisDate: { type: 'string', format: 'date-time' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        version: { type: 'string', maxLength: 20 }
      },
      additionalProperties: true
    }
  },
  additionalProperties: true // Allow other properties for flexibility
};

// Compile the validator
const validateContent = ajv.compile(contentSchema);

// Validation function
function validateClientActivityContent(content) {
  if (!content || typeof content !== 'object') {
    return {
      isValid: false,
      errors: ['Content must be a valid object']
    };
  }

  const isValid = validateContent(content);
  
  if (!isValid) {
    const errors = validateContent.errors.map(error => {
      const path = error.instancePath || 'root';
      return `${path}: ${error.message}`;
    });
    
    return {
      isValid: false,
      errors,
      details: validateContent.errors
    };
  }

  return {
    isValid: true,
    errors: []
  };
}

// Sanitize content by removing potentially dangerous properties
function sanitizeContent(content) {
  if (!content || typeof content !== 'object') {
    return content;
  }

  // Create a copy to avoid mutating the original
  const sanitized = JSON.parse(JSON.stringify(content));
  
  // Remove potentially dangerous properties
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  function removeDangerousKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key of dangerousKeys) {
      delete obj[key];
    }
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        removeDangerousKeys(value);
      }
    }
    
    return obj;
  }
  
  return removeDangerousKeys(sanitized);
}

// Additional schema for trend analysis responses
const trendAnalysisSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string', maxLength: 2000 },
    trends: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trend: { type: 'string', maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          relevance: { type: 'number', minimum: 0, maximum: 1 },
          sources: { type: 'array', items: { type: 'string' }, maxItems: 10 }
        },
        required: ['trend', 'description'],
        additionalProperties: false
      },
      maxItems: 10
    },
    insights: {
      type: 'array',
      items: { type: 'string', maxLength: 500 },
      maxItems: 5
    }
  },
  required: ['summary', 'trends'],
  additionalProperties: false
};

const validateTrendAnalysis = ajv.compile(trendAnalysisSchema);

// Additional validation schemas for security

// Client data schema
const clientSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', maxLength: 200, pattern: '^[\\w\\s\\-\\.&,]+$' },
    industry: { type: 'string', maxLength: 100, pattern: '^[\\w\\s\\-\\.&,]+$' },
    website: { type: 'string', maxLength: 200, pattern: '^https?://[\\w\\-\\.]+(:[0-9]+)?(/.*)?$' },
    notes: { type: 'string', maxLength: 2000 }
  },
  required: ['name'],
  additionalProperties: false
};

// User assignment schema
const userAssignmentSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' },
    clientIds: {
      type: 'array',
      items: { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' },
      maxItems: 100
    }
  },
  required: ['userId', 'clientIds'],
  additionalProperties: false
};

// Request size validation middleware
function validateRequestSize(req, res, next) {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > MAX_REQUEST_SIZE) {
    return res.status(413).json({ 
      error: 'Request too large',
      message: `Request size ${contentLength} exceeds maximum allowed size of ${MAX_REQUEST_SIZE} bytes`
    });
  }
  next();
}

// Generic validation middleware factory
function createValidationMiddleware(schema, propertyName = 'body') {
  const validator = ajv.compile(schema);
  
  return (req, res, next) => {
    const data = req[propertyName];
    
    if (!validator(data)) {
      const errors = validator.errors.map(error => ({
        field: error.instancePath || error.dataPath || 'root',
        message: error.message,
        value: error.data
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}

const validateClient = ajv.compile(clientSchema);
const validateUserAssignment = ajv.compile(userAssignmentSchema);

module.exports = {
  contentSchema,
  clientSchema,
  userAssignmentSchema,
  trendAnalysisSchema,
  validateContent,
  validateClient,
  validateUserAssignment,
  validateTrendAnalysis,
  validateRequestSize,
  createValidationMiddleware,
  validateClientActivityContent,
  sanitizeContent,
  MAX_REQUEST_SIZE,
  MAX_STRING_LENGTH,
  MAX_ARRAY_LENGTH
};