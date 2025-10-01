/**
 * Authentication Guard Component
 * Protects routes and shows appropriate UI based on authentication status
 */

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated and not on an auth page, redirect to sign in
    if (status === 'loading') return; // Still loading
    
    if (!session && !router.pathname.startsWith('/auth') && router.pathname !== '/api/auth/signin') {
      router.push('/api/auth/signin');
    }
  }, [session, status, router]);

  // Show loading spinner while session is loading
  if (status === 'loading') {
    return (
      <div className="auth-loading">
        <div className="auth-loading-content">
          <div className="auth-spinner"></div>
          <h2>Studio Hawk</h2>
          <p>Loading your session...</p>
        </div>
        <style jsx>{`
          .auth-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%);
            color: white;
          }
          .auth-loading-content {
            text-align: center;
            padding: 2rem;
          }
          .auth-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 201, 255, 0.3);
            border-top: 3px solid #00C9FF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem auto;
          }
          h2 {
            color: #00C9FF;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // If not authenticated and not on auth pages, don't render content (redirect will happen)
  if (!session && !router.pathname.startsWith('/auth')) {
    return null;
  }

  // Render children if authenticated or on auth pages
  return children;
}