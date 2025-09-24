import '../styles/globals.css';
import Sidebar from '../components/Sidebar';
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Studio Hawk - Internal Tool</title>
      </Head>
      <div className="layout">
        <Sidebar />
        <div className="main-content">
          <Component {...pageProps} />
        </div>
      </div>
    </>
  );
}