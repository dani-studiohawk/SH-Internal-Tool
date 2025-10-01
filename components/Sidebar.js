import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styles from '../styles/Sidebar.module.css';

export default function Sidebar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut({ callbackUrl: '/api/auth/signin' });
    } catch (error) {
      console.error('Sign out error:', error);
      setSigningOut(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.sidebar}>
        <h2>Studio Hawk</h2>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.sidebar}>
        <h2>Studio Hawk</h2>
        <div className={styles.signInPrompt}>
          <div className={styles.signInIcon}>🔐</div>
          <h3>Sign In Required</h3>
          <p>Please sign in to access the Studio Hawk internal tools</p>
          <Link href="/api/auth/signin" className={styles.signInButton}>
            <svg className={styles.googleIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign In with Google
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <div className={styles.header}>
          <h2>Studio Hawk</h2>
          <div className={styles.subtitle}>Internal Tool</div>
        </div>
        
        <nav className={styles.nav}>
          <ul>
            <li><Link href="/" className={router.pathname === '/' ? styles.active : ''}>📊 Dashboard</Link></li>
            <li><Link href="/client-directory" className={router.pathname === '/client-directory' ? styles.active : ''}>👥 Client Directory</Link></li>
            <li><Link href="/trend-assistant" className={router.pathname === '/trend-assistant' ? styles.active : ''}>📈 Trend Assistant</Link></li>
            <li><Link href="/ideation-assistant" className={router.pathname === '/ideation-assistant' ? styles.active : ''}>💡 Ideation Assistant</Link></li>
            <li><Link href="/headline-assistant" className={router.pathname === '/headline-assistant' ? styles.active : ''}>📰 Headline Assistant</Link></li>
            <li><Link href="/pr-writing-assistant" className={router.pathname === '/pr-writing-assistant' ? styles.active : ''}>✍️ PR Writing Assistant</Link></li>
            <li><Link href="/alerts" className={router.pathname === '/alerts' ? styles.active : ''}>🔔 Alerts</Link></li>
            <li><Link href="/settings" className={router.pathname === '/settings' ? styles.active : ''}>⚙️ Settings</Link></li>
          </ul>
        </nav>
        
        <div className={styles.userProfile}>
          <div className={styles.userInfo}>
            {session.user.image && (
              <img 
                src={session.user.image} 
                alt={session.user.name} 
                className={styles.userAvatar}
              />
            )}
            <div className={styles.userDetails}>
              <div className={styles.userName}>{session.user.name}</div>
              <div className={styles.userEmail}>{session.user.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className={styles.signOutButton}
            title="Sign out"
          >
            {signingOut ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <svg className={styles.signOutIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16,17 21,12 16,7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}