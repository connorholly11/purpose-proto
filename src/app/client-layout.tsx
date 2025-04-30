'use client';

import React, { useState, useEffect } from 'react';
import { AdminContext } from '@components/AppHeader';
import AppHeader from '@components/AppHeader';
import { NavBar } from '@components/NavBar';
import FeedbackButton from '@components/FeedbackButton';
import { ChatProvider } from '../context/ChatContext';

// Define NavItem interface
interface NavItem {
  name: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Effect to load admin mode from localStorage on mount
  useEffect(() => {
    // On mount, check local storage
    const storedMode = localStorage.getItem('adminMode');
    if (storedMode) {
      setIsAdminMode(storedMode === 'true');
    }
  }, []);

  // Handler function to update both state and localStorage
  const handleSetAdminMode = (value: boolean) => {
    setIsAdminMode(value);
    localStorage.setItem('adminMode', String(value));
  };

  // Navigation items
  const navItems: NavItem[] = [
    { name: 'AI Companion', path: '/ai-companion', icon: 'chat-bubble' },
    { name: 'Quests', path: '/quests', icon: 'emoji-events' },
    { name: 'Profile', path: '/profile', icon: 'person' },
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard', adminOnly: true },
    { name: 'System Prompts', path: '/prompts', icon: 'settings', adminOnly: true },
    { name: 'Admin Tools', path: '/admin', icon: 'admin-panel-settings', adminOnly: true },
    { name: 'Testing', path: '/testing', icon: 'science', adminOnly: true },
    { name: 'Evaluations', path: '/eval', icon: 'score', adminOnly: true },
  ];

  return (
    <ChatProvider>
      <AdminContext.Provider value={{ isAdminMode, setIsAdminMode: handleSetAdminMode }}>
        <AppHeader />
        <main className="main-content">
          {children}
        </main>
        <NavBar items={navItems} isAdminMode={isAdminMode} />
        {isAdminMode && <FeedbackButton />}
      </AdminContext.Provider>
    </ChatProvider>
  );
}