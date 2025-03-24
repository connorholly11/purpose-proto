import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import { UserProvider } from "./contexts/UserContext";
import FeedbackButton from './components/FeedbackButton';
import Head from 'next/head';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Voice Companion',
  description: 'Your personal AI voice companion with memory and knowledge',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AI Companion',
  },
};

export const viewport = {
  themeColor: '#3b82f6', 
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI Voice Companion" />
        <meta name="theme-color" content="#4e95ff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Background gradient with soft peaceful colors */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50/90 via-indigo-50/80 to-sky-50/90 dark:from-slate-900 dark:via-blue-950/90 dark:to-slate-900/90 -z-10"></div>
        <div className="fixed inset-0 bg-grid-pattern bg-grid-light dark:bg-grid-dark opacity-[0.03] -z-10"></div>
        
        <UserProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-grow py-2 px-2 md:py-6 md:px-4">
              <div 
                style={{ 
                  background: 'var(--container-gradient)',
                  boxShadow: 'var(--card-shadow)',
                  borderRadius: '18px',
                  border: '1px solid rgba(226, 232, 240, 0.7)',
                }}
                className="mx-auto h-full max-w-4xl overflow-hidden backdrop-blur-md dark:border-slate-700/40"
              >
                {children}
              </div>
            </main>
            <FeedbackButton />
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
