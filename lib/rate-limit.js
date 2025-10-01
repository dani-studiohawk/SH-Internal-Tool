const rateLimit = require('express-rate-limit');

// Store for tracking user-based rate limits
const userRequestCounts = new Map();
const USER_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// IP-based rate limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: {
    error: 'Too many AI requests from this IP, please try again later',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  }
});

// User-based rate limiter for authenticated endpoints
function createUserRateLimit(maxRequests = 20) {
  return (req, res, next) => {
    if (!req.session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.session.user.id;
    const now = Date.now();
    const windowStart = now - USER_LIMIT_WINDOW;

    // Get or create user request history
    let userRequests = userRequestCounts.get(userId) || [];
    
    // Filter out old requests
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if user has exceeded limit
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests from this user, please try again later',
        retryAfter: Math.ceil((Math.min(...userRequests) + USER_LIMIT_WINDOW - now) / 1000)
      });
    }

    // Add current request
    userRequests.push(now);
    userRequestCounts.set(userId, userRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      cleanupOldEntries();
    }

    next();
  };
}

// Cleanup function to prevent memory leaks
function cleanupOldEntries() {
  const now = Date.now();
  const windowStart = now - USER_LIMIT_WINDOW;
  
  for (const [userId, requests] of userRequestCounts.entries()) {
    const activeRequests = requests.filter(timestamp => timestamp > windowStart);
    if (activeRequests.length === 0) {
      userRequestCounts.delete(userId);
    } else {
      userRequestCounts.set(userId, activeRequests);
    }
  }
}

// Utility to apply both IP and user rate limiting
function applyRateLimit(req, res, next) {
  aiLimiter(req, res, (err) => {
    if (err) return next(err);
    
    const userLimit = createUserRateLimit(15); // 15 requests per user per 15 minutes
    userLimit(req, res, next);
  });
}

// Get current usage stats for a user (for dashboard)
function getUserUsageStats(userId) {
  const userRequests = userRequestCounts.get(userId) || [];
  const now = Date.now();
  const windowStart = now - USER_LIMIT_WINDOW;
  const activeRequests = userRequests.filter(timestamp => timestamp > windowStart);
  
  return {
    requestsInWindow: activeRequests.length,
    windowMs: USER_LIMIT_WINDOW,
    oldestRequest: activeRequests.length > 0 ? Math.min(...activeRequests) : null
  };
}

module.exports = {
  aiLimiter,
  createUserRateLimit,
  applyRateLimit,
  getUserUsageStats
};