import '../styles/globals.css';
import Sidebar from '../components/Sidebar';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function App({ Component, pageProps }) {
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
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>Studio Hawk - Internal Tool</title>
      </Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Component {...pageProps} />
        </div>
      </div>
    </QueryClientProvider>
  );
}