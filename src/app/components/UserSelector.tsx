'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const UserSelector = () => {
  const { currentUser, setCurrentUser, users, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
    setIsOpen(false);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading users...</div>;
  }

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium 
                  text-[var(--imessage-blue)] bg-blue-50 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700 
                  border border-[var(--imessage-border)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentUser?.name || 'Select User'}</span>
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-gray-800 
                       border border-[var(--imessage-border)] overflow-hidden backdrop-blur-lg z-10">
          <div className="py-1">
            <div className="text-xs text-gray-500 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
              Switch Account
            </div>
            {users.map((user) => (
              <button
                key={user.id}
                className={`block w-full text-left px-4 py-2.5 text-sm ${
                  currentUser?.id === user.id 
                    ? 'bg-blue-50 dark:bg-gray-700 text-[var(--imessage-blue)]' 
                    : 'text-gray-700 dark:text-gray-300'
                } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                onClick={() => handleSelect(user.id)}
              >
                <div className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-[var(--imessage-blue)] text-white flex items-center justify-center text-xs mr-2">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span>{user.name || 'Anonymous'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector; 