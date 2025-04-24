import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';

export type AdminContextType = {
  unlocked: boolean;
  toggle: () => void;
};

export const AdminContext = createContext<AdminContextType>({
  unlocked: false,
  toggle: () => {}
});

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false);

  // Load the admin unlock state from SecureStore on mount
  useEffect(() => {
    const loadAdminState = async () => {
      try {
        const storedValue = await SecureStore.getItemAsync('adminUnlocked');
        setUnlocked(storedValue === '1');
      } catch (error) {
        console.error('Error loading admin state:', error);
      }
    };

    loadAdminState();
  }, []);

  // Toggle function that persists state in SecureStore
  const toggle = async () => {
    try {
      const newState = !unlocked;
      setUnlocked(newState);
      await SecureStore.setItemAsync('adminUnlocked', newState ? '1' : '0');
    } catch (error) {
      console.error('Error saving admin state:', error);
    }
  };

  return (
    <AdminContext.Provider value={{ unlocked, toggle }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => useContext(AdminContext);
