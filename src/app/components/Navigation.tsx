'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserSelector from './UserSelector';
import { useState } from 'react';

const Navigation = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    // Check if the current path is the given path or starts with it (for admin sections)
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Simplified navigation with just Chat and Admin
  const links = [
    { href: '/', label: 'Chat', icon: <span>💬</span> },
    { href: '/logs', label: 'Logs', icon: <span>📊</span> },
    { href: '/admin', label: 'Admin', icon: <span>👤</span> },
    { href: '/rag', label: 'Test RAG', icon: <span>🔍</span> },
    { href: '/pwa-test', label: 'PWA Test', icon: <span>📱</span> },
  ];

  return (
    <nav 
      className="sticky top-0 z-20 backdrop-blur-lg py-2 px-3 sm:py-3 sm:px-4 shadow-sm border-b border-gray-200 dark:border-slate-700/40 bg-white/90 dark:bg-slate-900/90"
    >
      <div className="w-full mx-auto flex items-center justify-between">
        <div 
          className="font-bold text-lg sm:text-xl flex items-center"
        >
          <span className="text-xl sm:text-2xl mr-2">💬</span>
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent hidden sm:inline">
            AI Voice Companion
          </span>
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent sm:hidden">
            AI Companion
          </span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div 
            className="flex space-x-1 rounded-full p-1 bg-gray-100/80 dark:bg-slate-800/60"
          >
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`px-2 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center space-x-1 ${
                  isActive(link.href) 
                    ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700/70'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className={isActive(link.href) ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
          <UserSelector />
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 