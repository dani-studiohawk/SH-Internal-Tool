/**
 * Custom Sign In page for Studio Hawk Internal Tool
 * Provides branded authentication experience
 */

import { useState, useEffect } from 'react'
import { getProviders, getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function SignIn({ providers }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleSignIn = async (providerId) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn(providerId, {
        callbackUrl: router.query.callbackUrl || '/',
        redirect: false,
      })
      
      if (result?.error) {
        setError('Sign in failed. Please try again.')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <div className="logo">
            <div className="logo-icon">SH</div>
            <div className="logo-gradient"></div>
          </div>
          <h1>Studio Hawk</h1>
          <h2>Internal Tool</h2>
          <p>Sign in with your Studio Hawk account to access the dashboard</p>
        </div>
        
        <div className="signin-form">
          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
            </div>
          )}
          
          {providers && Object.values(providers).map((provider) => (
            <button
              key={provider.name}
              onClick={() => handleSignIn(provider.id)}
              disabled={isLoading}
              className="signin-button"
            >
              {isLoading ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  <svg className="google-icon" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with {provider.name}
                </>
              )}
            </button>
          ))}
          
          <div className="signin-footer">
            <p>🔒 Secure authentication</p>
            <p>Only Studio Hawk email addresses are permitted</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .signin-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .signin-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(0, 201, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(0, 201, 255, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .signin-card {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 20px;
          padding: 3rem;
          max-width: 400px;
          width: 100%;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(0, 201, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 201, 255, 0.2);
          position: relative;
          z-index: 1;
        }

        .signin-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem auto;
        }

        .logo-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #00C9FF 0%, #0099cc 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          box-shadow: 0 10px 30px rgba(0, 201, 255, 0.3);
          position: relative;
          z-index: 1;
        }

        .logo-gradient {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(135deg, #00C9FF, #0099cc, #00C9FF);
          border-radius: 22px;
          z-index: 0;
          opacity: 0.7;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { opacity: 0.7; transform: scale(1); }
          to { opacity: 1; transform: scale(1.02); }
        }

        h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 0.25rem 0;
          background: linear-gradient(135deg, #00C9FF 0%, #0099cc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        h2 {
          font-size: 1rem;
          font-weight: 500;
          color: #718096;
          margin: 0 0 1rem 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        p {
          color: #718096;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 12px;
          color: #c53030;
          font-size: 0.9rem;
        }

        .signin-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: white;
          color: #2d3748;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .signin-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 201, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .signin-button:hover {
          border-color: #00C9FF;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 201, 255, 0.2);
        }

        .signin-button:hover::before {
          left: 100%;
        }

        .signin-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .google-icon {
          width: 20px;
          height: 20px;
        }

        .loading-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #e2e8f0;
          border-top: 2px solid #00C9FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .signin-footer {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          margin-top: 1rem;
        }

        .signin-footer p {
          font-size: 0.8rem;
          color: #718096;
          margin: 0.25rem 0;
        }

        .signin-footer p:first-child {
          color: #00C9FF;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .signin-card {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }
          
          .logo {
            width: 60px;
            height: 60px;
          }
          
          .logo-icon {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
          }
          
          h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export async function getServerSideProps(context) {
  const providers = await getProviders()
  return {
    props: {
      providers,
    },
  }
}