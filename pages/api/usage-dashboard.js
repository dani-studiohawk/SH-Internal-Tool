const { withAuth } = require('../../lib/auth-middleware');
const { getUserUsageStats } = require('../../lib/rate-limit');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.session.user.id;
    const userEmail = req.session.user.email;
    
    // Get current usage stats
    const usageStats = getUserUsageStats(userId);
    
    // Calculate remaining requests and reset time
    const maxRequests = 15; // Should match the limit in rate-limit.js
    const remainingRequests = Math.max(0, maxRequests - usageStats.requestsInWindow);
    
    let resetTime = null;
    if (usageStats.oldestRequest) {
      resetTime = new Date(usageStats.oldestRequest + usageStats.windowMs);
    }

    const dashboardData = {
      user: {
        id: userId,
        email: userEmail
      },
      rateLimit: {
        windowMs: usageStats.windowMs,
        maxRequests,
        requestsInWindow: usageStats.requestsInWindow,
        remainingRequests,
        resetTime,
        isLimited: remainingRequests === 0
      },
      endpoints: {
        'analyze-trends': {
          description: 'AI-powered trend analysis',
          cost: 'High - Uses OpenAI GPT-4',
          rateLimited: true
        },
        'generate-ideas': {
          description: 'AI-generated content ideas',
          cost: 'High - Uses OpenAI GPT-4',
          rateLimited: true
        },
        'generate-headlines': {
          description: 'AI-generated headlines',
          cost: 'High - Uses OpenAI GPT-4',
          rateLimited: true
        },
        'generate-press-release': {
          description: 'AI-generated press releases',
          cost: 'High - Uses OpenAI GPT-4',
          rateLimited: true
        },
        'client-activities': {
          description: 'Client activity management',
          cost: 'Low - Database operations only',
          rateLimited: true
        }
      },
      recommendations: [
        'Rate limits reset every 15 minutes',
        'Consider batching requests to optimize usage',
        'AI operations have the highest cost impact',
        'Contact admin if you need higher limits for your workflow'
      ]
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return res.status(500).json({ error: 'Failed to retrieve usage statistics' });
  }
}

export default withAuth(handler);