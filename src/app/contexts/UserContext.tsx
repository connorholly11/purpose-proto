'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@prisma/client';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
  users: User[];
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users);
      
      // If we don't have a current user but users exist, set the first one
      if (!currentUser && data.users.length > 0) {
        setCurrentUser(data.users[0]);
        
        // Save to localStorage for persistence
        localStorage.setItem('currentUserId', data.users[0].id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user from localStorage on initial mount
  useEffect(() => {
    const loadSavedUser = async () => {
      setIsLoading(true);
      const savedUserId = localStorage.getItem('currentUserId');
      
      if (savedUserId) {
        try {
          const response = await fetch(`/api/users/${savedUserId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setCurrentUser(data.user);
            }
          }
        } catch (error) {
          console.error('Error loading saved user:', error);
        }
      }
      
      await fetchUsers();
    };
    
    loadSavedUser();
  }, []);

  // When current user changes, save to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUserId', currentUser.id);
    }
  }, [currentUser]);

  const refreshUsers = async () => {
    await fetchUsers();
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, isLoading, users, refreshUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 