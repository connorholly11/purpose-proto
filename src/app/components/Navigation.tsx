'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserSelector from './UserSelector';

const Navigation = () => {
  const pathname = usePathname();
  
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
    { href: '/admin', label: 'Admin', icon: <span>👤</span> },
  ];

  return (
    <nav 
      style={{ 
        background: 'var(--nav-gradient)',
        borderBottom: '1px solid var(--imessage-border)'
      }}
      className="backdrop-blur-lg py-3 px-4 shadow-sm sticky top-0 z-20 dark:bg-slate-900/90"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div 
          style={{ color: 'var(--primary-blue)' }}
          className="font-bold text-xl mb-3 sm:mb-0 flex items-center"
        >
          <span className="text-2xl mr-2">💬</span>
          <span className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
            AI Voice Companion
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div 
            style={{ background: 'rgba(237, 240, 245, 0.6)' }}
            className="flex space-x-1 rounded-full p-1 dark:bg-slate-800/60"
          >
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center space-x-1 ${
                  isActive(link.href) 
                    ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700/70'
                }`}
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