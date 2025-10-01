/**
 * Authentication Test Page
 * Demonstrates the authentication system and provides testing interface
 */

import { useSession, getSession } from 'next-auth/react'
import { useState } from 'react'

export default function AuthTest({ initialSession }) {
  const { data: session, status } = useSession()
  const [apiTest, setApiTest] = useState({ loading: false, result: null, error: null })

  const testAPI = async () => {
    setApiTest({ loading: true, result: null, error: null })
    
    try {
      const response = await fetch('/api/clients', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiTest({ loading: false, result: `✅ API Success: Retrieved ${data.length} clients`, error: null })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setApiTest({ loading: false, result: null, error: `❌ API Error: ${response.status} - ${errorData.message || 'Unknown error'}` })
      }
    } catch (error) {
      setApiTest({ loading: false, result: null, error: `❌ Network Error: ${error.message}` })
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication System Test</h1>
        
        {/* Authentication Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          
          {session ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-green-700 font-medium">Authenticated</span>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Name:</strong> {session.user.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {session.user.email}
                  </div>
                  <div>
                    <strong>Provider:</strong> {session.provider || 'Unknown'}
                  </div>
                  <div>
                    <strong>Session ID:</strong> {session.user.id || 'N/A'}
                  </div>
                </div>
                
                {session.user.image && (
                  <div className="mt-4">
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="text-red-700 font-medium">Not Authenticated</span>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p>You are not currently signed in. This page should redirect you to the sign-in page.</p>
              </div>
            </div>
          )}
        </div>

        {/* API Test */}
        {session && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">API Protection Test</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Test if the API endpoints are properly protected and accessible with authentication:
              </p>
              
              <button
                onClick={testAPI}
                disabled={apiTest.loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {apiTest.loading ? 'Testing API...' : 'Test /api/clients Endpoint'}
              </button>
              
              {apiTest.result && (
                <div className="bg-green-50 border border-green-200 rounded p-4 text-green-800">
                  {apiTest.result}
                </div>
              )}
              
              {apiTest.error && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
                  {apiTest.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Security Features</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ OAuth Authentication (Google, Azure AD)</li>
                <li>✅ Domain-Restricted Access (@studiohawk.com.*)</li>
                <li>✅ All API Routes Protected</li>
                <li>✅ Session Management</li>
                <li>✅ CSRF Protection</li>
                <li>✅ User Database Tracking</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Technical Details</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li><strong>Framework:</strong> NextAuth.js</li>
                <li><strong>Session Strategy:</strong> JWT</li>
                <li><strong>Database:</strong> PostgreSQL (Neon)</li>
                <li><strong>Session Duration:</strong> 30 days</li>
                <li><strong>Protection Level:</strong> All API endpoints</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps(context) {
  const session = await getSession(context)
  
  return {
    props: {
      initialSession: session,
    },
  }
}