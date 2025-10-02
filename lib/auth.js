/**
 * NextAuth.js configuration for Studio Hawk Internal Tool
 * Provides OAuth authentication with Google provider only (simplified)
 */

import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  
  jwt: {
    // Rotate JWT tokens more frequently
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token
        token.provider = account.provider
        token.id = user.id
      }
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.accessToken = token.accessToken
        session.provider = token.provider
        session.user.id = token.id
      }
      return session
    },
    
    async signIn({ user, account, profile }) {
      // Allow sign in only for Studio Hawk email domains
      const allowedDomains = ['studiohawk.com.au', 'studiohawk.com']
      const emailDomain = user.email?.split('@')[1]
      
      if (!allowedDomains.includes(emailDomain)) {
        return false // This will redirect to error page
      }
      
      // Store user in database if first time
      try {
        await createOrUpdateUser(user, account, profile)
        return true
      } catch (error) {
        console.error('Error storing user:', error)
        return false
      }
    },
  },
  
  events: {
    async signIn({ user }) {
      console.log(`User ${user.email} signed in`)
    },
    async signOut({ session }) {
      console.log(`User ${session?.user?.email} signed out`)
      // Clear client-side storage on signout
      if (typeof window !== 'undefined') {
        try {
          const { secureClearAll } = await import('./secure-storage')
          secureClearAll()
        } catch (error) {
          console.error('Error clearing secure storage on logout:', error)
        }
      }
    },
  },
}

/**
 * Create or update user in database
 * @param {Object} user - User object from OAuth provider
 * @param {Object} account - Account object from OAuth provider
 * @param {Object} profile - Profile object from OAuth provider
 */
async function createOrUpdateUser(user, account, profile) {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL)
  
  try {
    // Check if user exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE email = ${user.email}
    `
    
    const userData = {
      email: user.email,
      name: user.name || profile?.name,
      image: user.image || profile?.picture,
      provider: account.provider,
      provider_id: account.providerAccountId,
      last_login: new Date().toISOString(),
    }
    
    if (existingUsers.length > 0) {
      // Update existing user
      await sql`
        UPDATE users 
        SET 
          name = ${userData.name},
          image = ${userData.image},
          last_login = ${userData.last_login}
        WHERE email = ${userData.email}
      `
    } else {
      // Create new user
      await sql`
        INSERT INTO users (email, name, image, provider, provider_id, last_login, created_at)
        VALUES (
          ${userData.email},
          ${userData.name},
          ${userData.image},
          ${userData.provider},
          ${userData.provider_id},
          ${userData.last_login},
          ${new Date().toISOString()}
        )
      `
    }
  } catch (error) {
    console.error('Database error in createOrUpdateUser:', error)
    throw error
  }
}