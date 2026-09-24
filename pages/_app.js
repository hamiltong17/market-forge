import { Analytics } from '@vercel/analytics/react';
import '../styles/globals.css';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover" />
        <meta charSet="utf-8" />
        <meta name="description" content="AI-powered options trading recommendations with Forge Picks. Real-time market analysis, CALL/PUT strategies, and market sentiment for active traders." />
        <meta name="keywords" content="options trading, stock market, AI trading, forge picks, market analysis, call options, put options, trading recommendations" />
        <meta name="author" content="MarketForge" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:title" content="MarketForge | AI-Powered Trading" />
        <meta property="og:description" content="AI-powered trading recommendations, real-time market analysis, and Forge Picks for active traders." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mrktforge.com" />
        <meta property="og:image" content="https://mrktforge.com/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MarketForge | AI-Powered Trading" />
        <meta name="twitter:description" content="AI-powered trading recommendations, real-time market analysis, and Forge Picks." />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        
        <title>MarketForge | AI-Powered Trading</title>
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}