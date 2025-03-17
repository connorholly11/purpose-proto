'use client';

import React, { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { Toaster } from 'sonner';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1 container mx-auto p-4">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
};
