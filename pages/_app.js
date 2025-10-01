import '../styles/globals.css';
import Sidebar from '../components/Sidebar';
import AuthGuard from '../components/AuthGuard';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { secureClearAll } from '../lib/secure-storage';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  // Create a new QueryClient instance for each app render
  // This ensures server-side rendering works correctly
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 seconds
        staleTime: 5000,
        // Data stays in cache for 10 minutes after being unused
        cacheTime: 10 * 60 * 1000,
        // Refetch data when user returns to the window
        refetchOnWindowFocus: true,
        // Only retry failed requests once to avoid excessive retries
        retry: 1,
      },
    },
  }));

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <LogoutHandler />
        <Head>
          <title>Studio Hawk - Internal Tool</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        </Head>
        <AuthGuard>
          <div className="layout">
            <Sidebar />
            <div className="main-content">
              <Component {...pageProps} />
            </div>
          </div>
        </AuthGuard>
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Component to handle logout and clear secure storage
function LogoutHandler() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    // Clear storage when session ends (user logs out)
    if (status === 'unauthenticated') {
      secureClearAll();
    }
  }, [status]);
  
  // Add global logout function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.secureLogout = () => {
        secureClearAll();
        signOut();
      };
    }
  }, []);
  
  return null;
}