import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import ClientLayout from './client-layout';

// Metadata is allowed here because we don't have "use client"
export const metadata: Metadata = {
  title: 'AI Companion App',
  description: 'Your AI companion application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </ClerkProvider>
      </body>
    </html>
  );
}