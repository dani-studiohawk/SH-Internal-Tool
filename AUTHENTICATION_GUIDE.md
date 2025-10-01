# Authentication Implementation Guide

## Overview

This document outlines the comprehensive authentication system implemented for the Studio Hawk Internal Tool. The system addresses the critical security vulnerability where all API endpoints were previously public and unprotected.

## Authentication Architecture

### 1. NextAuth.js Integration
- **Provider**: NextAuth.js with OAuth providers (Google and Microsoft Azure AD)
- **Session Strategy**: JWT tokens for stateless authentication
- **Database**: User records stored in PostgreSQL (Neon)
- **Domain Restriction**: Access limited to @studiohawk.com.au and @studiohawk.com email addresses

### 2. File Structure
```
lib/
├── auth.js                 # NextAuth configuration and callbacks
└── auth-middleware.js      # Authentication middleware for API routes

pages/
├── api/
│   ├── auth/
│   │   └── [...nextauth].js # NextAuth API route handler
│   └── *.js                # All API routes now protected
└── auth/
    ├── signin.js           # Custom sign-in page
    └── error.js            # Authentication error page

scripts/
├── setup-auth-tables.js   # Database migration for users table
└── add-auth-to-apis.js     # Script to protect existing API routes
```

## Security Features Implemented

### 1. Database Security
- **Users Table**: Secure storage of user authentication data
- **Indexed Queries**: Optimized database queries with proper indexing
- **Audit Trail**: User login tracking and session management

### 2. API Protection
- **Universal Protection**: All API endpoints require authentication
- **Session Validation**: Server-side session verification on every request
- **Automatic Redirects**: Unauthenticated requests redirect to sign-in

### 3. Frontend Security
- **Session Provider**: React context for authentication state
- **Protected Components**: UI components adapt based on authentication status
- **Secure Fetching**: All API calls include authentication credentials

## Implementation Details

### 1. Environment Variables Required

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft Azure AD (Optional)
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

### 2. Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. API Route Protection

All API routes are now wrapped with the `withAuth` middleware:

```javascript
import { withAuth } from '../../lib/auth-middleware';

async function handler(req, res) {
  // User session available in req.session
  console.log(`API accessed by user: ${req.session.user.email}`);
  
  // Your existing API logic here
}

export default withAuth(handler);
```

## Setup Instructions

### 1. Database Migration
```bash
npm run db:setup-auth
```

### 2. OAuth Provider Setup

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to .env.local

#### Microsoft Azure AD Setup:
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory
3. App registrations → New registration
4. Set redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
5. Generate client secret
6. Copy Application ID, Secret, and Tenant ID to .env.local

### 3. Generate NextAuth Secret
```bash
openssl rand -base64 32
```

### 4. Start Development Server
```bash
npm run dev
```

## Security Benefits

### Before Implementation:
- ❌ No authentication system
- ❌ Public API endpoints
- ❌ No user tracking
- ❌ No access control
- ❌ Data vulnerable to unauthorized access

### After Implementation:
- ✅ OAuth-based authentication
- ✅ All API endpoints protected
- ✅ User session management
- ✅ Domain-restricted access
- ✅ Secure data access patterns
- ✅ Audit trail for user actions
- ✅ Automatic session expiration
- ✅ CSRF protection via NextAuth

## Testing the Implementation

### 1. Authentication Flow
1. Visit any page requiring authentication
2. Automatic redirect to sign-in page
3. OAuth provider selection
4. Domain validation
5. User creation/update in database
6. Redirect to requested page

### 2. API Protection
```bash
# This will fail without authentication
curl http://localhost:3000/api/clients

# This requires valid session cookie
curl -b "next-auth.session-token=..." http://localhost:3000/api/clients
```

### 3. Session Management
- Sessions expire after 30 days
- Automatic refresh on page navigation
- Clean logout functionality

## Monitoring and Maintenance

### 1. User Activity Logging
All API requests now log the authenticated user:
```
API accessed by user: john.doe@studiohawk.com.au
```

### 2. Database Monitoring
Monitor the users table for:
- User registration patterns
- Login frequency
- Failed authentication attempts

### 3. Security Updates
- Regularly update NextAuth.js
- Monitor OAuth provider security bulletins
- Review and rotate secrets periodically

## Troubleshooting

### Common Issues:

1. **"Configuration Error"**
   - Check NEXTAUTH_SECRET is set
   - Verify OAuth credentials

2. **"Access Denied"**
   - Confirm email domain (@studiohawk.com.au or @studiohawk.com)
   - Check OAuth provider configuration

3. **"Database Error"**
   - Ensure users table exists
   - Verify DATABASE_URL connection

4. **Session Issues**
   - Clear browser cookies
   - Check NEXTAUTH_URL matches current domain

## Future Enhancements

### 1. Role-Based Access Control (RBAC)
- Admin/User roles
- Feature-specific permissions
- API endpoint granular access

### 2. Enhanced Security
- Multi-factor authentication (MFA)
- IP allowlisting
- Session timeout policies

### 3. Audit Features
- Detailed action logging
- User activity dashboard
- Security event monitoring

---

## Emergency Procedures

If authentication breaks:
1. Check environment variables
2. Verify database connectivity
3. Review OAuth provider status
4. Check application logs
5. Fallback: Temporarily disable auth for critical fixes

**Security Contact**: For security issues, immediately contact the system administrator.

---

*Last Updated: October 1, 2025*
*Implementation Status: ✅ Complete*