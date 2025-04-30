'use client';

import React, { useState } from 'react';
import { AdminContext } from '@components/AppHeader';
import AppHeader from '@components/AppHeader';
import { NavBar } from '@components/NavBar';
import FeedbackButton from '@components/FeedbackButton';

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
    <AdminContext.Provider value={{ isAdminMode, setIsAdminMode }}>
      <AppHeader />
      <main className="main-content">
        {children}
      </main>
      <NavBar items={navItems} isAdminMode={isAdminMode} />
      {isAdminMode && <FeedbackButton />}
    </AdminContext.Provider>
  );
}