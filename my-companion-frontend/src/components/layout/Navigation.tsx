'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, ClipboardList } from 'lucide-react';

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  
  const navItems = [
    {
      name: 'Chat',
      href: '/',
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      name: 'Logs',
      href: '/logs',
      icon: <ClipboardList className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="flex justify-center border-b bg-background">
      <div className="container flex items-center">
        <div className="mr-4 py-3">
          <Link href="/" className="text-xl font-bold">
            AI Companion
          </Link>
        </div>
        
        <div className="flex flex-1 items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-colors hover:text-primary ${
                  isActive
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
