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
        className="flex items-center space-x-2 bg-indigo-800 rounded-md px-3 py-1 text-sm text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentUser?.name || 'Select User'}</span>
        <svg
          className="h-4 w-4"
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
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {users.map((user) => (
              <button
                key={user.id}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  currentUser?.id === user.id ? 'bg-indigo-100 text-indigo-900' : 'text-gray-700'
                } hover:bg-gray-100`}
                onClick={() => handleSelect(user.id)}
              >
                {user.name || 'Anonymous'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector; 