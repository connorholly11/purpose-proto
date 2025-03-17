'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Chat', path: '/', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ) },
    { name: 'Logs', path: '/logs', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ) },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className={`sticky top-0 z-10 transition-all duration-200 ${
        scrolled ? 'bg-white shadow-md' : 'bg-gradient-to-r from-blue-600 to-blue-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 mr-2 ${scrolled ? 'text-blue-600' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.71.355a1.5 1.5 0 11-1.214 2.75l-.94-.47a1.5 1.5 0 01-.53-2.051L15.75 9.75M8.25 9.75L15.75 9.75" />
                </svg>
                <span className={`text-xl font-bold ${scrolled ? 'text-gray-800' : 'text-white'}`}>AI Companion</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-1 items-center">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                    pathname === item.path
                      ? scrolled 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-blue-700 text-white'
                      : scrolled 
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-white hover:bg-blue-500'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-md ${
                  scrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-blue-500'
                } focus:outline-none`}
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {/* Icon for menu */}
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-200 ease-in-out ${isMobileMenuOpen ? 'max-h-60' : 'max-h-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-6">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
} 