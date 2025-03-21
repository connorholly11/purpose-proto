'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserSelector from './UserSelector';

const Navigation = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path ? 'bg-indigo-800' : '';
  };

  return (
    <nav className="bg-indigo-900 text-white py-3 px-4 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="font-bold text-xl mb-2 sm:mb-0">AI Voice Companion</div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-1">
            <Link href="/" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')} hover:bg-indigo-700 transition-colors`}>
              Chat
            </Link>
            <Link href="/logs" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/logs')} hover:bg-indigo-700 transition-colors`}>
              Logs
            </Link>
            <Link href="/admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin')} hover:bg-indigo-700 transition-colors`}>
              Admin
            </Link>
            <Link href="/rag" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/rag')} hover:bg-indigo-700 transition-colors`}>
              RAG
            </Link>
            <Link href="/system-prompts" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/system-prompts')} hover:bg-indigo-700 transition-colors`}>
              System Prompts
            </Link>
          </div>
          <UserSelector />
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 