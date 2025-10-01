/**
 * Custom Error page for authentication errors
 * Shows user-friendly error messages for authentication failures
 */

import { useRouter } from 'next/router'
import Link from 'next/link'

const errorMessages = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. Only Studio Hawk email addresses are permitted.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
}

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  const errorMessage = errorMessages[error] || errorMessages.Default

  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-header">
          <div className="error-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h1>Authentication Error</h1>
          <p className="error-message">{errorMessage}</p>
        </div>
        
        <div className="error-content">
          {error === 'AccessDenied' && (
            <div className="access-denied-info">
              <div className="info-icon">🔒</div>
              <h3>Access Restricted</h3>
              <p>
                This application is only available to Studio Hawk team members. 
                Please use your @studiohawk.com.au or @studiohawk.com email address.
              </p>
            </div>
          )}
          
          <div className="error-actions">
            <Link href="/api/auth/signin" className="primary-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10,17 15,12 10,7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Try Again
            </Link>
            
            <Link href="/" className="secondary-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
              Go Home
            </Link>
          </div>
          
          <div className="error-footer">
            <p>If you continue to experience issues, please contact your system administrator.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .error-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(220, 53, 69, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(220, 53, 69, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .error-card {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 20px;
          padding: 3rem;
          max-width: 500px;
          width: 100%;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(220, 53, 69, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(220, 53, 69, 0.2);
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .error-header {
          margin-bottom: 2rem;
        }

        .error-icon {
          color: #dc3545;
          margin-bottom: 1.5rem;
        }

        h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 1rem 0;
        }

        .error-message {
          color: #718096;
          font-size: 1.1rem;
          line-height: 1.5;
          margin: 0;
        }

        .error-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .access-denied-info {
          background: #fff8e1;
          border: 1px solid #ffcc02;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .info-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .access-denied-info h3 {
          color: #f57c00;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .access-denied-info p {
          color: #ef6c00;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }

        .error-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .primary-button, .secondary-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .primary-button {
          background: #00C9FF;
          color: white;
          border: 2px solid #00C9FF;
        }

        .primary-button:hover {
          background: #0099cc;
          border-color: #0099cc;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 201, 255, 0.3);
        }

        .secondary-button {
          background: white;
          color: #2d3748;
          border: 2px solid #e2e8f0;
        }

        .secondary-button:hover {
          border-color: #cbd5e0;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .error-footer {
          text-align: center;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .error-footer p {
          font-size: 0.8rem;
          color: #718096;
          margin: 0;
        }

        @media (max-width: 480px) {
          .error-card {
            padding: 2rem 1.5rem;
            margin: 1rem;
          }
          
          h1 {
            font-size: 1.5rem;
          }
          
          .error-actions {
            gap: 0.75rem;
          }
          
          .primary-button, .secondary-button {
            padding: 0.875rem 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}