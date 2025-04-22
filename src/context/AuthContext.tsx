import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth, useUser } from '@clerk/clerk-expo';

// SecureStore token cache
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// AuthContext type definition
type AuthContextType = {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  userId: null,
  isAdmin: false,
  signOut: async () => {},
});

// Props for the AuthProvider component
type AuthProviderProps = {
  children: ReactNode;
};

// Define founder IDs (admin users)
const FOUNDER_CLERK_IDS = process.env.EXPO_PUBLIC_FOUNDER_CLERK_IDS?.split(',') || [
  'user_2v0kHfelRcU1cBqg5o47ZymuGvM',
  'user_2v0kJwxV4JT2PaJKmaXZabSjFgM',
  'user_2v0kIR1s6RI1tzMU0dF2HhH5LgG',
  'user_2v0kMGsms1l0HxWxbtY3SRkSK9A',
  'user_2v0kLICcJO5KHQhEOlFm9c3ojYn',
  'user_2v0kKj7nLBrJBVE2vtLUburjVm6',
];

// AuthProvider component to wrap the app with auth functionality
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isSignedIn, isLoaded, userId, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if the current user is an admin
  useEffect(() => {
    if (isSignedIn && userId) {
      // Make all signed-in users admins
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [isSignedIn, userId]);
  
  // We've moved push notification registration to App.tsx using proper hooks

  // --- Add Logging ---
  useEffect(() => {
    console.log('[AuthContext] Clerk State Update:', { isLoaded, isSignedIn, userId });
  }, [isLoaded, isSignedIn, userId]);
  // --- End Logging ---

  // Context value
  const value: AuthContextType = {
    isSignedIn: isSignedIn || false,
    isLoaded,
    userId: userId || null,
    isAdmin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;